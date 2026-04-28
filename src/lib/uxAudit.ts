// Placeholder AI logic — generates a structured, plausible UX report.
// Swap with a real LLM call later (Lovable AI Gateway).

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

export interface UxReport {
  overall_score: number;
  visual_hierarchy: number;
  cta_clarity: number;
  accessibility: number;
  content_clarity: number;
  conversion_friction: number;
  strengths: string[];
  issues: string[];
  recommendations: string[];
  priority: "High" | "Medium" | "Low";
  summary: string;
}

const STRENGTHS_POOL = [
  "Clear primary action above the fold",
  "Consistent typographic rhythm and spacing",
  "Strong brand presence without overwhelming the content",
  "Logical reading order that guides the eye top-to-bottom",
  "Comfortable touch targets for mobile use",
  "Trust signals are visible near the conversion point",
];

const ISSUES_POOL = [
  "CTA color contrast is insufficient against the background",
  "Multiple competing actions dilute the primary goal",
  "Form labels disappear once the user starts typing",
  "Body copy line-length exceeds comfortable reading range",
  "Important metadata is hidden behind small icons without labels",
  "Error states do not explain how to recover",
  "Visual hierarchy treats secondary content with primary weight",
];

const RECS_POOL = [
  "Reduce competing CTAs to a single primary action per view",
  "Increase body text contrast to meet WCAG AA (4.5:1)",
  "Use persistent, top-aligned form labels instead of placeholders",
  "Add inline validation with specific recovery instructions",
  "Group related actions and apply visual weight by priority",
  "Tighten line-length to 60–75 characters for body copy",
  "Add micro-copy near the CTA that reinforces value and reduces risk",
];

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, n);
}

function score(min = 55, max = 92) {
  return Math.round(min + Math.random() * (max - min));
}

export function generateMockReport(input: {
  screenType: ScreenType;
  description?: string;
  hasImage: boolean;
}): UxReport {
  const visual_hierarchy = score(60, 90);
  const cta_clarity = score(50, 95);
  const accessibility = score(55, 88);
  const content_clarity = score(60, 92);
  const conversion_friction = score(55, 90);

  const overall_score = Math.round(
    (visual_hierarchy + cta_clarity + accessibility + content_clarity + conversion_friction) / 5
  );

  const priority: UxReport["priority"] =
    overall_score >= 80 ? "Low" : overall_score >= 65 ? "Medium" : "High";

  const summary =
    overall_score >= 80
      ? `Solid ${input.screenType.toLowerCase()} with minor refinements available.`
      : overall_score >= 65
      ? `Functional ${input.screenType.toLowerCase()} with a few clarity improvements to pursue.`
      : `${input.screenType} needs attention to hierarchy and conversion clarity.`;

  return {
    overall_score,
    visual_hierarchy,
    cta_clarity,
    accessibility,
    content_clarity,
    conversion_friction,
    strengths: pick(STRENGTHS_POOL, 3),
    issues: pick(ISSUES_POOL, 4),
    recommendations: pick(RECS_POOL, 4),
    priority,
    summary,
  };
}

export function scoreColor(score: number): "high" | "mid" | "low" {
  if (score >= 80) return "high";
  if (score >= 65) return "mid";
  return "low";
}
