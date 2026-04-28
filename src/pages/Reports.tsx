import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Loader2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { scoreColor } from "@/lib/uxAudit";

interface ReportCard {
  id: string;
  screen_type: string;
  overall_score: number;
  summary: string;
  created_at: string;
}

const Reports = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("reports")
        .select("id, screen_type, overall_score, summary, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setReports(data ?? []);
      setLoading(false);
    })();
  }, [user]);

  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6 animate-fade-in">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-title-lg">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {reports.length} saved {reports.length === 1 ? "audit" : "audits"}
            </p>
          </div>
          <Button asChild size="sm" variant="secondary" className="rounded-full h-9 px-4">
            <Link to="/new">
              <Plus className="h-4 w-4 mr-1" />
              New
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <div className="ios-card p-8 text-center mt-4">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-secondary flex items-center justify-center mb-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-semibold mb-1">No reports yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Run your first UX audit to see it here.
            </p>
            <Button asChild className="rounded-2xl">
              <Link to="/new">Start UX Audit</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li key={r.id}>
                <Link
                  to={`/report/${r.id}`}
                  className="ios-card block p-4 hover:bg-card-elevated transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <ScoreBadge score={r.overall_score} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                          {r.screen_type}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {new Date(r.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-snug line-clamp-2">{r.summary}</p>
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
  const cls =
    tone === "high"
      ? "bg-success/10 text-success"
      : tone === "mid"
      ? "bg-warning/10 text-warning"
      : "bg-destructive/10 text-destructive";
  return (
    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${cls} shrink-0`}>
      <span className="text-base font-bold tabular-nums">{score}</span>
    </div>
  );
}

export default Reports;
