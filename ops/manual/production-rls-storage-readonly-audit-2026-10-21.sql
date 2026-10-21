-- BCVB — Production RLS / Storage read-only evidence snapshot
-- MANUAL AUDIT ONLY. Safe to run on production using a read-only DB role.
-- Outputs only aggregate counts and booleans. No names, object paths,
-- user IDs, JWTs, document titles, or personal data.
-- No DDL, DML, transaction control, or session changes.
--
-- Run only if authorized to inspect security metadata.
-- This script is NOT a remediation, backup, or migration.

-- 1. Table-level RLS and effective API-role privileges.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  (select count(*) from pg_policies p
   where p.schemaname = 'public' and p.tablename = c.relname)::integer as policies,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_can_select,
  has_table_privilege('authenticated', c.oid, 'TRUNCATE') as authenticated_can_truncate,
  has_table_privilege('authenticated', c.oid, 'TRIGGER') as authenticated_can_trigger,
  has_table_privilege('authenticated', c.oid, 'REFERENCES') as authenticated_can_reference
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and c.relname in (
    'library_documents',
    'player_content_unlocks',
    'player_fundamental_progress'
  )
order by c.relname;

-- 2. Document lifecycle inconsistencies (aggregate only).
select
  count(*)::integer as documents_total,
  count(*) filter (where is_active is true)::integer as documents_active,
  count(*) filter (where deleted_at is not null)::integer as documents_soft_deleted,
  count(*) filter (where is_active is true and deleted_at is not null)::integer
    as documents_active_and_soft_deleted,
  count(*) filter (
    where status = 'published' and deleted_at is not null
  )::integer as published_but_soft_deleted
from public.library_documents;

-- 3. Bucket case mismatch, ownership, and document linkage (aggregate only).
-- The comparison ignores bucket case ONLY for counting discrepancies.
-- This does NOT authorize normalizing paths or changing any bucket.
select
  (select count(*) from storage.buckets b
   where lower(b.id) = 'bcvb-library')::integer as matching_buckets,
  (select count(*) from storage.buckets b
   where b.id = 'Bcvb-library' and b.public is false)::integer as private_exact_bucket,
  (select count(*) from storage.objects o
   where lower(o.bucket_id) = 'bcvb-library')::integer as storage_objects,
  (select count(*) from storage.objects o
   where lower(o.bucket_id) = 'bcvb-library'
     and o.owner_id is null and o.owner is null)::integer as objects_without_owner,
  (select count(*) from storage.objects o
   where lower(o.bucket_id) = 'bcvb-library'
     and exists (
       select 1 from public.library_documents d
       where lower(d.bucket_name) = lower(o.bucket_id)
         and d.storage_path = o.name
     ))::integer as objects_with_document_row,
  (select count(*) from storage.objects o
   where lower(o.bucket_id) = 'bcvb-library'
     and exists (
       select 1 from public.library_documents d
       where lower(d.bucket_name) = lower(o.bucket_id)
         and d.storage_path = o.name
         and d.deleted_at is null
     ))::integer as objects_with_non_deleted_document,
  (select count(*) from public.library_documents d
   where d.bucket_name = 'bcvb-library')::integer as documents_using_lowercase_bucket;

-- 4. Count broad Storage SELECT policies without disclosing object metadata.
-- A policy with only a bucket_id condition may grant broad read access
-- to every authenticated user, independent of library_documents RLS.
select
  count(*) filter (where cmd = 'SELECT')::integer as storage_select_policies,
  count(*) filter (
    where cmd = 'SELECT'
      and 'authenticated' = any(roles)
      and qual = '(bucket_id = ''Bcvb-library''::text)'
  )::integer as authenticated_bucket_only_select_policies
from pg_policies
where schemaname = 'storage' and tablename = 'objects';
