import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6 animate-fade-in">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-2xl bg-foreground flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Check My UX</span>
        </div>

        <h1 className="text-display mb-3">
          UX clarity,<br />
          <span className="text-muted-foreground">in seconds.</span>
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-8 max-w-sm">
          AI-powered UX clarity checks for digital products. Upload a screenshot or describe a screen
          to get a structured UX review.
        </p>

        <Button asChild size="lg" className="w-full h-14 rounded-2xl text-base font-semibold">
          <Link to="/new">
            Start UX Audit
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <section className="px-5 mt-4 space-y-3">
        <FeatureCard
          icon={<Zap className="h-5 w-5" />}
          title="Instant heuristic review"
          desc="Six core dimensions scored from 1 to 100."
        />
        <FeatureCard
          icon={<ShieldCheck className="h-5 w-5" />}
          title="Actionable improvements"
          desc="Strengths, issues and prioritized fixes."
        />
        <FeatureCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Saved for later"
          desc="Keep every audit in your reports library."
        />
      </section>

      <div className="px-5 mt-8">
        <Link
          to="/reports"
          className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-3"
        >
          View saved reports →
        </Link>
      </div>
    </AppShell>
  );
};

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="ios-card p-4 flex items-start gap-3">
      <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 text-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold mb-0.5">{title}</h3>
        <p className="text-sm text-muted-foreground leading-snug">{desc}</p>
      </div>
    </div>
  );
}

export default Home;
