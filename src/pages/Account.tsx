import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Mail, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LABELS } from "@/lib/plans";

const Account = () => {
  const navigate = useNavigate();
  const { user, profile, credits, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

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
