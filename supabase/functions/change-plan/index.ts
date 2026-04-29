import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const ALLOWED_PRICE_IDS = new Set(["pro_monthly", "studio_monthly"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }
  try {
    const { newPriceId, environment } = await req.json();
    if (!ALLOWED_PRICE_IDS.has(newPriceId)) return jsonError("Invalid newPriceId", 400);
    if (environment !== "sandbox" && environment !== "live") return jsonError("Invalid environment", 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonError("Authentication required", 401);
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return jsonError("Authentication required", 401);

    // Find current active subscription
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, price_id, status")
      .eq("user_id", user.id)
      .eq("environment", environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub?.stripe_subscription_id) return jsonError("No active subscription", 404);
    if (sub.status === "canceled") return jsonError("Subscription is canceled", 400);
    if (sub.price_id === newPriceId) return jsonError("Already on this plan", 400);

    const stripe = createStripeClient(environment as StripeEnv);
    const prices = await stripe.prices.list({ lookup_keys: [newPriceId] });
    if (!prices.data.length) return jsonError("New price not found", 404);
    const newPrice = prices.data[0];

    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const itemId = stripeSub.items.data[0]?.id;
    if (!itemId) return jsonError("Subscription has no items", 500);

    const updated = await stripe.subscriptions.update(sub.stripe_subscription_id, {
      cancel_at_period_end: false,
      proration_behavior: "create_prorations",
      items: [{ id: itemId, price: newPrice.id }],
    });

    return json({
      success: true,
      status: updated.status,
      newPriceId,
    });
  } catch (e) {
    console.error("change-plan error", e);
    return jsonError(e instanceof Error ? e.message : "Unknown error", 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function jsonError(error: string, status: number) {
  return json({ error }, status);
}
