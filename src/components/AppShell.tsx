import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { DesktopHeader } from "./DesktopHeader";
import { PaymentTestModeBanner } from "./PaymentTestModeBanner";

interface AppShellProps {
  children: ReactNode;
  /** Hides the mobile bottom nav (e.g. for auth screens). Desktop header still shows. */
  hideNav?: boolean;
  /** Hides the desktop header too — use sparingly (full-bleed marketing pages). */
  hideDesktopHeader?: boolean;
  /**
   * Width of the centered content container on tablet/desktop.
   * - "default" → narrow app feel (max-w-md mobile, max-w-2xl md+)
   * - "wide"    → roomy pages like dashboards/reports (max-w-md mobile, max-w-5xl lg+)
   */
  width?: "default" | "wide";
}

export function AppShell({
  children,
  hideNav,
  hideDesktopHeader,
  width = "default",
}: AppShellProps) {
  const widthClass =
    width === "wide"
      ? "max-w-md md:max-w-3xl lg:max-w-5xl"
      : "max-w-md md:max-w-2xl";

  return (
    <div className="min-h-screen bg-background">
      <PaymentTestModeBanner />
      {!hideDesktopHeader && <DesktopHeader />}
      <div
        className={`mx-auto ${widthClass} min-h-[calc(100vh-4rem)] flex flex-col ${hideNav ? "" : "pb-28 md:pb-0"} md:px-6 lg:px-8`}
      >
        <div className="flex-1">{children}</div>
        <footer className="px-5 md:px-0 py-6 mt-auto">
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link to="/refund-policy" className="hover:text-foreground">Refund Policy</Link>
          </nav>
        </footer>
      </div>
      {!hideNav && (
        <div className="md:hidden">
          <BottomNav />
        </div>
      )}
    </div>
  );
}
