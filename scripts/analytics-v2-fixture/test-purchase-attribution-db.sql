\set ON_ERROR_STOP on
DO $$ BEGIN IF current_database()<>'analytics_v2_attribution_test' THEN RAISE EXCEPTION 'disposable DB required'; END IF; END $$;
CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;
CREATE TABLE public.report_orders(stripe_session_id text PRIMARY KEY,paid_at timestamptz,status text);
GRANT SELECT ON public.report_orders TO service_role;
\ir ../../docs/analytics-v2/candidate-purchase-attribution.sql
DO $$ BEGIN
 IF has_table_privilege('anon','public.spendshift_checkout_attribution','SELECT') OR has_table_privilege('authenticated','public.spendshift_checkout_attribution','INSERT') OR has_table_privilege('service_role','public.spendshift_purchase_attribution_control','UPDATE') OR has_function_privilege('anon','public.spendshift_read_purchase_attribution(date,date)','EXECUTE') THEN RAISE EXCEPTION 'privilege leak'; END IF;
END $$;
SET ROLE service_role;
DO $$ BEGIN
 IF public.spendshift_save_checkout_attribution(encode(sha256('cs_live_synthetic_paid'::bytea),'hex'),'instagram','meta_founder_v1','creative_01') OR EXISTS(SELECT 1 FROM public.spendshift_checkout_attribution) THEN RAISE EXCEPTION 'gate not closed'; END IF;
END $$;
RESET ROLE;
UPDATE public.spendshift_purchase_attribution_control SET enabled=true;
SET ROLE service_role;
SELECT public.spendshift_save_checkout_attribution(encode(sha256('cs_live_synthetic_paid'::bytea),'hex'),'instagram','meta_founder_v1','creative_01');
SELECT public.spendshift_save_checkout_attribution(encode(sha256('cs_live_synthetic_paid'::bytea),'hex'),'facebook','meta_founder_v1','creative_02');
SELECT public.spendshift_save_checkout_attribution(encode(sha256('cs_live_synthetic_rejected'::bytea),'hex'),'facebook','meta_founder_v1','creative_02');
SELECT public.spendshift_save_checkout_attribution(encode(sha256('cs_live_synthetic_rejected'::bytea),'hex'),NULL,NULL,NULL);
SELECT public.spendshift_save_checkout_attribution(encode(sha256('cs_live_synthetic_abandoned'::bytea),'hex'),'instagram','meta_founder_v1','creative_03');
DO $$ BEGIN
 BEGIN
  PERFORM public.spendshift_save_checkout_attribution(encode(sha256('cs_live_synthetic_bad'::bytea),'hex'),'google','meta_founder_v1','creative_02');
  RAISE EXCEPTION 'invalid allowed';
 EXCEPTION WHEN check_violation THEN NULL; END;
 IF (SELECT count(*) FROM public.spendshift_checkout_attribution)<>2 THEN RAISE EXCEPTION 'duplicate or withdrawal failure'; END IF;
END $$;
RESET ROLE;
INSERT INTO public.report_orders VALUES ('cs_live_synthetic_paid',now(),'ready'),('cs_live_synthetic_rejected',now(),'awaiting_details'),('cs_test_synthetic_ignored',now(),'ready');
SET ROLE service_role;
DO $$ DECLARE d date:=(now() AT TIME ZONE 'Australia/Sydney')::date;r jsonb;BEGIN
 IF public.spendshift_save_checkout_attribution(encode(sha256('cs_live_synthetic_paid'::bytea),'hex'),'facebook','meta_founder_v1','creative_02') THEN RAISE EXCEPTION 'paid attribution rewritten'; END IF;
 r:=public.spendshift_read_purchase_attribution(d,d);
 IF (r->>'total_orders')::int<>2 OR (r->>'attributed')::int<>1 OR (r->>'unattributed')::int<>1 OR r->'groups'->0->>'creative'<>'creative_01' OR r->'groups'->0->>'source'<>'instagram' THEN RAISE EXCEPTION 'incorrect verified paid-order aggregation: %',r; END IF;
END $$;
RESET ROLE;
INSERT INTO public.spendshift_checkout_attribution VALUES (encode(sha256('abandoned_old'::bytea),'hex'),'instagram','meta_founder_v1','creative_01',now()-interval '49 hours'),(encode(sha256('retention_old'::bytea),'hex'),'facebook','meta_founder_v1','creative_02',now()-interval '181 days');
UPDATE public.spendshift_purchase_attribution_control SET enabled=false;
SET ROLE service_role;
SELECT public.spendshift_prune_purchase_attribution();
DO $$ BEGIN IF (SELECT count(*) FROM public.spendshift_checkout_attribution)<>2 THEN RAISE EXCEPTION 'retention failed';END IF;END $$;
RESET ROLE;
\echo PASS gate, role isolation, immutable duplicate checkout, rejection, verified paid aggregation, ignored test/abandoned sessions and independent retention
