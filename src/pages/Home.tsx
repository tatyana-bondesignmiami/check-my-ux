import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Eye } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Home = () => {
  const { user } = useAuth();

  return (
    <AppShell hideNav={!user}>
      <div className="px-5 md:px-0 pt-12 md:pt-16 pb-6 animate-fade-in">
        <div className="md:hidden flex items-center justify-between mb-10">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-foreground flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Fix My UX</span>
          </div>
          {!user && (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Log in</Link>
            </div>
          )}
        </div>

        <h1 className="text-display md:text-5xl lg:text-6xl md:font-semibold md:tracking-tight mb-3 md:mb-5">
          Audit visual UX,<br />
          <span className="text-muted-foreground">in seconds.</span>
        </h1>
        <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 md:mb-10 max-w-sm md:max-w-xl">
          AI-powered visual consistency checks for websites, dashboards, mobile screens, and checkout flows.
        </p>

        <div className="space-y-2.5 md:space-y-0 md:flex md:gap-3 md:max-w-md">
          <Button asChild size="lg" className="w-full md:w-auto h-14 rounded-2xl text-base font-semibold md:px-8">
            <Link to={user ? "/new" : "/signup"}>
              {user ? "Start UX Audit" : "Start Free"} <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          {!user && (
            <Button asChild size="lg" variant="outline" className="w-full md:w-auto h-14 rounded-2xl text-base md:px-8">
              <Link to="/pricing">View pricing</Link>
            </Button>
          )}
        </div>
      </div>

      <section className="px-5 md:px-0 mt-6 md:mt-16 grid gap-3 md:grid-cols-3 md:gap-4">
        <FeatureCard icon={<Eye className="h-5 w-5" />} title="Real screenshot analysis" desc="Powered by Gemini 3.1 Pro vision." />
        <FeatureCard icon={<Zap className="h-5 w-5" />} title="Visual consistency report" desc="Layout, type, color, components, hierarchy." />
        <FeatureCard icon={<ShieldCheck className="h-5 w-5" />} title="Prioritized fixes" desc="High / medium / low severity, with evidence." />
      </section>

      {!user && (
        <div className="px-5 md:px-0 mt-10 mb-6">
          <p className="text-xs md:text-sm text-center md:text-left text-muted-foreground">
            3 free audits on signup. No credit card required.
          </p>
        </div>
      )}

      <div className="px-5 pb-6">
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
