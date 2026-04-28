import { scoreColor } from "@/lib/uxAudit";

interface ScoreBarProps {
  label: string;
  score: number;
}

export function ScoreBar({ label, score }: ScoreBarProps) {
  const tone = scoreColor(score);
  const bg =
    tone === "high" ? "bg-success" : tone === "mid" ? "bg-warning" : "bg-destructive";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-foreground/80">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{score}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full ${bg} rounded-full`}
          style={{ width: `${score}%`, transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }}
        />
      </div>
    </div>
  );
}
