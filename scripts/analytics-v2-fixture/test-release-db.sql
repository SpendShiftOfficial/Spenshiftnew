-- Run only in a second disposable CI database. Synthetic records deliberately isolated.
DO $$ BEGIN
 IF current_database()<>'analytics_v2_release_test' OR to_regclass('public.report_orders') IS NOT NULL OR to_regclass('auth.sessions') IS NOT NULL THEN RAISE EXCEPTION 'isolated release DB required'; END IF;
END $$;
CREATE SCHEMA auth;
CREATE TABLE auth.sessions(id uuid PRIMARY KEY,user_id uuid NOT NULL,aal text,not_after timestamptz);
CREATE TABLE public.report_orders(stripe_session_id text PRIMARY KEY,paid_at timestamptz,status text,refinements jsonb,ready_at timestamptz,report_sent_at timestamptz);
CREATE TABLE public.spendshift_audit_daily(event_date date,event_name text,event_count bigint);
INSERT INTO public.report_orders VALUES
('cs_live_synthetic1',now(),'ready','{"completed":true}',now(),now()),
('cs_live_synthetic2',now(),'failed','{"completed":false}',NULL,NULL),
('cs_test_synthetic3',now(),'ready','{"completed":true}',now(),now());
INSERT INTO public.spendshift_audit_daily VALUES ((now() AT TIME ZONE 'Australia/Sydney')::date,'audit_start',7);
INSERT INTO auth.sessions VALUES ('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','aal2',now()+interval '1 day'),
('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','aal1',NULL),
('44444444-4444-4444-8444-444444444444','11111111-1111-4111-8111-111111111111','aal2',now()-interval '1 hour');
GRANT SELECT ON public.report_orders,public.spendshift_audit_daily TO service_role;
\ir ../../docs/analytics-v2/candidate-migration.sql
\ir ../../docs/analytics-v2/candidate-release.sql
DO $$ BEGIN
 IF has_table_privilege('service_role','public.spendshift_metrics_v2_release_control','UPDATE') OR has_table_privilege('anon','public.spendshift_metrics_v2_capacity','SELECT') OR has_schema_privilege('authenticated','spendshift_analytics_private','USAGE') THEN RAISE EXCEPTION 'unexpected privileges'; END IF;
 IF has_function_privilege('anon','public.spendshift_read_metrics_v2(date,date)','EXECUTE') OR has_function_privilege('authenticated','public.spendshift_owner_session_active(uuid,uuid)','EXECUTE') THEN RAISE EXCEPTION 'unauthorised RPC'; END IF;
END $$;
SET ROLE service_role;
DO $$ BEGIN
 IF public.spendshift_accept_metrics_v2('audit_start')<>'disabled' OR EXISTS(SELECT 1 FROM public.spendshift_metrics_v2_daily) THEN RAISE EXCEPTION 'gate default'; END IF;
 IF NOT public.spendshift_owner_session_active('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222') OR public.spendshift_owner_session_active('11111111-1111-4111-8111-111111111111','33333333-3333-4333-8333-333333333333') OR public.spendshift_owner_session_active('11111111-1111-4111-8111-111111111111','44444444-4444-4444-8444-444444444444') OR public.spendshift_owner_session_active('99999999-9999-4999-8999-999999999999','22222222-2222-4222-8222-222222222222') THEN RAISE EXCEPTION 'session check'; END IF;
END $$;
RESET ROLE;
-- Simulate separately authorised DB gate in disposable test only.
UPDATE public.spendshift_metrics_v2_release_control SET enabled=true;
SET ROLE service_role;
DO $$ DECLARE d date:=(now() AT TIME ZONE 'Australia/Sydney')::date; r jsonb; BEGIN
 IF public.spendshift_accept_metrics_v2('audit_start')<>'accepted' THEN RAISE EXCEPTION 'valid increment'; END IF;
 BEGIN PERFORM public.spendshift_accept_metrics_v2('audit_start',p_page=>'home'); RAISE EXCEPTION 'invalid accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_metric' THEN RAISE; END IF; END;
 IF (SELECT accepted FROM public.spendshift_metrics_v2_capacity WHERE metric_date=d)<>1 THEN RAISE EXCEPTION 'quota rollback'; END IF;
 UPDATE public.spendshift_metrics_v2_capacity SET accepted=49999 WHERE metric_date=d;
 IF public.spendshift_accept_metrics_v2('audit_start')<>'accepted' OR public.spendshift_accept_metrics_v2('audit_start')<>'limited' THEN RAISE EXCEPTION 'quota cap'; END IF;
 IF (SELECT event_count FROM public.spendshift_metrics_v2_daily WHERE metric_code='audit_start')<>2 THEN RAISE EXCEPTION 'quota partial'; END IF;
 r:=public.spendshift_read_metrics_v2(d,d);
 IF r->'operations'->>'order_cohort'<>'2' OR r->'operations'->>'reports_ready'<>'1' OR r->'operations'->>'legacy_audit_starts'<>'7' OR r->'operations'->>'stripe_paid_orders' IS NOT NULL THEN RAISE EXCEPTION 'operational aggregation'; END IF;
 IF r::text LIKE '%cs_live_synthetic%' OR r::text LIKE '%stripe_session_id%' THEN RAISE EXCEPTION 'identifier exposed'; END IF;
 BEGIN PERFORM public.spendshift_read_metrics_v2(d-180,d); RAISE EXCEPTION 'bad range accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_range' THEN RAISE; END IF; END;
 INSERT INTO public.spendshift_metrics_v2_capacity VALUES(d-2,10),(d-1,9);
 PERFORM public.spendshift_prune_metrics_v2_release();
 IF EXISTS(SELECT 1 FROM public.spendshift_metrics_v2_capacity WHERE metric_date=d-2) OR NOT EXISTS(SELECT 1 FROM public.spendshift_metrics_v2_capacity WHERE metric_date=d-1) THEN RAISE EXCEPTION 'capacity retention'; END IF;
