export type PlanType = "free" | "starter" | "pro" | "studio";

export const PLAN_LABELS: Record<PlanType, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  studio: "Studio",
};

export const PRICE_TO_PLAN: Record<string, { plan: PlanType; credits: number; monthly: number }> = {
  starter_pack_onetime: { plan: "starter", credits: 10, monthly: 0 },
  pro_monthly: { plan: "pro", credits: 50, monthly: 50 },
  studio_monthly: { plan: "studio", credits: 200, monthly: 200 },
};

export function canExportPdf(plan: PlanType): boolean {
  return plan === "pro" || plan === "studio";
}

export function reportLimit(plan: PlanType): number | null {
  if (plan === "free") return 3;
  return null; // unlimited
}
