import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Atomic credit deduction (server-only RPC)
    const { data: deducted, error: dErr } = await supabase.rpc("deduct_credit", { _user_id: user.id });
    if (dErr) {
      console.error("deduct_credit error", dErr);
      return new Response(JSON.stringify({ error: "Could not check credits" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!deducted) {
      return new Response(JSON.stringify({ error: "out_of_credits" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageDataUrl, screenType, description } = await req.json();
    if (!imageDataUrl || typeof imageDataUrl !== "string" || !imageDataUrl.startsWith("data:image/")) {
      return new Response(JSON.stringify({ error: "A valid screenshot is required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const SYSTEM_PROMPT = `You are a senior product designer conducting a rigorous visual UX audit of an actual screenshot.

Rules:
- Analyze ONLY what is visibly present in the screenshot. Do not invent issues.
- Be specific. Reference visual evidence ("inconsistent card padding between hero and feature cards", "primary button uses #2563EB but secondary CTA uses #3B82F6", "four font weights detected").
- Avoid generic UX advice. Every point must tie to something in the image.
- Do not say "as an AI model" or refer to yourself.
- Be honest. If the design is good, say so. If something is broken, name it.
- Scores: 1-100. 90+ excellent, 75-89 solid, 60-74 needs work, <60 serious issues.
- accessibility_risk_score: HIGHER means MORE risk (worse).
- Return your analysis ONLY by calling the submit_ux_report tool.`;

    const tool = {
      type: "function",
      function: {
        name: "submit_ux_report",
        description: "Submit the structured visual UX audit report.",
        parameters: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            layout_consistency_score: { type: "number" },
            typography_consistency_score: { type: "number" },
            component_consistency_score: { type: "number" },
            color_consistency_score: { type: "number" },
            visual_hierarchy_score: { type: "number" },
            accessibility_risk_score: { type: "number" },
            strengths: { type: "array", items: { type: "string" } },
            issues: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            priority_fixes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  fix: { type: "string" },
                  severity: { type: "string", enum: ["high", "medium", "low"] },
                },
                required: ["fix", "severity"],
                additionalProperties: false,
              },
            },
            design_system_notes: { type: "string" },
            summary: { type: "string" },
          },
          required: [
            "overall_score","layout_consistency_score","typography_consistency_score",
            "component_consistency_score","color_consistency_score","visual_hierarchy_score",
            "accessibility_risk_score","strengths","issues","recommendations","priority_fixes",
            "design_system_notes","summary",
          ],
          additionalProperties: false,
        },
      },
    };

    const userText = `Audit this ${screenType ?? "screen"} for visual consistency and UX clarity.${
      description ? `\n\nContext: ${description}` : ""
    }\n\nFocus on layout rhythm, spacing, typography scale, color discipline, component reuse, hierarchy, and accessibility risks. Cite visual evidence.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-pro-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: "submit_ux_report" } },
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error", aiRes.status, text);
      // Refund the credit since AI failed
      await supabase.from("user_credits")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .single()
        .then(async ({ data }) => {
          if (data) {
            await supabase.from("user_credits").update({
              credits_remaining: (data.credits_remaining as number) + 1,
            } as any).eq("user_id", user.id);
          }
        });
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
      const msg = status === 429 ? "Rate limit reached. Try again in a moment."
        : status === 402 ? "AI credits exhausted. Please add funds in your workspace settings."
        : "AI analysis failed.";
      return new Response(JSON.stringify({ error: msg }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const call = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!call?.function?.arguments) {
      console.error("No tool call", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "AI did not return a structured report." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const report = JSON.parse(call.function.arguments);
    return new Response(JSON.stringify({ report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-ux error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
