import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient, verifyWebhook } from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

// price_id -> { plan, credits to add }
const PRICE_PLAN_MAP: Record<string, { plan: string; credits: number; monthlyLimit: number }> = {
  starter_pack_onetime: { plan: "starter", credits: 10, monthlyLimit: 0 },
  pro_monthly: { plan: "pro", credits: 50, monthlyLimit: 50 },
  studio_monthly: { plan: "studio", credits: 200, monthlyLimit: 200 },
};

async function resolvePriceId(env: StripeEnv, stripePriceId: string): Promise<string | null> {
  try {
    const stripe = createStripeClient(env);
    const price = await stripe.prices.retrieve(stripePriceId);
    return (price.metadata?.lovable_external_id as string) || null;
  } catch (e) {
    console.error("resolvePriceId failed", e);
    return null;
  }
}

async function grantPlan(userId: string, plan: string, addCredits: number, monthlyLimit: number) {
  const supabase = getSupabase();
  await supabase.from("profiles").update({ plan_type: plan } as any).eq("id", userId);

  const { data: existing } = await supabase
    .from("user_credits")
    .select("credits_remaining")
    .eq("user_id", userId)
    .maybeSingle();

  const current = (existing?.credits_remaining as number) ?? 0;
  await supabase.from("user_credits").upsert({
    user_id: userId,
    credits_remaining: current + addCredits,
    monthly_credit_limit: monthlyLimit,
    credits_used_this_month: 0,
    last_credit_reset: new Date().toISOString(),
  } as any, { onConflict: "user_id" });
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  if (!userId || !priceId) {
    console.error("Missing metadata on checkout.session.completed");
    return;
  }
  const map = PRICE_PLAN_MAP[priceId];
  if (!map) {
    console.error("Unknown priceId in metadata:", priceId);
    return;
  }

  // Record transaction
  await getSupabase().from("transactions").insert({
    user_id: userId,
    product_type: priceId,
    amount: (session.amount_total ?? 0) / 100,
    credits_added: map.credits,
    status: "completed",
    stripe_session_id: session.id,
  } as any);

  // For one-time purchases, grant credits immediately. Subscriptions get granted via subscription.created.
  if (session.mode === "payment") {
    await grantPlan(userId, map.plan, map.credits, map.monthlyLimit);
  }
}

async function handleSubscriptionCreated(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || (await resolvePriceId(env, item?.price?.id));
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").upsert({
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: subscription.customer,
    product_id: productId,
    price_id: priceId,
    status: subscription.status,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    environment: env,
    updated_at: new Date().toISOString(),
  } as any, { onConflict: "stripe_subscription_id" });

  if (priceId && PRICE_PLAN_MAP[priceId]) {
    const map = PRICE_PLAN_MAP[priceId];
    await grantPlan(userId, map.plan, map.credits, map.monthlyLimit);
  }
}

async function handleSubscriptionUpdated(subscription: any, env: StripeEnv) {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || (await resolvePriceId(env, item?.price?.id));
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase().from("subscriptions").update({
    status: subscription.status,
    product_id: productId,
    price_id: priceId,
    current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
    current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    updated_at: new Date().toISOString(),
  } as any).eq("stripe_subscription_id", subscription.id).eq("environment", env);

  // Renewal: top up credits each new period
  const userId = subscription.metadata?.userId;
  if (userId && priceId && PRICE_PLAN_MAP[priceId] && subscription.status === "active") {
    const map = PRICE_PLAN_MAP[priceId];
    // Reset monthly credits on renewal
    await getSupabase().from("user_credits").upsert({
      user_id: userId,
      credits_remaining: map.credits,
      monthly_credit_limit: map.monthlyLimit,
      credits_used_this_month: 0,
      last_credit_reset: new Date().toISOString(),
    } as any, { onConflict: "user_id" });
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase().from("subscriptions").update({
    status: "canceled",
    updated_at: new Date().toISOString(),
  } as any).eq("stripe_subscription_id", subscription.id).eq("environment", env);

  const userId = subscription.metadata?.userId;
  if (userId) {
    // Downgrade to free, keep remaining credits
    await getSupabase().from("profiles").update({ plan_type: "free" } as any).eq("id", userId);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  }
  const env: StripeEnv = rawEnv;

  try {
    const event = await verifyWebhook(req, env);
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object, env);
        break;
      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object, env);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object, env);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object, env);
        break;
      default:
        console.log("Unhandled:", event.type);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200, headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
