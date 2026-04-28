// UX audit types — real analysis happens in the `analyze-ux` edge function via Lovable AI.

export type ScreenType =
  | "Landing Page"
  | "Dashboard"
  | "Checkout"
  | "Mobile App"
  | "Form"
  | "SaaS Tool"
  | "Other";

export const SCREEN_TYPES: ScreenType[] = [
  "Landing Page",
  "Dashboard",
  "Checkout",
  "Mobile App",
  "Form",
  "SaaS Tool",
  "Other",
];

export type Severity = "high" | "medium" | "low";

export interface PriorityFix {
  fix: string;
  severity: Severity;
}

export interface UxReport {
  overall_score: number;
  layout_consistency_score: number;
  typography_consistency_score: number;
  component_consistency_score: number;
  color_consistency_score: number;
  visual_hierarchy_score: number;
  accessibility_risk_score: number;
  strengths: string[];
  issues: string[];
  recommendations: string[];
  priority_fixes: PriorityFix[];
  design_system_notes: string;
  summary: string;
}

export function scoreColor(score: number): "high" | "mid" | "low" {
  if (score >= 80) return "high";
  if (score >= 65) return "mid";
  return "low";
}

// Accessibility risk is inverted — higher = worse
export function riskColor(score: number): "high" | "mid" | "low" {
  if (score <= 20) return "high"; // low risk = good
  if (score <= 45) return "mid";
  return "low";
}

export function priorityFromScore(score: number): "High" | "Medium" | "Low" {
  if (score >= 80) return "Low";
  if (score >= 65) return "Medium";
  return "High";
}
