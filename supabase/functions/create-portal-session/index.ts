import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { environment, returnUrl } = await req.json().catch(() => ({}));
    if (environment !== "sandbox" && environment !== "live") {
      return new Response(JSON.stringify({ error: "Invalid environment" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const env: StripeEnv = environment;

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try requested env first, then fall back to any env so users with a
    // sandbox-created subscription can still manage billing from a live build.
    let { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, environment")
      .eq("user_id", user.id)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub?.stripe_customer_id) {
      const { data: anySub } = await supabase
        .from("subscriptions")
        .select("stripe_customer_id, environment")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      sub = anySub ?? null;
    }

    if (!sub?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: "No subscription found for this account." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const resolvedEnv: StripeEnv = (sub.environment === "live" ? "live" : "sandbox");

    try {
      const stripe = createStripeClient(resolvedEnv);
      const portal = await stripe.billingPortal.sessions.create({
        customer: sub.stripe_customer_id,
        ...(returnUrl ? { return_url: returnUrl } : {}),
      });

      return new Response(JSON.stringify({ url: portal.url }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (stripeErr) {
      console.error("Stripe portal error:", stripeErr);
      const msg = stripeErr instanceof Error ? stripeErr.message : "Stripe error";
      // Common cause in live mode: portal not configured in Stripe dashboard.
      const hint = /configuration/i.test(msg)
        ? "Billing portal is not configured in Stripe. Enable it at https://dashboard.stripe.com/settings/billing/portal."
        : msg;
      return new Response(
        JSON.stringify({ error: hint }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (e) {
    console.error("create-portal-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
