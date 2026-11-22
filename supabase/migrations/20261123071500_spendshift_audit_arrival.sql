-- Add one consent-gated, anonymous daily total for free-audit arrivals.
-- Existing start/completion counts, report counts, RLS and retention are unchanged.
-- Store no URL, attribution, IP, answers, browser ID, cookie or customer data.
BEGIN;

ALTER TABLE public.spendshift_audit_daily
  DROP CONSTRAINT spendshift_audit_daily_event_name_check;
ALTER TABLE public.spendshift_audit_daily
  ADD CONSTRAINT spendshift_audit_daily_event_name_check
  CHECK (event_name IN ('audit_arrival', 'audit_start', 'audit_complete'));

CREATE OR REPLACE FUNCTION public.spendshift_increment_audit_daily(p_event text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_event IS NULL OR p_event NOT IN ('audit_arrival', 'audit_start', 'audit_complete') THEN
    RAISE EXCEPTION 'invalid_aggregate_event';
  END IF;

  INSERT INTO public.spendshift_audit_daily(event_date,event_name,event_count)
  VALUES ((now() AT TIME ZONE 'Australia/Sydney')::date,p_event,1)
  ON CONFLICT (event_date,event_name)
  DO UPDATE SET event_count = public.spendshift_audit_daily.event_count + 1;
END
$$;

REVOKE ALL ON FUNCTION public.spendshift_increment_audit_daily(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_increment_audit_daily(text)
  TO service_role;

COMMIT;
