-- Migration: Add comprehensive RLS policies to rate_limits and leads tables

-- rate_limits table: Deny all public access (edge functions use service_role_key to bypass)
CREATE POLICY "Deny public select on rate_limits"
  ON public.rate_limits FOR SELECT
  USING (false);

CREATE POLICY "Deny public insert on rate_limits"
  ON public.rate_limits FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny public update on rate_limits"
  ON public.rate_limits FOR UPDATE
  USING (false);

CREATE POLICY "Deny public delete on rate_limits"
  ON public.rate_limits FOR DELETE
  USING (false);

-- leads table: Add explicit UPDATE/DELETE denial policies
CREATE POLICY "Deny public update on leads"
  ON public.leads FOR UPDATE
  USING (false);

CREATE POLICY "Deny public delete on leads"
  ON public.leads FOR DELETE
  USING (false);