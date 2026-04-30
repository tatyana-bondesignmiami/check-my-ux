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

    // Free-plan saved-report cap (3 lifetime). Pro/Studio/Starter unlimited.
    const { data: prof } = await supabase
      .from("profiles")
      .select("plan_type")
      .eq("id", user.id)
      .maybeSingle();
    if ((prof?.plan_type as string) === "free") {
      const { count } = await supabase
        .from("reports")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) >= 3) {
        return new Response(JSON.stringify({ error: "report_cap_reached" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

    const refundCredit = async () => {
      const { data } = await supabase
        .from("user_credits")
        .select("credits_remaining, credits_used_this_month")
        .eq("user_id", user.id)
        .single();
      if (data) {
        await supabase.from("user_credits").update({
          credits_remaining: (data.credits_remaining as number) + 1,
          credits_used_this_month: Math.max(0, (data.credits_used_this_month as number) - 1),
        } as any).eq("user_id", user.id);
      }
    };

    const callAI = async () => {
      return await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
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
    };

    let report: any = null;
    let lastError: { status: number; msg: string } | null = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      const aiRes = await callAI();

      if (!aiRes.ok) {
        const text = await aiRes.text();
        console.error("AI gateway error", aiRes.status, text);
        if (aiRes.status === 429) {
          lastError = { status: 429, msg: "Rate limit reached. Try again in a moment." };
          break;
        }
        if (aiRes.status === 402) {
          lastError = { status: 402, msg: "AI credits exhausted. Please add funds in your workspace settings." };
          break;
        }
        lastError = { status: 500, msg: "AI analysis failed." };
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }

      const data = await aiRes.json();
      const choice = data.choices?.[0];
      const upstreamErr = choice?.error;
      const call = choice?.message?.tool_calls?.[0];

      if (upstreamErr) {
        console.error("Upstream provider error", JSON.stringify(upstreamErr));
        lastError = { status: 502, msg: "AI provider connection issue. Please retry." };
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }

      if (!call?.function?.arguments) {
        console.error("No tool call", JSON.stringify(data).slice(0, 1000));
        lastError = { status: 502, msg: "AI did not return a structured report." };
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }

      try {
        report = JSON.parse(call.function.arguments);
        lastError = null;
        break;
      } catch (e) {
        console.error("JSON parse error", e);
        lastError = { status: 502, msg: "AI returned malformed report." };
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
        continue;
      }
    }

    if (!report) {
      await refundCredit();
      const err = lastError ?? { status: 500, msg: "AI analysis failed." };
      return new Response(JSON.stringify({ error: err.msg }), {
        status: err.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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
