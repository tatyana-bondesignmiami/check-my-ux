import { Link, NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const marketingLinks = [
  { to: "/", label: "Home", end: true },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

const appLinks = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/new", label: "New audit" },
  { to: "/reports", label: "Reports" },
];

export function DesktopHeader() {
  const { user, profile } = useAuth();
  const links = user ? [...marketingLinks.slice(0, 1), ...appLinks] : marketingLinks;

  return (
    <header className="hidden md:block sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="mx-auto max-w-6xl px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-foreground flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Fix My UX</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={(l as any).end}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "text-foreground bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <Button asChild variant="outline" size="sm" className="rounded-full h-9 px-4">
              <Link to="/account">
                {profile?.full_name?.split(" ")[0] || "Account"}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="h-9">
                <Link to="/login">Log in</Link>
              </Button>
              <Button asChild size="sm" className="h-9 rounded-full px-4">
                <Link to="/signup">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
