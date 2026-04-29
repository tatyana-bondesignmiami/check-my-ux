import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { environment, mode } = await req.json();
    if (environment !== "sandbox" && environment !== "live") {
      return jsonError("Invalid environment", 400);
    }
    if (mode !== "at_period_end" && mode !== "immediate") {
      return jsonError("Invalid mode", 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("Authentication required", 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return jsonError("Authentication required", 401);

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_subscription_id) return jsonError("No active subscription found", 404);

    const stripe = createStripeClient(environment as StripeEnv);

    if (mode === "immediate") {
      const canceled = await stripe.subscriptions.cancel(sub.stripe_subscription_id);
      return json({ success: true, status: canceled.status, mode });
    } else {
      const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      return json({
        success: true,
        status: updated.status,
        cancel_at_period_end: updated.cancel_at_period_end,
        current_period_end: (updated as any).current_period_end ?? null,
        mode,
      });
    }
  } catch (e) {
    console.error("cancel-subscription error", e);
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function jsonError(error: string, status: number) {
  return json({ error }, status);
}
