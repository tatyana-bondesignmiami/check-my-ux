import { ReactNode } from "react";
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
      <div className={`mx-auto max-w-md min-h-screen ${hideNav ? "" : "pb-28"}`}>{children}</div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
