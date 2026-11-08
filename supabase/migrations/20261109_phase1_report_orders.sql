-- SpendShift Phase 1: review in Supabase SQL Editor BEFORE production deployment.
-- Safe additions only. Existing report rows and paid links are left intact.
BEGIN;

CREATE TABLE IF NOT EXISTS public.report_orders (
  stripe_session_id text PRIMARY KEY,
  status text NOT NULL DEFAULT 'awaiting_details'
    CHECK (status IN ('awaiting_details', 'processing', 'ready', 'failed')),
  answers jsonb NOT NULL,
  refinements jsonb,
  customer_email text,
  report_id text,
  paid_at timestamptz NOT NULL DEFAULT now(),
  processing_started_at timestamptz,
  ready_at timestamptz,
  confirmation_sent_at timestamptz,
  report_sent_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS report_orders_status_created_idx
  ON public.report_orders(status, created_at);

CREATE INDEX IF NOT EXISTS report_orders_report_id_idx
  ON public.report_orders(report_id)
  WHERE report_id IS NOT NULL;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS refinements jsonb;

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS savings_summary jsonb;

-- All new customer financial data is handled with the service role on the server.
-- No browser-side read/write access to the new table.
ALTER TABLE public.report_orders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.report_orders FROM anon, authenticated;
-- Existing reports remain as they were until their RLS setup is audited.
-- We do not grant new public access to the reports table.

COMMIT;

-- Post-migration checks in Supabase SQL Editor:
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_schema='public' AND table_name='reports'
-- AND column_name IN ('refinements','savings_summary');
-- SELECT status FROM public.report_orders LIMIT 1;
