-- EMERGENCY RECOVERY ONLY: RESTORES INSECURE BROAD READ POLICIES.
-- Never run automatically. Requires explicit incident commander approval.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $guard$
BEGIN
 IF to_regclass('storage.objects') IS NULL THEN RAISE EXCEPTION 'Storage table missing'; END IF;
 IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
  AND policyname IN ('Allow authenticated users to read files','Allow authenticated users to read files fr5e4b_0','Allow authenticated users to read objects'))
 THEN RAISE EXCEPTION 'One or more original policies already exist; abort'; END IF;
END $guard$;
CREATE POLICY "Allow authenticated users to read files" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (bucket_id = 'bcvb-library'::text);
CREATE POLICY "Allow authenticated users to read files fr5e4b_0" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (bucket_id = 'Bcvb-library'::text);
CREATE POLICY "Allow authenticated users to read objects" ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated USING (bucket_id = 'bcvb-library'::text);
COMMIT;
