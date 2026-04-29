import { Link } from "react-router-dom";

export function LegalFooter() {
  return (
    <footer className="mt-10 pt-6 border-t border-border">
      <nav className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <Link to="/about" className="hover:text-foreground">About</Link>
        <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
        <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
        <Link to="/terms" className="hover:text-foreground">Terms</Link>
        <Link to="/refund-policy" className="hover:text-foreground">Refunds</Link>
      </nav>
      <p className="text-[11px] text-center text-muted-foreground mt-4">
        © {new Date().getFullYear()} Fix My UX. All rights reserved.
      </p>
    </footer>
  );
}
