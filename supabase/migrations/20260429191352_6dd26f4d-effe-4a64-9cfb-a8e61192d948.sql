CREATE POLICY "no client access" ON public.processed_stripe_events
  FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);