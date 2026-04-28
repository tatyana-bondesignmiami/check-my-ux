import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, FileText, Zap, ArrowRight, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LABELS, reportLimit } from "@/lib/plans";
import { scoreColor } from "@/lib/uxAudit";

interface RecentReport {
  id: string;
  screen_type: string;
  overall_score: number;
  summary: string;
  image_url: string | null;
  created_at: string;
}

const Dashboard = () => {
  const { user, profile, credits, loading: authLoading } = useAuth();
  const [recent, setRecent] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("reports")
        .select("id, screen_type, overall_score, summary, image_url, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      setRecent((data ?? []) as RecentReport[]);
      setLoading(false);
    })();
  }, [user]);

  if (authLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  const planLabel = profile ? PLAN_LABELS[profile.plan_type] : "Free";
  const creditsLeft = credits?.credits_remaining ?? 0;
  const limit = profile ? reportLimit(profile.plan_type) : 3;
  const firstName = (profile?.full_name || user?.email || "").split(" ")[0]?.split("@")[0] || "there";

  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6 animate-fade-in">
        <p className="text-sm text-muted-foreground mb-1">Welcome back,</p>
        <h1 className="text-title-lg mb-6">{firstName}</h1>

        {/* Plan + credits card */}
        <div className="ios-card p-5 mb-3">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Current plan</p>
              <p className="text-xl font-semibold">{planLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Credits</p>
              <p className="text-xl font-semibold tabular-nums">{creditsLeft}</p>
            </div>
          </div>
          {creditsLeft === 0 ? (
            <Button asChild size="sm" className="w-full rounded-xl">
              <Link to="/pricing">Get more credits <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          ) : profile?.plan_type === "free" ? (
            <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
              <Link to="/pricing">Upgrade for unlimited reports</Link>
            </Button>
          ) : null}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Link to="/new" className="ios-card p-4 hover:bg-card-elevated transition-colors flex flex-col gap-2">
            <div className="h-10 w-10 rounded-xl bg-foreground text-background flex items-center justify-center">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">New audit</p>
              <p className="text-xs text-muted-foreground">Upload a screenshot</p>
            </div>
          </Link>
          <Link to="/reports" className="ios-card p-4 hover:bg-card-elevated transition-colors flex flex-col gap-2">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">All reports</p>
              <p className="text-xs text-muted-foreground">{limit ? `Up to ${limit}` : "Unlimited"}</p>
            </div>
          </Link>
        </div>

        {/* Recent */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold">Recent audits</h2>
          {recent.length > 0 && (
            <Link to="/reports" className="text-xs text-muted-foreground hover:text-foreground">View all</Link>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : recent.length === 0 ? (
          <div className="ios-card p-8 text-center">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No reports yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run your first UX audit to start building a visual consistency history.
            </p>
            <Button asChild size="sm" className="rounded-xl">
              <Link to="/new">Start UX Check</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {recent.map((r) => (
              <li key={r.id}>
                <Link to={`/report/${r.id}`} className="ios-card block p-3 hover:bg-card-elevated transition-colors">
                  <div className="flex items-start gap-3">
                    {r.image_url ? (
                      <img src={r.image_url} alt="" className="h-14 w-14 rounded-xl object-cover shrink-0" />
                    ) : (
                      <ScoreBadge score={r.overall_score} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground truncate">{r.screen_type}</span>
                        <span className="text-[11px] font-semibold tabular-nums">{r.overall_score}</span>
                      </div>
                      <p className="text-sm text-foreground/85 leading-snug line-clamp-2">{r.summary}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </AppShell>
  );
};

function ScoreBadge({ score }: { score: number }) {
  const tone = scoreColor(score);
  const cls = tone === "high" ? "bg-success/10 text-success" : tone === "mid" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive";
  return (
    <div className={`h-14 w-14 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
      <span className="text-base font-bold tabular-nums">{score}</span>
    </div>
  );
}

export default Dashboard;
