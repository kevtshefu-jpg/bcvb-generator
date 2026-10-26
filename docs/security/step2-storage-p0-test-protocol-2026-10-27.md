# BCVB Storage P0 — isolated validation and rollout gates

**Status: PREPARED / UNTESTED. Production and PR merge remain NO-GO.**
Scope: PR #110, branch `security/staged-production-rls-20261014`.
Manual-only SQL under `ops/manual`; no automatic migration.

## Evidence and limitations
- Production read-only inventory: real private bucket `Bcvb-library`, 3 permissive SELECT policies for authenticated; one matches real bucket.
- 22 soft-deleted library rows; 8 objects, 1 matching `storage_path`, 7 without path match.
- `service_role` bypasses RLS. Signed URLs issued before confinement may remain valid until expiry.
- Business clone `bcvb-restore-test` lacks `storage.objects` and `storage.buckets`, so cannot validate Storage.
- Code reviewed on branch: `src/lib/downloadDocument.ts` (`file_url` bypasses signed URL); `src/features/library/services/libraryService.ts` (createSignedUrl and fetchLibraryDocuments only filters is_active); `src/features/documents/services/documentExportService.ts` (direct URL first; Markdown and PDF generated from inline content); `src/services/manualGeneratedDocuments.ts` (inserts placeholder storage_path but no upload).
- **Therefore removing Storage SELECT alone does not guarantee document confidentiality across direct URLs, inline content, privileged functions or exports.**

## Files
- `ops/manual/storage-p0-confinement-2026-10-27.sql`: gated manual candidate; transaction, inventory checks, removal and postcondition. **Do not run in production**.
- `ops/manual/storage-p0-emergency-restore-2026-10-27.sql`: emergency recovery of insecure policies, not a secure long-term state.

## Isolated test setup (required)
1. Use a disposable Supabase-compatible local environment with Storage API and `storage.objects`, not the existing clone. Pin versions; record CLI and Storage image versions. No real player data.
2. Seed synthetic private bucket `Bcvb-library`, three exact policies, role fixtures (anon, player A/B, parent, coach, admin, inactive), and synthetic objects: linked soft-deleted, unmatched, active-authorized, active-unauthorized. Keep a known-valid admin access path in the **replacement design**; confinement by itself denies all ordinary reads.
3. Snapshot `pg_policies`, `pg_class.relrowsecurity`, `storage.buckets`, grants, role membership, and file/object counts. Check policies with `cmd='ALL'` and permissive OR semantics.
4. Run confinement candidate in a **throwaway** environment; assert no SELECT policies and RLS still enabled. For rollback rehearsal use a copy with final COMMIT replaced by ROLLBACK, then compare snapshot byte-for-byte.
5. Run emergency restore only in disposable environment; verify exact 3 policies restored and record that broad access returns. Re-run confinement after restoring.

## HTTP/API test matrix
For every persona (anon, player A, player B, parent, coach, admin, inactive), test:
- list bucket prefix; download known synthetic object path; createSignedUrl for known path; redeem newly issued URL; request public URL; access via app download/export and server proxy.
- denied on linked soft-deleted and unmatched objects for all ordinary users; denied cross-player, inactive and unauthorized parent; no leakage of paths in errors or logs.
- positive control: separately designed authorized active document access must work *after replacement policy or controlled server delivery*, not necessarily after confinement.
- service-role server flows: ensure keys remain server-only, enforce explicit authorization at API layer; RLS will not protect those calls.
- existing signed URLs: test before/after confinement and after expiry. Do not assume immediate revocation.
- inline content and direct `file_url` exports: verify DB RLS and external URL authorization independently.

## Acceptance criteria
- No broad `authenticated` SELECT/ALL policies for either casing of bucket name.
- No anonymous/unauthorized downloads, listing, signing or inline exports; all synthetic denied cases pass.
- Authorized active-document path verified via replacement architecture; soft-deleted and orphaned files denied.
- No impact to other buckets; no change to objects, bucket names, document rows or content.
- Rollback rehearsed and risk acknowledged; peer review and explicit user approval before production.
- Production change window and immediate HTTP verification planned. Failure => STOP, incident response, approved recovery only.

## Open design decisions
- Decide whether Storage reads are mediated through a server authorization endpoint or narrow SQL RLS policies backed by trusted canonical membership tables. Do not invent role mappings.
- Determine whether `file_url`, inline `content`, and historical signed URLs expose soft-deleted content; investigate separately.
- Fix `bcvb-library` vs `Bcvb-library` and placeholder paths in a separately reviewed change.

## KILLCRITIC
Draft SQL syntax not executed; no Storage-capable isolated test or HTTP test has run. This is **preparation only**, not a verified security fix.
