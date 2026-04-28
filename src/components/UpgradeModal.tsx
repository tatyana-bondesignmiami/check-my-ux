import { Link } from "react-router-dom";
import { Sparkles, Zap, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
}

export function UpgradeModal({
  open,
  onOpenChange,
  title = "You're out of audit credits",
  description = "Upgrade your plan or buy a credit pack to continue analyzing screens.",
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm">
        <div className="mx-auto h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center mb-2">
          <Zap className="h-5 w-5" />
        </div>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col mt-2">
          <Button asChild className="w-full h-11 rounded-xl">
            <Link to="/pricing" onClick={() => onOpenChange(false)}>
              View Pricing <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" className="w-full h-11 rounded-xl" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
