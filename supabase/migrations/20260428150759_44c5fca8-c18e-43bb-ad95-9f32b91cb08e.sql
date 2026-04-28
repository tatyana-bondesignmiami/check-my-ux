
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS layout_consistency_score integer,
  ADD COLUMN IF NOT EXISTS typography_consistency_score integer,
  ADD COLUMN IF NOT EXISTS component_consistency_score integer,
  ADD COLUMN IF NOT EXISTS color_consistency_score integer,
  ADD COLUMN IF NOT EXISTS accessibility_risk_score integer,
  ADD COLUMN IF NOT EXISTS priority_fixes jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS design_system_notes text;

ALTER TABLE public.reports ALTER COLUMN cta_clarity DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN content_clarity DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN conversion_friction DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN visual_hierarchy DROP NOT NULL;
ALTER TABLE public.reports ALTER COLUMN accessibility DROP NOT NULL;
