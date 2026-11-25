-- CANDIDATE RELEASE ADDENDUM. Review and test only; never apply to production without approval.
-- Apply AFTER candidate-migration.sql. Collection gate starts false.
BEGIN;
CREATE TABLE public.spendshift_metrics_v2_release_control(singleton boolean PRIMARY KEY CHECK(singleton),enabled boolean NOT NULL DEFAULT false);
INSERT INTO public.spendshift_metrics_v2_release_control VALUES(true,false);
CREATE TABLE public.spendshift_metrics_v2_capacity(metric_date date PRIMARY KEY,accepted bigint NOT NULL CHECK(accepted BETWEEN 0 AND 50000));
ALTER TABLE public.spendshift_metrics_v2_release_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spendshift_metrics_v2_capacity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.spendshift_metrics_v2_release_control,public.spendshift_metrics_v2_capacity FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.spendshift_metrics_v2_release_control TO service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.spendshift_metrics_v2_capacity TO service_role;

CREATE FUNCTION public.spendshift_accept_metrics_v2(p_event text,p_page text DEFAULT NULL,p_source text DEFAULT NULL,p_campaign text DEFAULT NULL,p_device text DEFAULT NULL,p_browser text DEFAULT NULL,p_placement text DEFAULT NULL,p_question integer DEFAULT NULL,p_faq text DEFAULT NULL,p_error text DEFAULT NULL,p_choice text DEFAULT NULL,p_lcp text DEFAULT NULL,p_inp text DEFAULT NULL,p_cls text DEFAULT NULL,p_duration text DEFAULT NULL) RETURNS text
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE d date:=(now() AT TIME ZONE 'Australia/Sydney')::date;
BEGIN
 IF NOT COALESCE((SELECT enabled FROM public.spendshift_metrics_v2_release_control WHERE singleton),false) THEN RETURN 'disabled'; END IF;
 IF p_event IS NULL OR p_event IN ('optional_choice','personalisation_view','personalisation_step_advanced') THEN RAISE EXCEPTION 'invalid_metric'; END IF;
 INSERT INTO public.spendshift_metrics_v2_capacity(metric_date,accepted) VALUES(d,1)
 ON CONFLICT(metric_date) DO UPDATE SET accepted=spendshift_metrics_v2_capacity.accepted+1
 WHERE spendshift_metrics_v2_capacity.accepted<50000;
 IF NOT FOUND THEN RETURN 'limited'; END IF;
 -- A failing increment rolls back the quota increment as well.
 PERFORM public.spendshift_increment_metrics_v2(p_event,p_page,p_source,p_campaign,p_device,p_browser,p_placement,p_question,p_faq,p_error,p_choice,p_lcp,p_inp,p_cls,p_duration);
 RETURN 'accepted';
END $$;
REVOKE ALL ON FUNCTION public.spendshift_accept_metrics_v2(text,text,text,text,text,text,text,integer,text,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_accept_metrics_v2(text,text,text,text,text,text,text,integer,text,text,text,text,text,text,text) TO service_role;

CREATE FUNCTION public.spendshift_prune_metrics_v2_release() RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
BEGIN
 PERFORM public.spendshift_prune_metrics_v2();
 DELETE FROM public.spendshift_metrics_v2_capacity WHERE metric_date<=(now() AT TIME ZONE 'Australia/Sydney')::date-2;
END $$;
REVOKE ALL ON FUNCTION public.spendshift_prune_metrics_v2_release() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_prune_metrics_v2_release() TO service_role;

CREATE FUNCTION public.spendshift_read_metrics_v2(p_from date,p_to date) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE d date:=(now() AT TIME ZONE 'Australia/Sydney')::date;
BEGIN
 IF p_from IS NULL OR p_to IS NULL OR p_from>p_to OR p_to>d OR p_from<d-179 THEN RAISE EXCEPTION 'invalid_range'; END IF;
 RETURN jsonb_build_object('rows',COALESCE((
   SELECT jsonb_agg(to_jsonb(a)) FROM (
      SELECT metric_code,dimension_code,bucket_code,SUM(event_count)::text AS event_count
      FROM public.spendshift_metrics_v2_daily WHERE metric_date BETWEEN p_from AND p_to GROUP BY 1,2,3
   ) a),'[]'::jsonb),'operations',(
   SELECT jsonb_build_object(
      'order_cohort',count(*) FILTER (WHERE paid_day BETWEEN p_from AND p_to),
      'details_completed',count(*) FILTER (WHERE paid_day BETWEEN p_from AND p_to AND completed),
      'reports_ready',count(*) FILTER (WHERE paid_day BETWEEN p_from AND p_to AND status='ready'),
      'emails_processed',count(*) FILTER (WHERE paid_day BETWEEN p_from AND p_to AND sent_day IS NOT NULL),
      'failed_order_status',count(*) FILTER (WHERE paid_day BETWEEN p_from AND p_to AND status='failed'),
      'reports_ready_throughput',count(*) FILTER (WHERE ready_day BETWEEN p_from AND p_to),
      'emails_processed_throughput',count(*) FILTER (WHERE sent_day BETWEEN p_from AND p_to),
      'stripe_paid_orders',NULL,'gross_cents',NULL,'refund_cents',NULL,'payment_failures',NULL,
      'meta_spend_cents',NULL,'meta_lpv',NULL,'meta_outbound_clicks',NULL,'ga4_sessions',NULL,
      'legacy_audit_starts',(SELECT sum(event_count) FROM public.spendshift_audit_daily WHERE event_name='audit_start' AND event_date BETWEEN p_from AND p_to)
   ) FROM (SELECT (paid_at AT TIME ZONE 'Australia/Sydney')::date AS paid_day,
                 (ready_at AT TIME ZONE 'Australia/Sydney')::date AS ready_day,
                 (report_sent_at AT TIME ZONE 'Australia/Sydney')::date AS sent_day,status,
                 refinements->>'completed'='true' AS completed
            FROM public.report_orders WHERE paid_at IS NOT NULL AND left(stripe_session_id,8)='cs_live_') o
 ));
END $$;
REVOKE ALL ON FUNCTION public.spendshift_read_metrics_v2(date,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_read_metrics_v2(date,date) TO service_role;

-- Auth session validation must not grant table reads to the public API role.
-- Restricted private SECURITY DEFINER returns only a boolean; verify this schema is NOT Data API exposed.
CREATE SCHEMA spendshift_analytics_private;
REVOKE ALL ON SCHEMA spendshift_analytics_private FROM PUBLIC,anon,authenticated,service_role;
GRANT USAGE ON SCHEMA spendshift_analytics_private TO service_role;
CREATE FUNCTION spendshift_analytics_private.owner_session_active(p_user uuid,p_session uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT EXISTS(SELECT 1 FROM auth.sessions WHERE id=p_session AND user_id=p_user AND aal::text='aal2' AND (not_after IS NULL OR not_after>now()));
$$;
REVOKE ALL ON FUNCTION spendshift_analytics_private.owner_session_active(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION spendshift_analytics_private.owner_session_active(uuid,uuid) TO service_role;
CREATE FUNCTION public.spendshift_owner_session_active(p_user uuid,p_session uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
 SELECT spendshift_analytics_private.owner_session_active(p_user,p_session);
$$;
REVOKE ALL ON FUNCTION public.spendshift_owner_session_active(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_owner_session_active(uuid,uuid) TO service_role;
COMMIT;
