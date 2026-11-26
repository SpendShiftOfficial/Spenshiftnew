-- Disposable PostgreSQL only, never execute against a customer database.
-- Must be connected to analytics_v2_test as a fresh cluster administrator.
DO $$ BEGIN
 IF current_database() <> 'analytics_v2_test' THEN RAISE EXCEPTION 'isolated database required'; END IF;
 IF to_regclass('public.report_orders') IS NOT NULL OR to_regclass('public.reports') IS NOT NULL THEN RAISE EXCEPTION 'customer schema prohibited'; END IF;
END $$;
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
\ir ../../docs/analytics-v2/candidate-migration.sql
DO $$ DECLARE f oid; BEGIN
 SELECT 'public.spendshift_increment_metrics_v2(text,text,text,text,text,text,text,integer,text,text,text,text,text,text,text,text)'::regprocedure::oid INTO f;
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.spendshift_metrics_v2_daily'::regclass) THEN RAISE EXCEPTION 'RLS missing'; END IF;
 IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.spendshift_metrics_v2_registry'::regclass) THEN RAISE EXCEPTION 'registry RLS missing'; END IF;
 IF has_table_privilege('anon','public.spendshift_metrics_v2_daily','SELECT,INSERT,UPDATE,DELETE') OR has_table_privilege('authenticated','public.spendshift_metrics_v2_daily','SELECT,INSERT,UPDATE,DELETE') THEN RAISE EXCEPTION 'browser access'; END IF;
 IF has_function_privilege('anon',f,'EXECUTE') OR has_function_privilege('authenticated',f,'EXECUTE') THEN RAISE EXCEPTION 'browser RPC access'; END IF;
 IF NOT has_function_privilege('service_role',f,'EXECUTE') THEN RAISE EXCEPTION 'missing service role access'; END IF;
 IF has_table_privilege('service_role','public.spendshift_metrics_v2_registry','INSERT,UPDATE,DELETE') THEN RAISE EXCEPTION 'registry must be read-only'; END IF;
END $$;
SET ROLE service_role;
SELECT public.spendshift_increment_metrics_v2('site_entry',p_page=>'home',p_source=>'instagram',p_campaign=>'meta_founder_v1',p_device=>'mobile',p_browser=>'safari',p_market=>'australia');
DO $$ BEGIN
 IF (SELECT count(*) FROM public.spendshift_metrics_v2_daily WHERE metric_code='site_entry') <> 7 THEN RAISE EXCEPTION 'marginal counts'; END IF;
 BEGIN PERFORM public.spendshift_increment_metrics_v2('site_entry',p_page=>'home',p_source=>'invalid',p_campaign=>'meta_founder_v1',p_device=>'mobile',p_browser=>'safari',p_market=>'australia'); RAISE EXCEPTION 'invalid enum accepted'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 IF (SELECT event_count FROM public.spendshift_metrics_v2_daily WHERE metric_code='site_entry' AND dimension_code='market' AND bucket_code='australia') IS DISTINCT FROM 1::bigint THEN RAISE EXCEPTION 'market marginal missing'; END IF;
 BEGIN PERFORM public.spendshift_increment_metrics_v2('site_entry',p_page=>'home',p_source=>'instagram',p_campaign=>'meta_founder_v1',p_device=>'mobile',p_browser=>'safari',p_market=>'US'); RAISE EXCEPTION 'raw country accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_metric' THEN RAISE; END IF; END;
 BEGIN PERFORM public.spendshift_increment_metrics_v2('site_entry',p_page=>'home',p_source=>'instagram',p_campaign=>'meta_founder_v1',p_device=>'mobile',p_browser=>'safari'); RAISE EXCEPTION 'missing market accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_metric' THEN RAISE; END IF; END;
 BEGIN PERFORM public.spendshift_increment_metrics_v2('audit_start',p_market=>'australia'); RAISE EXCEPTION 'private location accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_metric' THEN RAISE; END IF; END;
 IF (SELECT event_count FROM public.spendshift_metrics_v2_daily WHERE metric_code='site_entry' AND dimension_code='all') <> 1 THEN RAISE EXCEPTION 'partial increment'; END IF;
 BEGIN PERFORM public.spendshift_increment_metrics_v2('audit_start',p_page=>'home'); RAISE EXCEPTION 'unexpected dimension accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'invalid_metric' THEN RAISE; END IF; END;
 BEGIN PERFORM public.spendshift_increment_metrics_v2('audit_back',p_question=>1); RAISE EXCEPTION 'invalid question accepted'; EXCEPTION WHEN foreign_key_violation THEN NULL; END;
 IF EXISTS (SELECT 1 FROM public.spendshift_metrics_v2_daily WHERE metric_code IN ('audit_start','audit_back')) THEN RAISE EXCEPTION 'invalid increment'; END IF;
