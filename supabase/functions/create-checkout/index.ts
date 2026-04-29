import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { priceId, returnUrl, environment } = await req.json();

    if (!priceId || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (environment !== "sandbox" && environment !== "live") {
      return new Response(JSON.stringify({ error: "Invalid environment" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!returnUrl) {
      return new Response(JSON.stringify({ error: "Missing returnUrl" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticated user — required for paid checkout
    const authHeader = req.headers.get("Authorization");
    let userId: string | undefined;
    let customerEmail: string | undefined;
    if (authHeader) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (user) {
        userId = user.id;
        customerEmail = user.email;
      }
    }
    if (!userId) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Block duplicate active subscriptions for the same price
    if (priceId === "pro_monthly" || priceId === "studio_monthly") {
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("price_id, status")
        .eq("user_id", userId)
        .eq("environment", environment)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (sub && sub.status !== "canceled" && sub.price_id === priceId) {
        return new Response(JSON.stringify({ error: "You're already on this plan." }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // If switching plans, route to change-plan instead of new checkout
      if (sub && sub.status !== "canceled" && sub.price_id !== priceId) {
        return new Response(JSON.stringify({ error: "switch_plan_required", currentPriceId: sub.price_id }), {
          status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const stripe = createStripeClient(environment as StripeEnv);
    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: isRecurring ? "subscription" : "payment",
      ui_mode: "embedded_page",
      return_url: returnUrl,
      customer_email: customerEmail,
      metadata: { userId, priceId },
      ...(isRecurring && { subscription_data: { metadata: { userId, priceId } } }),
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
