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

-- Paid-report usage is tracked separately from free-audit actions.
-- No report link/token, visitor or payment identifier is persisted here.
CREATE TABLE IF NOT EXISTS public.spendshift_report_daily (
  event_date date NOT NULL,
  event_name text NOT NULL CHECK (event_name IN
    ('report_open', 'checklist_interaction', 'tracker_saved', 'feedback_sent')),
  event_count bigint NOT NULL DEFAULT 0 CHECK (event_count >= 0),
  PRIMARY KEY (event_date, event_name)
);

ALTER TABLE public.spendshift_report_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.spendshift_report_daily FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.spendshift_report_daily TO service_role;

-- SECURITY INVOKER; the caller must have service-role table privileges.
CREATE OR REPLACE FUNCTION public.spendshift_increment_report_daily(p_event text)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_event IS NULL OR p_event NOT IN
     ('report_open', 'checklist_interaction', 'tracker_saved', 'feedback_sent') THEN
    RAISE EXCEPTION 'invalid_report_aggregate_event';
  END IF;
  INSERT INTO public.spendshift_report_daily(event_date, event_name, event_count)
  VALUES ((now() AT TIME ZONE 'Australia/Sydney')::date, p_event, 1)
  ON CONFLICT (event_date, event_name)
  DO UPDATE SET event_count = public.spendshift_report_daily.event_count + 1;
END
$$;

REVOKE ALL ON FUNCTION public.spendshift_increment_report_daily(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_increment_report_daily(text)
  TO service_role;


-- Automatic privacy retention: remove anonymous aggregates older than 180
-- complete Sydney-local calendar days. This affects only analytics totals.
CREATE OR REPLACE FUNCTION public.spendshift_prune_analytics_daily()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  audit_removed bigint := 0;
  report_removed bigint := 0;
  cutoff date := (now() AT TIME ZONE 'Australia/Sydney')::date - 180;
BEGIN
  DELETE FROM public.spendshift_audit_daily WHERE event_date <= cutoff;
  GET DIAGNOSTICS audit_removed = ROW_COUNT;
  DELETE FROM public.spendshift_report_daily WHERE event_date <= cutoff;
  GET DIAGNOSTICS report_removed = ROW_COUNT;
  RETURN jsonb_build_object('audit_deleted',audit_removed,'report_deleted',report_removed);
END
$$;

REVOKE ALL ON FUNCTION public.spendshift_prune_analytics_daily() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_prune_analytics_daily() TO service_role;

COMMIT;
