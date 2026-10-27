# BCVB Storage P0 — reproducible isolated validation checklist

Status: **prepared, not executed**. No production connection or secrets are required.

## Prerequisites
- Disposable local Supabase stack with actual Storage service and PostgreSQL. Existing business-only clone is insufficient because `storage.objects` and `storage.buckets` are absent.
- `supabase --version`, `supabase --help`, `supabase start --help` checked locally; record pinned versions and local container image digests.
- No real BCVB user files or credentials. Never connect a local test script to the production project.

## Fixture preparation
1. Start disposable stack and assert `to_regclass('storage.objects') IS NOT NULL` and `to_regclass('storage.buckets') IS NOT NULL`.
2. Inspect baseline Storage policies first; DO NOT drop Supabase-managed policies blindly. Reproduce the three known production SELECT policies on a disposable fixture only if the environment allows an exact baseline, and document any other policies.
3. Create a synthetic private bucket named exactly `Bcvb-library`; seed a harmless `test.txt` via the Storage API (not by inserting directly into `storage.objects`).
4. Seed synthetic test accounts with no real emails. Generate short-lived tokens only in local stack. Never commit tokens.
5. Capture a before snapshot of policy names, commands, roles, qualifiers, checks, bucket flags and object counts.

## SQL inspection query (read-only)
```sql
SELECT policyname, permissive, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects'
ORDER BY policyname;
```

## Execution procedure
1. Validate `ops/manual/storage-p0-confinement-2026-10-27.sql` in an isolated database; the candidate intentionally **fails closed** if any unexpected policy exists. This failure is a **successful safety signal**, not a reason to bypass the guard.
2. If fixture exactly matches the expected inventory, run SQL with a final `ROLLBACK` instead of `COMMIT`; compare before/after snapshots. Use a copy of the SQL for rehearsal; do not alter the committed candidate.
3. On a separate disposable fixture, run candidate as written and verify policy inventory is empty, RLS enabled and objects intact.
4. Execute `ops/manual/storage-p0-emergency-restore-2026-10-27.sql` only in the disposable fixture, assert original three policies restored, then re-apply confinement to demonstrate repeatability.
5. Run HTTP tests via actual local Storage API. Database-policy checks alone do not prove that downloads or signed URLs are denied.

## Minimum HTTP matrix
| Identity | Object | List | Download | Sign new URL | Redeem pre-issued URL |
|---|---|---|---|---|---|
| Anonymous | synthetic | deny | deny | deny | record actual expiry behavior |
| Player A | own active synthetic | deny under confinement | deny | deny | record |
| Player B | Player A synthetic | deny | deny | deny | record |
| Parent | synthetic soft-deleted | deny | deny | deny | record |
| Coach | synthetic orphan | deny | deny | deny | record |
| Admin | synthetic | deny under confinement | deny | deny | record |
| Server service role | synthetic | document expected privileged behavior | document | document | document |

A later *replacement authorization* design must add a separate positive-control case for authorized active documents. Confinement itself intentionally removes ordinary read capability.

## Application-level tests
- `src/lib/downloadDocument.ts`: `file_url` bypasses Storage signing; test external URL authorization.
- `src/features/documents/services/documentExportService.ts`: direct URL and inline Markdown/PDF exports can work independently of Storage SELECT; test database read permissions and deleted-document filtering.
- `src/features/library/services/libraryService.ts`: `fetchLibraryDocuments` filters `is_active` but not `deleted_at`; test that deleted rows are inaccessible at the database layer.
- `src/services/manualGeneratedDocuments.ts`: path metadata can exist without a real object; do not treat a path as proof of upload.

## Record results
For every case record: fixture version, SQL checksum, identity type, API method, expected outcome, observed status code, policy snapshot before/after, object count before/after, pass/fail, and reviewer. Redact tokens, signed URLs and sensitive paths.

## Release gates
NO-GO if Storage fixture is absent; guard rejects inventory; any unauthorized access persists; service-role API authorization is not reviewed; recovery fails; or authorized-document delivery has no approved replacement. PR #110 must not be merged and production SQL must not run without new explicit approval.
