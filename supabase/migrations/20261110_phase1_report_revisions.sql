-- Phase 1: keep an audit trail when a paid customer corrects an answer.
-- This function is callable only by the server's Supabase service role.
CREATE OR REPLACE FUNCTION public.spendshift_update_report_revision(
  p_session_id text,
  p_expected_updated_at timestamptz,
  p_answers jsonb,
  p_refinements jsonb,
  p_report_text text,
  p_savings_summary jsonb
) RETURNS TABLE(report_id text, revision_number integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_order public.report_orders%ROWTYPE;
  v_report public.reports%ROWTYPE;
  v_history jsonb;
  v_count integer;
BEGIN
  IF p_session_id IS NULL OR length(p_session_id) > 255 OR
     p_answers IS NULL OR jsonb_typeof(p_answers) <> 'array' OR
     p_refinements IS NULL OR jsonb_typeof(p_refinements) <> 'object' OR
     p_savings_summary IS NULL OR jsonb_typeof(p_savings_summary->'opportunities') <> 'array' OR
     length(p_report_text) > 120000 THEN
    RAISE EXCEPTION 'invalid_revision';
  END IF;

  SELECT * INTO v_order FROM public.report_orders
  WHERE stripe_session_id = p_session_id FOR UPDATE;

  IF NOT FOUND OR v_order.status <> 'ready' OR v_order.report_id IS NULL OR
     v_order.updated_at IS DISTINCT FROM p_expected_updated_at THEN
    RAISE EXCEPTION 'revision_conflict';
  END IF;

  SELECT * INTO v_report FROM public.reports
  WHERE id = v_order.report_id AND stripe_session_id = p_session_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'report_not_found';
  END IF;

  v_history := COALESCE(v_report.savings_summary->'revision_history', '[]'::jsonb);
  IF jsonb_typeof(v_history) <> 'array' THEN
    RAISE EXCEPTION 'invalid_history';
  END IF;
  v_count := jsonb_array_length(v_history);
  IF v_count >= 20 THEN
    RAISE EXCEPTION 'revision_limit';
  END IF;

  v_history := v_history || jsonb_build_array(jsonb_build_object(
    'saved_at', now(),
    'answers', v_report.answers,
    'refinements', v_report.refinements,
    'report', v_report.report,
    'savings_summary', v_report.savings_summary - 'revision_history'
  ));

  UPDATE public.reports SET
    answers = p_answers,
    refinements = p_refinements,
    report = p_report_text,
    savings_summary = (p_savings_summary || jsonb_build_object(
      'revision_history', v_history,
      'revision_count', v_count + 1
    ))
  WHERE id = v_report.id;

  UPDATE public.report_orders SET
    answers = p_answers,
    refinements = p_refinements,
    status = 'ready',
    updated_at = now()
  WHERE stripe_session_id = p_session_id;

  RETURN QUERY SELECT v_report.id::text, (v_count + 1)::integer;
END;
$$;

REVOKE ALL ON FUNCTION public.spendshift_update_report_revision(
  text, timestamptz, jsonb, jsonb, text, jsonb
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spendshift_update_report_revision(
  text, timestamptz, jsonb, jsonb, text, jsonb
) TO service_role;
