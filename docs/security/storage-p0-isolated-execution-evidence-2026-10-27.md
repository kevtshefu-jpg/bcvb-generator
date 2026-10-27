# BCVB — Storage P0 isolated validation evidence (2026-10-27)

## Scope
Disposable Supabase project `ahqrrqgebtfzssmeizfu` (`BCVB-Storage-P0-Test`, eu-west-1).
Production project `leziahqmqyuewpzjmzxf` was not modified. PR #110 was not merged.

## Executed and observed
1. The isolated project's `storage.objects` and `storage.buckets` tables exist.
2. Recreated three exact broad SELECT policies for `authenticated`, including the matching `Bcvb-library` policy.
3. Ran `ops/manual/storage-p0-confinement-2026-10-27.sql` successfully; subsequent inventory: zero policies.
4. Ran `ops/manual/storage-p0-emergency-restore-2026-10-27.sql` successfully; subsequent inventory: three policies, all SELECT/PERMISSIVE/authenticated.
5. Reapplied the confinement SQL successfully; current inventory: zero policies.
6. Executed `BEGIN; SET LOCAL ROLE anon; EXPLAIN (VERBOSE, COSTS OFF) SELECT id FROM storage.objects WHERE bucket_id='Bcvb-library'; ROLLBACK;`: plan returned `Result / One-Time Filter: false`.
7. Executed the same statement with `SET LOCAL ROLE authenticated`: plan returned `Result / One-Time Filter: false`.
8. Final SQL inventory: `policies=0`, `objects=0`, `public_bucket=false`.

## What these results do NOT prove
- No real object was uploaded. Object retention after confinement has not been tested.
- No HTTP requests against Storage API were executed. There are no observed HTTP status codes.
- No test Auth accounts or JWTs were provisioned. The SQL role simulation is not an end-to-end user session.
- Signed URL issuance, pre-issued signed URL behavior, expiry and revocation were not tested.
- Emergency restore recreates the original overly broad policies and is only a break-glass procedure.
- The exact-inventory SQL guard will refuse execution if other Storage policies exist; this is fail-closed behavior, not proof that the production inventory matches.

## Prepared but unexecuted
- `tests/security/storage_p0_http_probe.py` (read-only; test project hostname enforced).
- `.github/workflows/storage-p0-isolated-http.yml` (manual dispatch; requires repository secrets and a real object).

## Decision
PostgreSQL policy confinement and recovery: **PASS in isolated environment**.
End-to-end Storage API authorization and signed URLs: **NOT TESTED**.
Overall release: **NO-GO**. Do not merge PR #110 or apply production SQL without completing HTTP test matrix and explicit production approval.
