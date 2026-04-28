import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, Loader2, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ScoreRing } from "@/components/ScoreRing";
import { ScoreBar } from "@/components/ScoreBar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PriorityFix } from "@/lib/uxAudit";

interface ReportRow {
  id: string;
  screen_type: string;
  description: string | null;
  image_url: string | null;
  overall_score: number;
  layout_consistency_score: number | null;
  typography_consistency_score: number | null;
  component_consistency_score: number | null;
  color_consistency_score: number | null;
  visual_hierarchy: number | null;
  accessibility_risk_score: number | null;
  strengths: string[];
  issues: string[];
  recommendations: string[];
  priority_fixes: PriorityFix[];
  design_system_notes: string | null;
  priority: string;
  summary: string;
  created_at: string;
}

const priorityStyles: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/10 text-warning",
  Low: "bg-success/10 text-success",
};

const severityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-success/10 text-success border-success/20",
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
        priority_fixes: (data.priority_fixes as unknown as PriorityFix[]) ?? [],
      } as ReportRow);
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

  // Accessibility risk: invert for the bar (higher risk = lower "score" visual)
  const a11yDisplay =
    report.accessibility_risk_score != null ? 100 - report.accessibility_risk_score : null;

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
            <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
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

        {/* Screenshot preview */}
        {report.image_url && (
          <div className="ios-card mt-4 overflow-hidden">
            <img src={report.image_url} alt="Audited screen" className="w-full max-h-80 object-cover" />
          </div>
        )}

        {/* Sub-scores */}
        <section className="mt-4 ios-card p-5">
          <h2 className="text-sm font-semibold mb-4">Visual consistency breakdown</h2>
          <div className="space-y-4">
            {report.layout_consistency_score != null && (
              <ScoreBar label="Layout consistency" score={report.layout_consistency_score} />
            )}
            {report.typography_consistency_score != null && (
              <ScoreBar label="Typography consistency" score={report.typography_consistency_score} />
            )}
            {report.component_consistency_score != null && (
              <ScoreBar label="Component consistency" score={report.component_consistency_score} />
            )}
            {report.color_consistency_score != null && (
              <ScoreBar label="Color consistency" score={report.color_consistency_score} />
            )}
            {report.visual_hierarchy != null && (
              <ScoreBar label="Visual hierarchy" score={report.visual_hierarchy} />
            )}
            {a11yDisplay != null && (
              <ScoreBar label="Accessibility" score={a11yDisplay} />
            )}
          </div>
        </section>

        {/* Priority fixes */}
        {report.priority_fixes.length > 0 && (
          <section className="mt-4 ios-card p-5">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Priority fixes
            </h2>
            <ul className="space-y-2">
              {report.priority_fixes.map((p, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-1 rounded-md border shrink-0 mt-0.5 ${
                      severityStyles[p.severity] ?? severityStyles.low
                    }`}
                  >
                    {p.severity}
                  </span>
                  <span className="text-sm text-foreground/90 leading-relaxed">{p.fix}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Expandable detailed sections */}
        <section className="mt-4 ios-card p-2">
          <Accordion type="multiple" className="w-full">
            {report.strengths.length > 0 && (
              <AccordionItem value="strengths" className="border-b last:border-b-0">
                <AccordionTrigger className="px-3 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    Strengths
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <ul className="divide-y divide-divider">
                    {report.strengths.map((s, i) => (
                      <Item key={i} text={s} />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {report.issues.length > 0 && (
              <AccordionItem value="issues" className="border-b last:border-b-0">
                <AccordionTrigger className="px-3 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    Issues observed
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <ul className="divide-y divide-divider">
                    {report.issues.map((s, i) => (
                      <Item key={i} text={s} />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {report.recommendations.length > 0 && (
              <AccordionItem value="recommendations" className="border-b last:border-b-0">
                <AccordionTrigger className="px-3 text-sm font-semibold">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-accent" />
                    Recommendations
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <ul className="divide-y divide-divider">
                    {report.recommendations.map((s, i) => (
                      <Item key={i} text={s} />
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {report.design_system_notes && (
              <AccordionItem value="design-system" className="border-b last:border-b-0">
                <AccordionTrigger className="px-3 text-sm font-semibold">
                  Design system notes
                </AccordionTrigger>
                <AccordionContent className="px-3">
                  <p className="text-sm text-foreground/85 leading-relaxed whitespace-pre-line">
                    {report.design_system_notes}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </section>

        <div className="mt-6">
          <Button asChild size="lg" className="w-full h-12 rounded-2xl">
            <Link to="/new">Start New Check</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  );
};

function Item({ text }: { text: string }) {
  return <li className="py-2.5 text-sm leading-relaxed text-foreground/85 first:pt-0 last:pb-0">{text}</li>;
}

export default ReportView;
