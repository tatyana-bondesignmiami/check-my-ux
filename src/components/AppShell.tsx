import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";

interface AppShellProps {
  children: ReactNode;
  hideNav?: boolean;
}

export function AppShell({ children, hideNav }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      <div className={`mx-auto max-w-md min-h-screen flex flex-col ${hideNav ? "" : "pb-28"}`}>
        <div className="flex-1">{children}</div>
        <footer className="px-5 py-6 mt-auto">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
          </nav>
        </footer>
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
