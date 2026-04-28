import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Dynamic import → Vite emits a separate chunk for Stripe code.
// @stripe/react-stripe-js, @stripe/stripe-js, and @/lib/stripe are only
// fetched when this component actually mounts (i.e. checkout opens).
const StripeEmbeddedCheckout = lazy(() =>
  import("@/components/StripeEmbeddedCheckout").then((m) => ({
    default: m.StripeEmbeddedCheckout,
  }))
);

interface Props {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function LazyStripeEmbeddedCheckout(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StripeEmbeddedCheckout {...props} />
    </Suspense>
  );
}
