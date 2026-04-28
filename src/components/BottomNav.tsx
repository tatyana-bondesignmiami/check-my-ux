import { NavLink } from "react-router-dom";
import { LayoutDashboard, Plus, FileText, User } from "lucide-react";

const items = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard },
  { to: "/new", label: "New", icon: Plus },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/account", label: "Account", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-background/85 backdrop-blur-xl border-t border-border safe-bottom">
      <div className="mx-auto max-w-md px-2 pt-2">
        <ul className="flex items-stretch justify-around">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center gap-1 py-1.5 rounded-xl text-[11px] font-medium transition-colors ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`h-[22px] w-[22px] ${isActive ? "stroke-[2.2]" : "stroke-[1.8]"}`} />
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
