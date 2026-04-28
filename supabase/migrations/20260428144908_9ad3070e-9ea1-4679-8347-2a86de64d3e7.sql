CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL,
  screen_type TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  overall_score INTEGER NOT NULL,
  visual_hierarchy INTEGER NOT NULL,
  cta_clarity INTEGER NOT NULL,
  accessibility INTEGER NOT NULL,
  content_clarity INTEGER NOT NULL,
  conversion_friction INTEGER NOT NULL,
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  issues JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  priority TEXT NOT NULL,
  summary TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reports"
  ON public.reports FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete reports"
  ON public.reports FOR DELETE
  USING (true);

CREATE INDEX idx_reports_device_id ON public.reports(device_id);
CREATE INDEX idx_reports_created_at ON public.reports(created_at DESC);