import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase auto-handles the recovery hash; check session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else {
        toast.error("Reset link is invalid or expired");
        navigate("/login");
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return toast.error("Passwords do not match");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate("/dashboard");
  };

  if (!ready) {
    return (
      <AppShell hideNav>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell hideNav>
      <div className="px-5 pt-16 pb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-10">
          <div className="h-9 w-9 rounded-2xl bg-foreground flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Check My UX</span>
        </div>
        <h1 className="text-title-lg mb-2">Set a new password</h1>
        <p className="text-sm text-muted-foreground mb-8">Choose something strong — at least 8 characters.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-sm font-medium mb-2 block">New password</Label>
            <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-2xl text-base" />
          </div>
          <div>
            <Label className="text-sm font-medium mb-2 block">Confirm password</Label>
            <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-12 rounded-2xl text-base" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 rounded-2xl text-base font-semibold">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      </div>
    </AppShell>
  );
};

export default ResetPassword;
