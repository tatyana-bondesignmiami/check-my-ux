import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, Loader2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ScoreRing";
import { ScoreBar } from "@/components/ScoreBar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ReportRow {
  id: string;
  screen_type: string;
  description: string | null;
  image_url: string | null;
  overall_score: number;
  visual_hierarchy: number;
  cta_clarity: number;
  accessibility: number;
  content_clarity: number;
  conversion_friction: number;
  strengths: string[];
  issues: string[];
  recommendations: string[];
  priority: string;
  summary: string;
  created_at: string;
}

const priorityStyles: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/10 text-warning",
  Low: "bg-success/10 text-success",
};

const ReportView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast.error("Report not found");
        navigate("/reports");
        return;
      }
      setReport({
        ...data,
        strengths: (data.strengths as string[]) ?? [],
        issues: (data.issues as string[]) ?? [],
        recommendations: (data.recommendations as string[]) ?? [],
      });
      setLoading(false);
    })();
  }, [id, navigate]);

  const handleDelete = async () => {
    if (!report) return;
    const { error } = await supabase.from("reports").delete().eq("id", report.id);
    if (error) return toast.error("Could not delete");
    toast.success("Report deleted");
    navigate("/reports");
  };

  if (loading || !report) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <Link to="/reports" className="h-10 w-10 -ml-2 flex items-center justify-center rounded-full hover:bg-secondary transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button
            onClick={handleDelete}
            className="h-10 w-10 -mr-2 flex items-center justify-center rounded-full hover:bg-secondary transition-colors text-muted-foreground"
            aria-label="Delete report"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Overall score */}
        <div className="ios-card p-6 flex flex-col items-center text-center animate-scale-in">
          <ScoreRing score={report.overall_score} />
          <div className="mt-5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {report.screen_type}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${priorityStyles[report.priority] ?? ""}`}>
                {report.priority} priority
              </span>
            </div>
            <p className="text-sm text-foreground/80 max-w-xs">{report.summary}</p>
          </div>
        </div>

        {/* Sub-scores */}
        <section className="mt-4 ios-card p-5">
          <h2 className="text-sm font-semibold mb-4">Breakdown</h2>
          <div className="space-y-4">
            <ScoreBar label="Visual hierarchy" score={report.visual_hierarchy} />
            <ScoreBar label="CTA clarity" score={report.cta_clarity} />
            <ScoreBar label="Accessibility" score={report.accessibility} />
            <ScoreBar label="Content clarity" score={report.content_clarity} />
            <ScoreBar label="Conversion friction" score={report.conversion_friction} />
          </div>
        </section>

        {/* Strengths */}
        <Section title="Strengths" icon={<CheckCircle2 className="h-4 w-4 text-success" />}>
          {report.strengths.map((s, i) => (
            <Item key={i} text={s} />
          ))}
        </Section>

        {/* Issues */}
        <Section title="Issues" icon={<AlertTriangle className="h-4 w-4 text-warning" />}>
          {report.issues.map((s, i) => (
            <Item key={i} text={s} />
          ))}
        </Section>

        {/* Recommendations */}
        <Section title="Recommended improvements" icon={<Lightbulb className="h-4 w-4 text-accent" />}>
          {report.recommendations.map((s, i) => (
            <Item key={i} text={s} />
          ))}
        </Section>

        <div className="mt-6 space-y-3">
          <Button
            onClick={() => toast.success("Report saved to your library")}
            variant="secondary"
            size="lg"
            className="w-full h-12 rounded-2xl"
          >
            Save Report
          </Button>
          <Button asChild size="lg" className="w-full h-12 rounded-2xl">
            <Link to="/new">Start New Check</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mt-4 ios-card p-5">
      <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <ul className="divide-y divide-divider">{children}</ul>
    </section>
  );
}

function Item({ text }: { text: string }) {
  return <li className="py-2.5 text-sm leading-relaxed text-foreground/85 first:pt-0 last:pb-0">{text}</li>;
}

export default ReportView;
