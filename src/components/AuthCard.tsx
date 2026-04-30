import { ReactNode } from "react";

/**
 * Wraps auth screen content. On mobile it's transparent (preserves the
 * full-bleed app feel). On md+ it becomes a centered, bordered card.
 */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="md:min-h-[calc(100vh-4rem)] md:flex md:items-center md:justify-center md:py-10">
      <div className="md:w-full md:max-w-md md:bg-card md:border md:border-border md:rounded-3xl md:shadow-sm md:p-8">
        {children}
      </div>
    </div>
  );
}
