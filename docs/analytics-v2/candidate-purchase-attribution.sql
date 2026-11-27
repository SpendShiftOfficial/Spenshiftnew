-- ISOLATED CANDIDATE ONLY. Apply after explicit privacy approval and reviewed release.
-- No changes to report_orders, checkout, payments or the existing v2 registry.
BEGIN;
CREATE TABLE public.spendshift_purchase_attribution_control(singleton boolean PRIMARY KEY CHECK(singleton),enabled boolean NOT NULL DEFAULT false);
INSERT INTO public.spendshift_purchase_attribution_control(singleton,enabled) VALUES(true,false);
CREATE TABLE public.spendshift_checkout_attribution(
 checkout_hash text PRIMARY KEY CHECK(checkout_hash ~ '^[0-9a-f]{64}$'),
 source_code text NOT NULL CHECK(source_code IN ('instagram','facebook','tiktok','google','other_search','other_social','other_referral')),
 campaign_code text NOT NULL CHECK(campaign_code IN ('none_or_unknown','meta_founder_v1')),
 creative_code text NOT NULL CHECK(creative_code='none_or_unknown' OR creative_code ~ '^creative_0[1-8]$'),
 tagged_at timestamptz NOT NULL DEFAULT now(),
 CHECK((campaign_code='none_or_unknown' AND creative_code='none_or_unknown') OR (campaign_code='meta_founder_v1' AND source_code IN ('instagram','facebook')))
);
ALTER TABLE public.spendshift_purchase_attribution_control ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spendshift_checkout_attribution ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.spendshift_purchase_attribution_control,public.spendshift_checkout_attribution FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.spendshift_purchase_attribution_control TO service_role;
GRANT SELECT,INSERT,DELETE ON public.spendshift_checkout_attribution TO service_role;
CREATE FUNCTION public.spendshift_save_checkout_attribution(p_checkout_hash text,p_source text,p_campaign text,p_creative text) RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
BEGIN
 IF p_checkout_hash IS NULL OR p_checkout_hash !~ '^[0-9a-f]{64}$' THEN RAISE EXCEPTION 'invalid checkout context'; END IF;
 -- Never backfill or rewrite confirmed paid-order labels.
 IF EXISTS(SELECT 1 FROM public.report_orders o WHERE encode(sha256(convert_to(o.stripe_session_id,'UTF8')),'hex')=p_checkout_hash) THEN RETURN false; END IF;
 IF p_source IS NULL AND p_campaign IS NULL AND p_creative IS NULL THEN
   DELETE FROM public.spendshift_checkout_attribution WHERE checkout_hash=p_checkout_hash; RETURN true;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.spendshift_purchase_attribution_control WHERE singleton AND enabled) THEN RETURN false; END IF;
 IF p_source IS NULL OR p_campaign IS NULL OR p_creative IS NULL THEN RAISE EXCEPTION 'invalid checkout context'; END IF;
 INSERT INTO public.spendshift_checkout_attribution(checkout_hash,source_code,campaign_code,creative_code) VALUES(p_checkout_hash,p_source,p_campaign,p_creative) ON CONFLICT(checkout_hash) DO NOTHING;
 RETURN true;
END $$;
CREATE FUNCTION public.spendshift_read_purchase_attribution(p_from date,p_to date) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; d date:=(now() AT TIME ZONE 'Australia/Sydney')::date;
BEGIN
 IF p_from IS NULL OR p_to IS NULL OR p_to<p_from OR p_to>d OR p_from<d-179 OR p_to-p_from>179 THEN RAISE EXCEPTION 'invalid range'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.spendshift_purchase_attribution_control WHERE singleton AND enabled) THEN RETURN NULL; END IF;
 WITH orders AS (
  SELECT a.source_code AS source,a.campaign_code AS campaign,a.creative_code AS creative
  FROM public.report_orders o
  LEFT JOIN public.spendshift_checkout_attribution a ON a.checkout_hash=encode(sha256(convert_to(o.stripe_session_id,'UTF8')),'hex')
    AND a.tagged_at<=o.paid_at AND o.paid_at<a.tagged_at+interval '48 hours'
  WHERE left(o.stripe_session_id,8)='cs_live_' AND o.paid_at IS NOT NULL AND (o.paid_at AT TIME ZONE 'Australia/Sydney')::date BETWEEN p_from AND p_to
 ), groups AS (SELECT source,campaign,creative,count(*) AS count FROM orders WHERE source IS NOT NULL GROUP BY source,campaign,creative)
 SELECT jsonb_build_object('total_orders',(SELECT count(*) FROM orders),'attributed',(SELECT count(*) FROM orders WHERE source IS NOT NULL),'unattributed',(SELECT count(*) FROM orders WHERE source IS NULL),'groups',COALESCE((SELECT jsonb_agg(to_jsonb(g) ORDER BY g.source,g.campaign,g.creative) FROM groups g),'[]'::jsonb)) INTO result;
 RETURN result;
END $$;
CREATE FUNCTION public.spendshift_prune_purchase_attribution() RETURNS void LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,public AS $$
 DELETE FROM public.spendshift_checkout_attribution a WHERE a.tagged_at<now()-interval '180 days' OR (a.tagged_at<now()-interval '48 hours' AND NOT EXISTS(SELECT 1 FROM public.report_orders o WHERE encode(sha256(convert_to(o.stripe_session_id,'UTF8')),'hex')=a.checkout_hash AND o.paid_at>=a.tagged_at AND o.paid_at<a.tagged_at+interval '48 hours' AND left(o.stripe_session_id,8)='cs_live_'));
$$;
REVOKE ALL ON FUNCTION public.spendshift_save_checkout_attribution(text,text,text,text),public.spendshift_read_purchase_attribution(date,date),public.spendshift_prune_purchase_attribution() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_save_checkout_attribution(text,text,text,text),public.spendshift_read_purchase_attribution(date,date),public.spendshift_prune_purchase_attribution() TO service_role;
COMMIT;
