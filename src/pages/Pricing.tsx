import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";

interface PlanCard {
  id: string;
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  priceId?: string; // undefined = free
  highlight?: boolean;
}

const PLANS: PlanCard[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    description: "Get started with basic UX audits.",
    features: [
      "3 free audits at signup",
      "Basic UX report",
      "Save up to 3 reports",
    ],
    cta: "Start Free",
  },
  {
    id: "starter",
    name: "Starter Pack",
    price: "$4.99",
    description: "10 audit credits, no subscription.",
    features: [
      "10 audit credits",
      "Full visual consistency report",
      "Saved report history",
    ],
    cta: "Buy 10 Credits",
    priceId: "starter_pack_onetime",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$7.99",
    period: "/month",
    description: "For active designers and PMs.",
    features: [
      "50 audits / month",
      "Full visual consistency report",
      "PDF export",
      "Priority issue ranking",
      "Design system notes",
    ],
    cta: "Upgrade to Pro",
    priceId: "pro_monthly",
    highlight: true,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$19.99",
    period: "/month",
    description: "For teams shipping at scale.",
    features: [
      "200 audits / month",
      "PDF export",
      "Batch uploads",
      "Client-ready report export",
      "Design system notes",
    ],
    cta: "Upgrade to Studio",
    priceId: "studio_monthly",
  },
];

const Pricing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openCheckout, isOpen, checkoutElement, closeCheckout } = useStripeCheckout();
  const [pendingPlan, setPendingPlan] = useState<string | null>(null);

  const handleCta = (plan: PlanCard) => {
    if (!plan.priceId) {
      // Free
      navigate(user ? "/dashboard" : "/signup");
      return;
    }
    if (!user) {
      navigate("/signup", { state: { next: `/pricing?intent=${plan.id}` } });
      return;
    }
    setPendingPlan(plan.id);
    openCheckout({
      priceId: plan.priceId,
      customerEmail: user.email,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <AppShell hideNav={!user}>
      <div className="px-5 pt-12 pb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <Link to={user ? "/dashboard" : "/"} className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <h1 className="text-title-lg mb-2">Pricing</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          Start free. Upgrade when you need more audits, PDF export, or batch uploads.
        </p>

        {isOpen ? (
          <div className="ios-card p-2">
            <div className="flex items-center justify-between p-3">
              <span className="text-sm font-semibold">Complete your purchase</span>
              <button onClick={() => { closeCheckout(); setPendingPlan(null); }} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            </div>
            <div className="rounded-xl overflow-hidden">{checkoutElement}</div>
          </div>
        ) : (
          <div className="space-y-3">
            {PLANS.map((p) => (
              <PlanCardView
                key={p.id}
                plan={p}
                loading={pendingPlan === p.id}
                onClick={() => handleCta(p)}
              />
            ))}
          </div>
        )}

        <p className="text-xs text-center text-muted-foreground mt-6">
          Subscriptions auto-renew monthly. Cancel anytime from Account.
        </p>
      </div>
    </AppShell>
  );
};

function PlanCardView({ plan, loading, onClick }: { plan: PlanCard; loading: boolean; onClick: () => void }) {
  return (
    <div className={`ios-card p-5 ${plan.highlight ? "ring-1 ring-foreground" : ""}`}>
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold">{plan.name}</h3>
        {plan.highlight && (
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-foreground text-background">
            <Sparkles className="inline h-3 w-3 mr-0.5" /> Popular
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
        {plan.period && <span className="text-sm text-muted-foreground">{plan.period}</span>}
      </div>
      <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
      <ul className="space-y-2 mb-5">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground/85">
            <Check className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button
        onClick={onClick}
        disabled={loading}
        variant={plan.highlight ? "default" : "outline"}
        className="w-full h-11 rounded-xl font-semibold"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : plan.cta}
      </Button>
    </div>
  );
}

export default Pricing;
