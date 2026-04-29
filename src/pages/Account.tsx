import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Mail, Sparkles, XCircle, Loader2, CreditCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LABELS } from "@/lib/plans";
import { supabase } from "@/integrations/supabase/client";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, credits, signOut } = useAuth();

  const [subscription, setSubscription] = useState<{
    status: string;
    cancel_at_period_end: boolean | null;
    current_period_end: string | null;
    stripe_subscription_id: string;
  } | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);

  const isPaid = !!profile && profile.plan_type !== "free";
  const env = getStripeEnvironment();

  useEffect(() => {
    if (!user || !isPaid) {
      setSubscription(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("status, cancel_at_period_end, current_period_end, stripe_subscription_id")
        .eq("user_id", user.id)
        .eq("environment", env)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setSubscription(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [user, isPaid, env]);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("cancel-subscription", {
        body: { environment: env, mode: "at_period_end" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Subscription will end at the current period.");
      setSubscription((s) =>
        s ? { ...s, cancel_at_period_end: true, status: (data as any)?.status ?? s.status } : s,
      );
      setConfirmOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel subscription");
    } finally {
      setCancelling(false);
    }
  };

  const handleManageSubscription = async () => {
    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          environment: env,
          returnUrl: `${window.location.origin}/account`,
        },
      });
      // Surface the real error message from the function's JSON body
      const errMsg = (data as any)?.error || (error as any)?.context?.error;
      if (errMsg) throw new Error(errMsg);
      if (error) throw error;
      const url = (data as any)?.url;
      if (!url) throw new Error("Failed to open billing portal");
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to open billing portal");
    } finally {
      setOpeningPortal(false);
    }
  };

  const periodEndStr = subscription?.current_period_end
    ? new Date(subscription.current_period_end).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  const alreadyCanceling = !!subscription?.cancel_at_period_end;
  const hasActiveSub = !!subscription && subscription.status !== "canceled";

  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-6">
          <Link to="/dashboard" className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>

        <h1 className="text-title-lg mb-6">Account</h1>

        <div className="ios-card p-5 mb-3">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center text-lg font-semibold">
              {(profile?.full_name || user?.email || "U")[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate">{profile?.full_name || "—"}</p>
              <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" />
                {user?.email}
              </p>
            </div>
          </div>
        </div>

        <div className="ios-card divide-y divide-divider">
          <Row label="Plan" value={profile ? PLAN_LABELS[profile.plan_type] : "—"} />
          <Row label="Credits remaining" value={String(credits?.credits_remaining ?? 0)} />
          {profile && profile.plan_type !== "free" && (
            <Row label="Used this month" value={String(credits?.credits_used_this_month ?? 0)} />
          )}
        </div>

        {isPaid && (
          <div className="ios-card p-5 mt-3">
            <p className="text-sm font-semibold mb-1">Subscription</p>
            {alreadyCanceling ? (
              <p className="text-sm text-muted-foreground mb-4">
                Your plan is set to end{periodEndStr ? ` on ${periodEndStr}` : " at the current period"}.
                You'll keep access until then.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">
                {periodEndStr
                  ? `Renews on ${periodEndStr}. Manage billing or cancel anytime.`
                  : "Manage your billing details, payment method, or cancel anytime."}
              </p>
            )}

            <div className="space-y-2">
              <Button
                onClick={handleManageSubscription}
                disabled={openingPortal}
                className="w-full h-12 rounded-2xl justify-center text-base"
              >
                {openingPortal ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Opening…</>
                ) : (
                  <><CreditCard className="h-4 w-4" /> Manage Subscription</>
                )}
              </Button>

              {hasActiveSub && !alreadyCanceling && (
                <Button
                  variant="outline"
                  onClick={() => setConfirmOpen(true)}
                  className="w-full h-12 rounded-2xl justify-center text-base text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <XCircle className="h-4 w-4" /> Cancel subscription
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="mt-3 space-y-2">
          <Button asChild variant="outline" className="w-full h-12 rounded-2xl justify-start text-base">
            <Link to="/pricing">
              <Sparkles className="h-4 w-4" /> View pricing & upgrades
            </Link>
          </Button>
          <Button onClick={handleLogout} variant="outline" className="w-full h-12 rounded-2xl justify-start text-base text-destructive hover:text-destructive">
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => !cancelling && setConfirmOpen(o)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              Your plan will end{periodEndStr ? ` on ${periodEndStr}` : " at the end of your current billing period"}.
              You'll keep full access until then, and you won't be charged again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep subscription</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleCancel(); }}
              disabled={cancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelling ? (<><Loader2 className="h-4 w-4 animate-spin" /> Cancelling…</>) : "Confirm cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default Account;
