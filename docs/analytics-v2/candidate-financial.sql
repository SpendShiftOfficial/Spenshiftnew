-- CANDIDATE ONLY. Apply after candidate-release.sql, only with separate approval.
-- Imported daily aggregates only: no customer rows, transaction IDs or provider credentials.
BEGIN;
CREATE TABLE public.spendshift_v2_stripe_daily (
 metric_date date PRIMARY KEY,
 stripe_paid_orders bigint NOT NULL CHECK(stripe_paid_orders BETWEEN 0 AND 1000000000000),
 gross_cents bigint NOT NULL CHECK(gross_cents BETWEEN 0 AND 1000000000000),
 refund_cents bigint NOT NULL CHECK(refund_cents BETWEEN 0 AND 1000000000000),
 payment_failures bigint NOT NULL CHECK(payment_failures BETWEEN 0 AND 1000000000000),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.spendshift_v2_stripe_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.spendshift_v2_stripe_daily FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.spendshift_v2_stripe_daily TO service_role;
CREATE TABLE public.spendshift_v2_meta_daily (
 metric_date date PRIMARY KEY,
 meta_spend_cents bigint NOT NULL CHECK(meta_spend_cents BETWEEN 0 AND 1000000000000),
 meta_lpv bigint NOT NULL CHECK(meta_lpv BETWEEN 0 AND 1000000000000),
 meta_outbound_clicks bigint NOT NULL CHECK(meta_outbound_clicks BETWEEN 0 AND 1000000000000),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.spendshift_v2_meta_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.spendshift_v2_meta_daily FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.spendshift_v2_meta_daily TO service_role;
CREATE TABLE public.spendshift_v2_ga4_daily (
 metric_date date PRIMARY KEY,
 ga4_sessions bigint NOT NULL CHECK(ga4_sessions BETWEEN 0 AND 1000000000000),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.spendshift_v2_ga4_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.spendshift_v2_ga4_daily FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.spendshift_v2_ga4_daily TO service_role;
CREATE FUNCTION public.spendshift_save_source_v2(p_date date,p_source text,p_values jsonb) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE d date:=(now() AT TIME ZONE 'Australia/Sydney')::date; required text[]; k text; v jsonb;
BEGIN
 IF p_date IS NULL OR p_date>d OR p_date<d-179 OR p_source IS NULL OR p_values IS NULL OR jsonb_typeof(p_values)<>'object' THEN RAISE EXCEPTION 'invalid_source'; END IF;
 CASE p_source
 WHEN 'stripe' THEN required:=ARRAY['stripe_paid_orders','gross_cents','refund_cents','payment_failures'];
 WHEN 'meta' THEN required:=ARRAY['meta_spend_cents','meta_lpv','meta_outbound_clicks'];
 WHEN 'ga4' THEN required:=ARRAY['ga4_sessions'];
 ELSE RAISE EXCEPTION 'invalid_source';
 END CASE;
 IF (SELECT count(*) FROM jsonb_object_keys(p_values))<>cardinality(required) OR NOT (p_values ?& required) THEN RAISE EXCEPTION 'invalid_source'; END IF;
 FOREACH k IN ARRAY required LOOP
   v:=p_values->k;
   IF jsonb_typeof(v)<>'number' OR v::text !~ '^[0-9]{1,13}$' OR (v::text)::numeric>1000000000000 THEN RAISE EXCEPTION 'invalid_source'; END IF;
 END LOOP;
 CASE p_source
 WHEN 'stripe' THEN INSERT INTO public.spendshift_v2_stripe_daily(metric_date,stripe_paid_orders,gross_cents,refund_cents,payment_failures) VALUES(p_date,(p_values->>'stripe_paid_orders')::bigint,(p_values->>'gross_cents')::bigint,(p_values->>'refund_cents')::bigint,(p_values->>'payment_failures')::bigint) ON CONFLICT(metric_date) DO UPDATE SET stripe_paid_orders=EXCLUDED.stripe_paid_orders,gross_cents=EXCLUDED.gross_cents,refund_cents=EXCLUDED.refund_cents,payment_failures=EXCLUDED.payment_failures,updated_at=now();
 WHEN 'meta' THEN INSERT INTO public.spendshift_v2_meta_daily(metric_date,meta_spend_cents,meta_lpv,meta_outbound_clicks) VALUES(p_date,(p_values->>'meta_spend_cents')::bigint,(p_values->>'meta_lpv')::bigint,(p_values->>'meta_outbound_clicks')::bigint) ON CONFLICT(metric_date) DO UPDATE SET meta_spend_cents=EXCLUDED.meta_spend_cents,meta_lpv=EXCLUDED.meta_lpv,meta_outbound_clicks=EXCLUDED.meta_outbound_clicks,updated_at=now();
 WHEN 'ga4' THEN INSERT INTO public.spendshift_v2_ga4_daily(metric_date,ga4_sessions) VALUES(p_date,(p_values->>'ga4_sessions')::bigint) ON CONFLICT(metric_date) DO UPDATE SET ga4_sessions=EXCLUDED.ga4_sessions,updated_at=now();
 END CASE;
END $$;
REVOKE ALL ON FUNCTION public.spendshift_save_source_v2(date,text,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_save_source_v2(date,text,jsonb) TO service_role;
CREATE FUNCTION public.spendshift_read_financial_v2(p_from date,p_to date) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE d date:=(now() AT TIME ZONE 'Australia/Sydney')::date; n integer; stripe_n integer; meta_n integer; ga4_n integer;
BEGIN
 IF p_from IS NULL OR p_to IS NULL OR p_from>p_to OR p_to>d OR p_from<d-179 THEN RAISE EXCEPTION 'invalid_range'; END IF;
 n:=p_to-p_from+1;
 SELECT count(*) INTO stripe_n FROM public.spendshift_v2_stripe_daily WHERE metric_date BETWEEN p_from AND p_to;
 SELECT count(*) INTO meta_n FROM public.spendshift_v2_meta_daily WHERE metric_date BETWEEN p_from AND p_to;
 SELECT count(*) INTO ga4_n FROM public.spendshift_v2_ga4_daily WHERE metric_date BETWEEN p_from AND p_to;
 RETURN jsonb_build_object('coverage',jsonb_build_object('expected_days',n,'stripe',stripe_n,'meta',meta_n,'ga4',ga4_n),
 'values',jsonb_build_object('stripe_paid_orders',CASE WHEN stripe_n=n THEN (SELECT sum(stripe_paid_orders) FROM public.spendshift_v2_stripe_daily WHERE metric_date BETWEEN p_from AND p_to) ELSE NULL END,
 'gross_cents',CASE WHEN stripe_n=n THEN (SELECT sum(gross_cents) FROM public.spendshift_v2_stripe_daily WHERE metric_date BETWEEN p_from AND p_to) ELSE NULL END,
 'refund_cents',CASE WHEN stripe_n=n THEN (SELECT sum(refund_cents) FROM public.spendshift_v2_stripe_daily WHERE metric_date BETWEEN p_from AND p_to) ELSE NULL END,
 'payment_failures',CASE WHEN stripe_n=n THEN (SELECT sum(payment_failures) FROM public.spendshift_v2_stripe_daily WHERE metric_date BETWEEN p_from AND p_to) ELSE NULL END,
 'meta_spend_cents',CASE WHEN meta_n=n THEN (SELECT sum(meta_spend_cents) FROM public.spendshift_v2_meta_daily WHERE metric_date BETWEEN p_from AND p_to) ELSE NULL END,
 'meta_lpv',CASE WHEN meta_n=n THEN (SELECT sum(meta_lpv) FROM public.spendshift_v2_meta_daily WHERE metric_date BETWEEN p_from AND p_to) ELSE NULL END,
 'meta_outbound_clicks',CASE WHEN meta_n=n THEN (SELECT sum(meta_outbound_clicks) FROM public.spendshift_v2_meta_daily WHERE metric_date BETWEEN p_from AND p_to) ELSE NULL END,
 'ga4_sessions',CASE WHEN ga4_n=n THEN (SELECT sum(ga4_sessions) FROM public.spendshift_v2_ga4_daily WHERE metric_date BETWEEN p_from AND p_to) ELSE NULL END));
END $$;
REVOKE ALL ON FUNCTION public.spendshift_read_financial_v2(date,date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_read_financial_v2(date,date) TO service_role;
CREATE OR REPLACE FUNCTION public.spendshift_prune_metrics_v2_release() RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE d date:=(now() AT TIME ZONE 'Australia/Sydney')::date;
BEGIN
 PERFORM public.spendshift_prune_metrics_v2();
 DELETE FROM public.spendshift_metrics_v2_capacity WHERE metric_date<=d-2;
 DELETE FROM public.spendshift_v2_stripe_daily WHERE metric_date<=d-180;
 DELETE FROM public.spendshift_v2_meta_daily WHERE metric_date<=d-180;
 DELETE FROM public.spendshift_v2_ga4_daily WHERE metric_date<=d-180;
END $$;
REVOKE ALL ON FUNCTION public.spendshift_prune_metrics_v2_release() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_prune_metrics_v2_release() TO service_role;
COMMIT;
