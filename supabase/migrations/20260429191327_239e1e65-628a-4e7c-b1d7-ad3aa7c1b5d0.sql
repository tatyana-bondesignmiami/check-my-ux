CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
  event_id text PRIMARY KEY,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_processed_at
  ON public.processed_stripe_events (processed_at);