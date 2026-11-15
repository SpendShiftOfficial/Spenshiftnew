-- Draft migration for Phase 1 analytics: NOT applied to production.
-- A deliberately coarse daily aggregate with no visitor identifiers,
-- answer details, report IDs, URLs, email addresses, IPs or amounts.
BEGIN;

CREATE TABLE IF NOT EXISTS public.spendshift_audit_daily (
  event_date date NOT NULL,
  event_name text NOT NULL CHECK (event_name IN ('audit_start', 'audit_complete')),
  event_count bigint NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  PRIMARY KEY (event_date, event_name)
);

ALTER TABLE public.spendshift_audit_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.spendshift_audit_daily FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.spendshift_audit_daily TO service_role;

-- SECURITY INVOKER: this function does not bypass RLS.
-- Only the server's service-role client may call it.
CREATE OR REPLACE FUNCTION public.spendshift_increment_audit_daily(p_event text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_event IS NULL OR p_event NOT IN ('audit_start', 'audit_complete') THEN
    RAISE EXCEPTION 'invalid_aggregate_event';
  END IF;
  INSERT INTO public.spendshift_audit_daily(event_date,event_name,event_count)
  VALUES ((now() AT TIME ZONE 'Australia/Sydney')::date,p_event,1)
  ON CONFLICT (event_date,event_name)
  DO UPDATE SET event_count = public.spendshift_audit_daily.event_count + 1;
END
$$;

REVOKE ALL ON FUNCTION public.spendshift_increment_audit_daily(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_increment_audit_daily(text) TO service_role;

COMMIT;
