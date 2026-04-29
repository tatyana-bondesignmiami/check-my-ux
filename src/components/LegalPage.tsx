import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";

interface LegalPageProps {
  title: string;
  updated: string;
  children: ReactNode;
}

export function LegalPage({ title, updated, children }: LegalPageProps) {
  return (
    <AppShell>
      <div className="px-5 pt-12 pb-6 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-foreground flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-background" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Fix My UX</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
        </div>

        <h1 className="text-title-lg mb-1">{title}</h1>
        <p className="text-xs text-muted-foreground mb-6">Last updated: {updated}</p>

        <div className="ios-card p-5 space-y-6 text-sm leading-relaxed text-foreground/85 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-2 [&_h2]:mb-2 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_a]:text-accent [&_a]:underline-offset-2 hover:[&_a]:underline">
          {children}
        </div>

      </div>
    </AppShell>
  );
}
