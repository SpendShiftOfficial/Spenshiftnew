-- Test-only schema, synthetic rows without names, IDs, answers or report links.
DO $$ BEGIN
 IF current_database()<>'analytics_v2_test' OR to_regclass('public.report_orders') IS NOT NULL OR to_regclass('public.reports') IS NOT NULL THEN RAISE EXCEPTION 'disposable DB required'; END IF;
END $$;
CREATE SCHEMA fixture_operations;
CREATE TABLE fixture_operations.orders(paid_at timestamptz NOT NULL, status text NOT NULL, details_completed boolean NOT NULL, ready_at timestamptz, report_sent_at timestamptz);
CREATE TABLE fixture_operations.payments(metric_date date PRIMARY KEY,paid_orders bigint NOT NULL,gross_cents bigint NOT NULL,refund_cents bigint NOT NULL,payment_failures bigint NOT NULL);
CREATE TABLE fixture_operations.external(metric_date date PRIMARY KEY,meta_spend_cents bigint NOT NULL,meta_lpv bigint NOT NULL,meta_outbound_clicks bigint NOT NULL,ga4_sessions bigint NOT NULL,legacy_audit_starts bigint NOT NULL);
INSERT INTO fixture_operations.orders VALUES
 (now()-interval '2 hours','ready',true,now()-interval '1 hour',now()-interval '30 minutes'),
 (now()-interval '2 hours','ready',true,now()-interval '1 hour',NULL),
 (now()-interval '1 hour','awaiting_details',false,NULL,NULL),
 (now()-interval '1 hour','failed',true,NULL,NULL);
INSERT INTO fixture_operations.payments VALUES ((now() AT TIME ZONE 'Australia/Sydney')::date,4,12600,2900,2);
INSERT INTO fixture_operations.external VALUES ((now() AT TIME ZONE 'Australia/Sydney')::date,800,18,21,2,1);
REVOKE ALL ON SCHEMA fixture_operations FROM PUBLIC,anon,authenticated;
REVOKE ALL ON ALL TABLES IN SCHEMA fixture_operations FROM PUBLIC,anon,authenticated;
GRANT USAGE ON SCHEMA fixture_operations TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA fixture_operations TO service_role;
