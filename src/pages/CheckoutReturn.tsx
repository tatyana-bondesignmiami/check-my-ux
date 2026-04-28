import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const CheckoutReturn = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const { refresh } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "canceled">("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("canceled");
      return;
    }
    // Webhook handles credit/plan update server-side. Just refresh local state after a brief moment.
    const t = setTimeout(async () => {
      await refresh();
      setStatus("success");
    }, 1500);
    return () => clearTimeout(t);
  }, [sessionId, refresh]);

  return (
    <AppShell hideNav>
      <div className="px-5 pt-24 pb-8 animate-fade-in flex flex-col items-center text-center">
        {status === "loading" ? (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground mb-6" />
            <h1 className="text-title-lg mb-2">Finalizing your purchase…</h1>
            <p className="text-sm text-muted-foreground">This takes just a moment.</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="text-title-lg mb-2">Payment successful</h1>
            <p className="text-sm text-muted-foreground mb-8 max-w-xs">
              Your credits have been added and your plan is updated.
            </p>
            <Button asChild size="lg" className="w-full max-w-sm h-12 rounded-2xl">
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
              <XCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <h1 className="text-title-lg mb-2">Payment canceled</h1>
            <p className="text-sm text-muted-foreground mb-8">No charge was made.</p>
            <Button asChild size="lg" variant="outline" className="w-full max-w-sm h-12 rounded-2xl">
              <Link to="/pricing">Back to Pricing</Link>
            </Button>
          </>
        )}
      </div>
    </AppShell>
  );
};

export default CheckoutReturn;
