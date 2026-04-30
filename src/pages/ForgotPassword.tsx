import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const getRedirectBase = () => {
    const host = window.location.hostname;
    const proto = window.location.protocol;

    // Browser on a real http(s) origin: use the current origin so links return
    // to whichever domain the user is on (fixmyux.app, www.fixmyux.app,
    // check-my-ux.lovable.app, localhost, preview, etc.).
    if (proto === "http:" || proto === "https:") {
      return window.location.origin;
    }

    // Native app builds (capacitor://, file://, etc.) — fall back to the
    // canonical production domain.
    return "https://fixmyux.app";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${getRedirectBase()}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  };

  return (
    <AppShell hideNav>
      <div className="px-5 pt-12 pb-8 animate-fade-in">
        <Link to="/login" className="h-10 w-10 -ml-2 mb-6 flex items-center justify-center rounded-full hover:bg-secondary">
          <ArrowLeft className="h-5 w-5" />
        </Link>

        <div className="flex items-center gap-2 mb-10">
          <div className="h-9 w-9 rounded-2xl bg-foreground flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Check My UX</span>
        </div>

        <h1 className="text-title-lg mb-2">Reset your password</h1>
        <p className="text-sm text-muted-foreground mb-8">
          {sent ? "Check your email for a reset link." : "We'll email you a secure link to set a new password."}
        </p>

        {!sent && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Email</Label>
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-2xl text-base" />
            </div>
            <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl text-base font-semibold">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </AppShell>
  );
};

export default ForgotPassword;
