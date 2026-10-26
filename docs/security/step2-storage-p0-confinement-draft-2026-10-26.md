# Storage P0 — confinement proposal (NOT FOR DEPLOYMENT)

Date: 2026-10-26. Scope: PR #110 security staging. **NO-GO production**.

## Verified production observations (read-only SQL supplied by project owner)
- One bucket observed: `Bcvb-library`, `public=false`.
- `storage.objects` has three PERMISSIVE SELECT policies for `authenticated`:
  - `Allow authenticated users to read files` — `bucket_id = 'bcvb-library'::text`
  - `Allow authenticated users to read files fr5e4b_0` — `bucket_id = 'Bcvb-library'::text`
  - `Allow authenticated users to read objects` — `bucket_id = 'bcvb-library'::text`
- 22 `public.library_documents` rows have `deleted_at IS NOT NULL`, `is_active=true`, and `bucket_name='bcvb-library'`.
- Eight actual Storage objects: one matches a document by `storage_path = objects.name`, seven do not match by that criterion.
- `anon` and `authenticated` do not bypass RLS; `service_role` does.
- Isolated `bcvb-restore-test` clone has `storage` schema but **no** `storage.objects` or `storage.buckets`. It cannot validate Storage policy behavior.

## Risk
The uppercase-bucket policy permits any `authenticated` database role to SELECT objects in the real private bucket, irrespective of document deletion or audience. This establishes an authorization defect, **not** proof of observed unauthorized downloads. The lowercase policies do not match the currently observed bucket, but would become relevant if such a bucket were created. Permissive policies combine by OR.

## Draft confinement SQL — REVIEW ONLY, DO NOT RUN IN PRODUCTION
The following SQL is an illustrative candidate, not an approved migration. It deliberately fails if policy inventory differs. Do not place in auto-applied migrations.

```sql
BEGIN;
DO $guard$
DECLARE actual text[];
BEGIN
  SELECT array_agg(policyname ORDER BY policyname)
    INTO actual
  FROM pg_policies
  WHERE schemaname = 'storage' AND tablename = 'objects'
    AND cmd = 'SELECT';
  IF actual IS DISTINCT FROM ARRAY[
    'Allow authenticated users to read files',
    'Allow authenticated users to read files fr5e4b_0',
    'Allow authenticated users to read objects'
  ]::text[] THEN
    RAISE EXCEPTION 'Storage SELECT policy inventory changed; abort';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets
    WHERE id = 'Bcvb-library' AND public IS FALSE
  ) THEN
    RAISE EXCEPTION 'Expected private bucket missing; abort';
  END IF;
END
$guard$;
DROP POLICY "Allow authenticated users to read files" ON storage.objects;
DROP POLICY "Allow authenticated users to read files fr5e4b_0" ON storage.objects;
DROP POLICY "Allow authenticated users to read objects" ON storage.objects;
-- The actual rollout requires an explicit authorization and post-change HTTP tests.
COMMIT;
```

## Recovery candidate — restores prior insecure state, emergency only
**Never run as routine deployment.** Restores broad read access and therefore restores the security defect. Use only for approved incident recovery while building a proper replacement.

```sql
BEGIN;
CREATE POLICY "Allow authenticated users to read files"
 ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
 USING (bucket_id = 'bcvb-library'::text);
CREATE POLICY "Allow authenticated users to read files fr5e4b_0"
 ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
 USING (bucket_id = 'Bcvb-library'::text);
CREATE POLICY "Allow authenticated users to read objects"
 ON storage.objects AS PERMISSIVE FOR SELECT TO authenticated
 USING (bucket_id = 'bcvb-library'::text);
COMMIT;
```

## Blocking gates before any production change
1. Inspect all code paths for `storage.from(...).download/list/createSignedUrl`, server functions, exports, and service-role use. Distinguish DB RLS from signed-URL and privileged-server behavior.
2. Preserve a read-only snapshot of full policy definitions and grants, including non-SELECT and any `ALL` policies. Confirm no other permissive SELECT or ALL policies are effective. Confirm `storage.objects` RLS enabled.
3. Reproduce production Storage schema/policies in a separate **isolated** test environment (not the validated business-table clone). Use synthetic data, and run transaction/rollback tests.
4. Test HTTP with anonymous, unauthorized player, parent, coach, authorized admin, and inactive user identities; test eight object categories (linked soft-deleted and seven unmatched), list/download, signed URL creation and redemption, server proxy and exports. Do not use production personal data in tests.
5. Confirm expected UX for legitimate users; all currently inventoried documents are soft-deleted, but absence of a path match is not proof an object is disposable.
6. Fix case-sensitive bucket naming in application in a separate reviewed change; do not mass-update historical records or delete Storage objects.
7. Obtain explicit approval for deployment window, recovery decision, and production execution. Verify effective access immediately afterward.

## Current decision
GO: prepare and review. NO-GO: production execution, merging PR #110, deleting objects, or renaming buckets.