END $$;
RESET ROLE;
DELETE FROM auth.sessions WHERE id='22222222-2222-4222-8222-222222222222';
SET ROLE service_role;
DO $$ BEGIN IF public.spendshift_owner_session_active('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222') THEN RAISE EXCEPTION 'revoked session accepted'; END IF; END $$;
RESET ROLE;
SELECT 'PASS release DB gate, atomic cap, read aggregation, MFA session revocation, grants and pruning';
-- Append to the disposable release database tests only.
\ir ../../docs/analytics-v2/candidate-financial.sql
DO $$ BEGIN
 IF has_table_privilege('anon','public.spendshift_v2_stripe_daily','SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege('authenticated','public.spendshift_v2_meta_daily','SELECT,INSERT,UPDATE,DELETE') OR has_function_privilege('authenticated','public.spendshift_save_source_v2(date,text,jsonb)','EXECUTE') OR has_function_privilege('anon','public.spendshift_read_financial_v2(date,date)','EXECUTE') THEN RAISE EXCEPTION 'unexpected source permissions'; END IF;
END $$;
SET ROLE service_role;
DO $$ DECLARE d date:=(now() AT TIME ZONE 'Australia/Sydney')::date; r jsonb;
BEGIN
 PERFORM public.spendshift_save_source_v2(d,'stripe','{"stripe_paid_orders":4,"gross_cents":12600,"refund_cents":2900,"payment_failures":2}');
 PERFORM public.spendshift_save_source_v2(d,'stripe','{"stripe_paid_orders":3,"gross_cents":8700,"refund_cents":2900,"payment_failures":1}');
 PERFORM public.spendshift_save_source_v2(d,'meta','{"meta_spend_cents":800,"meta_lpv":18,"meta_outbound_clicks":21}');
 PERFORM public.spendshift_save_source_v2(d,'ga4','{"ga4_sessions":0}');
 r:=public.spendshift_read_financial_v2(d,d);
 IF r->'values'->>'stripe_paid_orders'<>'3' OR r->'values'->>'gross_cents'<>'8700' OR r->'values'->>'ga4_sessions'<>'0' OR r->'coverage'->>'stripe'<>'1' THEN RAISE EXCEPTION 'replacement or zero'; END IF;
 r:=public.spendshift_read_financial_v2(d-1,d);
 IF r->'values'->>'gross_cents' IS NOT NULL OR r->'coverage'->>'expected_days'<>'2' OR r->'coverage'->>'stripe'<>'1' THEN RAISE EXCEPTION 'incomplete totals'; END IF;
 PERFORM public.spendshift_save_source_v2(d-1,'stripe','{"stripe_paid_orders":0,"gross_cents":0,"refund_cents":0,"payment_failures":0}');
 r:=public.spendshift_read_financial_v2(d-1,d);
 IF r->'values'->>'gross_cents'<>'8700' OR r->'values'->>'meta_lpv' IS NOT NULL THEN RAISE EXCEPTION 'source coverage'; END IF;
 BEGIN PERFORM public.spendshift_save_source_v2(d,'ga4','{"ga4_sessions":2,"email":"synthetic@example.invalid"}');RAISE EXCEPTION 'extra accepted';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_source' THEN RAISE;END IF;END;
 BEGIN PERFORM public.spendshift_save_source_v2(d,'ga4','{"ga4_sessions":-1}');RAISE EXCEPTION 'negative accepted';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_source' THEN RAISE;END IF;END;
 BEGIN PERFORM public.spendshift_save_source_v2(d+1,'ga4','{"ga4_sessions":0}');RAISE EXCEPTION 'future accepted';EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_source' THEN RAISE;END IF;END;
 INSERT INTO public.spendshift_v2_ga4_daily(metric_date,ga4_sessions) VALUES(d-180,11),(d-179,2);
 PERFORM public.spendshift_prune_metrics_v2_release();
 IF EXISTS(SELECT 1 FROM public.spendshift_v2_ga4_daily WHERE metric_date=d-180) OR NOT EXISTS(SELECT 1 FROM public.spendshift_v2_ga4_daily WHERE metric_date=d-179) THEN RAISE EXCEPTION 'source retention'; END IF;
END $$;
RESET ROLE;
SELECT 'PASS financial aggregate source permissions, replacement, source coverage, explicit zeros, validation and retention';