END $$;
INSERT INTO public.spendshift_metrics_v2_daily VALUES ((now() AT TIME ZONE 'Australia/Sydney')::date-180,'site_entry','market','outside_australia',1);
INSERT INTO public.spendshift_metrics_v2_daily VALUES ((now() AT TIME ZONE 'Australia/Sydney')::date-180,'audit_arrival','all','all',1),((now() AT TIME ZONE 'Australia/Sydney')::date-179,'audit_arrival','all','all',2);
SELECT public.spendshift_prune_metrics_v2();
DO $$ BEGIN
 IF EXISTS(SELECT 1 FROM public.spendshift_metrics_v2_daily WHERE dimension_code='market' AND bucket_code='outside_australia') THEN RAISE EXCEPTION 'market retention cutoff'; END IF;
 IF (SELECT count(*) FROM public.spendshift_metrics_v2_daily WHERE metric_code='audit_arrival')<>1 OR (SELECT event_count FROM public.spendshift_metrics_v2_daily WHERE metric_code='audit_arrival')<>2 THEN RAISE EXCEPTION 'retention cutoff'; END IF;
END $$;
RESET ROLE;
SELECT 'PASS isolated SQL RLS grants, RPC allowlist, atomic rejection and retention';

SET ROLE service_role;
DO $$ BEGIN
 PERFORM public.spendshift_increment_metrics_v2('home_engaged_60s');
 PERFORM public.spendshift_increment_metrics_v2('home_engaged_120s');
 PERFORM public.spendshift_increment_metrics_v2('home_section_hero_seen');
 PERFORM public.spendshift_increment_metrics_v2('home_section_benefits_seen');
 PERFORM public.spendshift_increment_metrics_v2('home_section_offer_seen');
 PERFORM public.spendshift_increment_metrics_v2('home_section_example_seen');
 PERFORM public.spendshift_increment_metrics_v2('home_section_faq_seen');
 PERFORM public.spendshift_increment_metrics_v2('home_section_final_seen');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_header_impression');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_header_click');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_hero_impression');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_hero_click');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_offer_impression');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_offer_click');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_final_impression');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_final_click');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_footer_impression');
 PERFORM public.spendshift_increment_metrics_v2('home_cta_footer_click');
 IF (SELECT count(*) FROM public.spendshift_metrics_v2_daily WHERE metric_code LIKE 'home_%' AND dimension_code='all')<>18 THEN RAISE EXCEPTION 'homepage counts missing'; END IF;
 BEGIN PERFORM public.spendshift_increment_metrics_v2('home_cta_hero_click',p_page=>'home'); RAISE EXCEPTION 'extra homepage field accepted'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_metric' THEN RAISE; END IF; END;
 BEGIN PERFORM public.spendshift_increment_metrics_v2('home_section_arbitrary_seen'); RAISE EXCEPTION 'unapproved homepage code'; EXCEPTION WHEN raise_exception THEN IF SQLERRM<>'invalid_metric' THEN RAISE; END IF; END;
END $$;
RESET ROLE;
SELECT 'PASS homepage event allowlist and aggregate-only SQL';
