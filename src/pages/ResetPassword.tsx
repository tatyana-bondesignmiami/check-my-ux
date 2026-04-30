import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Status = "checking" | "ready" | "invalid" | "success";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>("checking");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const init = async () => {
      // Supabase JS auto-processes the recovery token in the URL hash
      // and emits a PASSWORD_RECOVERY event. Listen first, then fallback to session check.
      const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
        if (!active) return;
        if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
          setStatus("ready");
        }
      });

      // Give Supabase a tick to parse the hash, then check current session
      await new Promise((r) => setTimeout(r, 300));
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      if (data.session) {
        setStatus("ready");
      } else {
        // No recovery token / expired
        setStatus("invalid");
      }

      // Clean the recovery token from the visible URL
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname);
      }

      return () => subscription.subscription.unsubscribe();
    };

    init();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setFormError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setFormError(error.message || "Could not update password. Please try again.");
      return;
    }

    // Clear the recovery session so the token can't be reused
    await supabase.auth.signOut();
    setStatus("success");
    toast.success("Password updated");
    setTimeout(() => navigate("/login", { replace: true }), 1500);
  };

  return (
    <AppShell hideNav>
      <div className="px-5 pt-12 pb-8 animate-fade-in">
        <Link
          to="/login"
          className="h-10 w-10 -ml-2 mb-6 flex items-center justify-center rounded-full hover:bg-secondary"
          aria-label="Back to login"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-2 mb-10">
          <div className="h-9 w-9 rounded-2xl bg-foreground flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Check My UX</span>
        </div>

        {status === "checking" && (
          <div className="flex items-center justify-center min-h-[40vh]">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {status === "invalid" && (
          <div>
            <h1 className="text-title-lg mb-2">Reset link invalid</h1>
            <p className="text-sm text-muted-foreground mb-6">
              This reset link is invalid or has expired. Please request a new one.
            </p>
            <div className="space-y-2.5">
              <Button asChild className="w-full h-12 rounded-2xl text-base font-semibold">
                <Link to="/forgot-password">Request a new link</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 rounded-2xl text-base">
                <Link to="/login">Back to login</Link>
              </Button>
            </div>
          </div>
        )}

        {status === "ready" && (
          <>
            <h1 className="text-title-lg mb-2">Set a new password</h1>
            <p className="text-sm text-muted-foreground mb-8">
              Choose something strong — at least 8 characters.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="new-password" className="text-sm font-medium mb-2 block">
                  New password
                </Label>
                <Input
                  id="new-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-2xl text-base"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="text-sm font-medium mb-2 block">
                  Confirm new password
                </Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="h-12 rounded-2xl text-base"
                />
              </div>

              {formError && (
                <p
                  role="alert"
                  className="text-sm font-medium text-destructive bg-destructive/10 rounded-xl px-3 py-2"
                >
                  {formError}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-2xl text-base font-semibold"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          </>
        )}

        {status === "success" && (
          <div>
            <div className="h-12 w-12 rounded-full bg-foreground/5 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-6 w-6 text-foreground" />
            </div>
            <h1 className="text-title-lg mb-2">Password updated</h1>
            <p className="text-sm text-muted-foreground mb-6">
              You can now sign in with your new password.
            </p>
            <Button asChild className="w-full h-12 rounded-2xl text-base font-semibold">
              <Link to="/login">Back to login</Link>
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ResetPassword;
