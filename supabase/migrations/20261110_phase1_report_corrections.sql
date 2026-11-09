-- Phase 1 corrections: atomic update of an existing paid report.
-- Apply to the isolated development project first. Do not run on production
-- until the complete preview checkout and correction tests have passed.
begin;
create or replace function public.update_spendshift_report_cas(
  p_report_id text,
  p_expected_revision integer,
  p_answers jsonb,
  p_refinements jsonb,
  p_report text,
  p_savings_summary jsonb
) returns boolean
language plpgsql
security invoker
set search_path = ''
as $function$
declare updated boolean;
begin
  if p_expected_revision < 1 or p_expected_revision > 6 then return false; end if;
  update public.reports
    set answers = p_answers,
        refinements = p_refinements,
        report = p_report,
        savings_summary = p_savings_summary
  where id = p_report_id
    and stripe_session_id is not null
    and coalesce((savings_summary ->> 'edit_revision')::integer, 1) = p_expected_revision
    and coalesce((savings_summary ->> 'version')::integer, 0) >= 3;
  get diagnostics updated = row_count;
  return updated;
end;
$function$;
revoke all on function public.update_spendshift_report_cas(text,integer,jsonb,jsonb,text,jsonb)
  from public, anon, authenticated;
grant execute on function public.update_spendshift_report_cas(text,integer,jsonb,jsonb,text,jsonb)
  to service_role;
commit;
-- Verification:
-- select has_function_privilege('anon','public.update_spendshift_report_cas(text,integer,jsonb,jsonb,text,jsonb)','EXECUTE') as anon_can_edit,
-- has_function_privilege('service_role','public.update_spendshift_report_cas(text,integer,jsonb,jsonb,text,jsonb)','EXECUTE') as service_can_edit;
