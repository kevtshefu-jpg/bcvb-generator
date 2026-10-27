-- BCVB P0 Storage confinement — MANUAL STAGING ONLY
-- DO NOT execute on production without explicit approval and HTTP test plan.
-- Deliberately not placed under supabase/migrations.
BEGIN;
SET LOCAL lock_timeout = '5s';
DO $bcvb_guard$
DECLARE actual text[];
BEGIN
 IF to_regclass('storage.objects') IS NULL OR to_regclass('storage.buckets') IS NULL THEN
  RAISE EXCEPTION 'Storage schema missing';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='storage' AND c.relname='objects' AND c.relrowsecurity) THEN
  RAISE EXCEPTION 'Storage objects RLS not enabled';
 END IF;
 SELECT array_agg(policyname ORDER BY policyname) INTO actual
 FROM pg_policies WHERE schemaname='storage' AND tablename='objects';
 IF actual IS DISTINCT FROM ARRAY[
  'Allow authenticated users to read files',
  'Allow authenticated users to read files fr5e4b_0',
  'Allow authenticated users to read objects'
 ]::text[] THEN
  RAISE EXCEPTION 'Policy inventory changed; stop and re-audit';
 END IF;
 IF EXISTS (
  SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
  AND (cmd <> 'SELECT' OR permissive <> 'PERMISSIVE' OR roles <> ARRAY['authenticated']::name[])
 ) THEN
  RAISE EXCEPTION 'Unexpected policy characteristics';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id='Bcvb-library' AND public IS FALSE)
    OR EXISTS (SELECT 1 FROM storage.buckets WHERE id='bcvb-library') THEN
  RAISE EXCEPTION 'Bucket inventory changed';
 END IF;
 IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects'
  AND ((policyname='Allow authenticated users to read files' AND qual IS DISTINCT FROM '(bucket_id = ''bcvb-library''::text)')
   OR (policyname='Allow authenticated users to read files fr5e4b_0' AND qual IS DISTINCT FROM '(bucket_id = ''Bcvb-library''::text)')
   OR (policyname='Allow authenticated users to read objects' AND qual IS DISTINCT FROM '(bucket_id = ''bcvb-library''::text)')
   OR with_check IS NOT NULL)) THEN
  RAISE EXCEPTION 'Policy expressions changed';
 END IF;
END $bcvb_guard$;
DROP POLICY "Allow authenticated users to read files" ON storage.objects;
DROP POLICY "Allow authenticated users to read files fr5e4b_0" ON storage.objects;
DROP POLICY "Allow authenticated users to read objects" ON storage.objects;
DO $bcvb_verify$
BEGIN
 IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects') THEN
  RAISE EXCEPTION 'Policies remain; abort';
 END IF;
END $bcvb_verify$;
-- For dry run replace COMMIT with ROLLBACK on isolated test environment.
COMMIT;
