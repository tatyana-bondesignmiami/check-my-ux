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

// price_id -> { plan, credits to add (one-time) OR per-month, monthlyLimit }
const PRICE_PLAN_MAP: Record<string, { plan: string; credits: number; monthlyLimit: number; mode: "subscription" | "onetime" }> = {
  starter_pack_onetime: { plan: "starter", credits: 10, monthlyLimit: 0, mode: "onetime" },
  pro_monthly:         { plan: "pro",     credits: 50, monthlyLimit: 50, mode: "subscription" },
  studio_monthly:      { plan: "studio",  credits: 200, monthlyLimit: 200, mode: "subscription" },
};

async function alreadyProcessed(eventId: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("processed_stripe_events")
    .insert({ event_id: eventId } as any);
  // unique violation = already processed
  if (error && (error as any).code === "23505") return true;
  if (error) {
    console.error("processed_stripe_events insert error", error);
    return false; // fail open — better to retry once than drop the event
  }
  return false;
}

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

async function setProfilePlan(userId: string, plan: string, customerId?: string | null) {
  const supabase = getSupabase();
  const patch: Record<string, unknown> = { plan_type: plan };
  if (customerId) patch.stripe_customer_id = customerId;
  await supabase.from("profiles").update(patch as any).eq("id", userId);
}

async function topUpForRenewal(userId: string, plan: string, monthlyCredits: number, monthlyLimit: number) {
  const supabase = getSupabase();
  // Renewal policy: RESET to plan amount each cycle.
  await supabase.from("user_credits").upsert({
    user_id: userId,
    credits_remaining: monthlyCredits,
    monthly_credit_limit: monthlyLimit,
    credits_used_this_month: 0,
    last_credit_reset: new Date().toISOString(),
  } as any, { onConflict: "user_id" });
  await setProfilePlan(userId, plan);
}

async function addOneTimeCredits(userId: string, addCredits: number, plan: string) {
  const supabase = getSupabase();
  // One-time pack: ADD on top of remaining; do NOT touch monthly_credit_limit
  // (keeps any existing subscription cap intact).
  const { data: existing } = await supabase
    .from("user_credits")
    .select("credits_remaining, monthly_credit_limit")
    .eq("user_id", userId)
    .maybeSingle();
  const current = (existing?.credits_remaining as number) ?? 0;
  const existingLimit = (existing?.monthly_credit_limit as number) ?? 0;
  await supabase.from("user_credits").upsert({
    user_id: userId,
    credits_remaining: current + addCredits,
    monthly_credit_limit: existingLimit, // preserve
    credits_used_this_month: 0,
    last_credit_reset: new Date().toISOString(),
  } as any, { onConflict: "user_id" });

  // Only set plan to "starter" if user is currently free (don't downgrade Pro/Studio)
  const { data: prof } = await supabase.from("profiles").select("plan_type").eq("id", userId).maybeSingle();
  if (prof?.plan_type === "free") {
    await setProfilePlan(userId, plan);
  }
}

async function handleCheckoutCompleted(session: any) {
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

  // Record transaction (idempotent on stripe_session_id)
  const supabase = getSupabase();
  const { data: existingTx } = await supabase
    .from("transactions")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (!existingTx) {
    await supabase.from("transactions").insert({
      user_id: userId,
      product_type: priceId,
      amount: (session.amount_total ?? 0) / 100,
      credits_added: map.credits,
      status: "completed",
      stripe_session_id: session.id,
    } as any);
  }

  // Persist customer_id immediately
  if (session.customer) {
    await setProfilePlan(userId, undefined as any, session.customer);
    // setProfilePlan with undefined plan would null it — handle separately:
  }
  if (session.customer) {
    await supabase.from("profiles").update({ stripe_customer_id: session.customer } as any).eq("id", userId);
  }

  // One-time only: grant credits here. Subscriptions get credits via invoice.payment_succeeded.
  if (map.mode === "onetime" && session.mode === "payment") {
    await addOneTimeCredits(userId, map.credits, map.plan);
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
    cancel_at_period_end: subscription.cancel_at_period_end || false,
    environment: env,
    updated_at: new Date().toISOString(),
  } as any, { onConflict: "stripe_subscription_id" });

  if (priceId && PRICE_PLAN_MAP[priceId]) {
    const map = PRICE_PLAN_MAP[priceId];
    await setProfilePlan(userId, map.plan, subscription.customer);
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

  // Sync plan_type if priceId changed (upgrade/downgrade between Pro/Studio)
  const userId = subscription.metadata?.userId;
  if (userId && priceId && PRICE_PLAN_MAP[priceId] && subscription.status === "active") {
    await setProfilePlan(userId, PRICE_PLAN_MAP[priceId].plan);
  }
  // NOTE: credits are NOT touched here. Renewal top-ups happen in invoice.payment_succeeded.
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase().from("subscriptions").update({
    status: "canceled",
    updated_at: new Date().toISOString(),
  } as any).eq("stripe_subscription_id", subscription.id).eq("environment", env);

  const userId = subscription.metadata?.userId;
  if (userId) {
    // Downgrade to free. Keep remaining credits as a goodwill balance, but drop monthly cap.
    await getSupabase().from("profiles").update({ plan_type: "free" } as any).eq("id", userId);
    await getSupabase().from("user_credits").update({ monthly_credit_limit: 0 } as any).eq("user_id", userId);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any, env: StripeEnv) {
  // Only top up on actual subscription cycles or new subscription creation.
  const reason = invoice.billing_reason as string | undefined;
  if (reason !== "subscription_cycle" && reason !== "subscription_create") return;

  const subId = invoice.subscription || invoice.lines?.data?.[0]?.subscription;
  if (!subId) return;

  const supabase = getSupabase();
  const { data: subRow } = await supabase
    .from("subscriptions")
    .select("user_id, price_id")
    .eq("stripe_subscription_id", subId)
    .eq("environment", env)
    .maybeSingle();

  if (!subRow?.user_id || !subRow?.price_id) {
    console.warn("invoice.payment_succeeded: no matching subscription row", subId);
    return;
  }

  const map = PRICE_PLAN_MAP[subRow.price_id as string];
  if (!map || map.mode !== "subscription") return;

  await topUpForRenewal(subRow.user_id as string, map.plan, map.credits, map.monthlyLimit);
}

async function handleInvoicePaymentFailed(invoice: any, env: StripeEnv) {
  const subId = invoice.subscription;
  if (!subId) return;
  await getSupabase().from("subscriptions").update({
    status: "past_due",
    updated_at: new Date().toISOString(),
  } as any).eq("stripe_subscription_id", subId).eq("environment", env);
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

    // Idempotency: skip if we've seen this event id
    const eventId = (event as any).id as string | undefined;
    if (eventId && (await alreadyProcessed(eventId))) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        status: 200, headers: { "Content-Type": "application/json" },
      });
    }

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
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
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object, env);
        break;
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object, env);
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
