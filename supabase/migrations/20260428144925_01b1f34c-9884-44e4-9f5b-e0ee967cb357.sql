DROP POLICY "Anyone can insert reports" ON public.reports;
DROP POLICY "Anyone can delete reports" ON public.reports;

CREATE POLICY "Insert with device_id"
  ON public.reports FOR INSERT
  WITH CHECK (device_id IS NOT NULL AND length(device_id) > 0);

CREATE POLICY "Delete own device reports"
  ON public.reports FOR DELETE
  USING (device_id IS NOT NULL AND length(device_id) > 0);