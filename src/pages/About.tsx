import { Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";

const About = () => {
  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-2xl bg-foreground flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Check My UX</span>
        </div>

        <h1 className="text-title-lg mb-3">About</h1>
        <p className="text-base text-foreground/85 leading-relaxed mb-6">
          Check My UX is a lightweight AI-assisted UX audit tool for designers, founders and product
          teams. Run a structured heuristic review of any screen in under a minute.
        </p>

        <div className="ios-card p-5 space-y-4">
          <Row label="What it scores" value="Visual hierarchy, CTA clarity, accessibility, content clarity, conversion friction." />
          <div className="ios-divider" />
          <Row label="How to use" value="Upload a screenshot or describe a screen, choose its type, then generate a report." />
          <div className="ios-divider" />
          <Row label="Saved locally" value="Your reports are stored against your device and accessible from the Reports tab." />
        </div>

        <div className="mt-6 ios-card p-5 bg-card-elevated">
          <h3 className="text-sm font-semibold mb-1">Disclaimer</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This is not a replacement for usability testing with real users. Treat the output as a fast
            heuristic review to surface likely improvements — not as definitive guidance.
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-8">
          Version 1.0 · Made for designers and builders
        </p>
      </div>
    </AppShell>
  );
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </h3>
      <p className="text-sm text-foreground/85 leading-relaxed">{value}</p>
    </div>
  );
}

export default About;
