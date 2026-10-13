-- P12.42: read-only preproduction preflight. NEVER apply as a migration.
-- Run only against the verified preproduction project; returns metadata, no player data.
with migration_state as (
  select count(*)::integer as installed,
         max(version)::text as latest,
         count(*) filter (where version in ('20261013161800', '20261013175500'))::integer as duration_migrations
  from supabase_migrations.schema_migrations
),
rpc_state as (
  select p.proname,
         pg_get_function_identity_arguments(p.oid) as arguments,
         p.prosecdef as security_definer,
         pg_get_functiondef(p.oid) like '%Durée de séance incohérente%' as has_duration_gate,
         pg_get_functiondef(p.oid) ilike '%for update%' as has_row_lock,
         has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_can_execute,
         has_function_privilege('anon', p.oid, 'EXECUTE') as anon_can_execute,
         coalesce((select bool_or(grantee = 0) from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) where privilege_type = 'EXECUTE'), false) as public_can_execute
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('submit_session_for_review', 'publish_session')
)
select 'migration_state'::text as section,
       jsonb_build_object('installed', installed, 'latest', latest,
         'duration_migrations', duration_migrations) as details
from migration_state
union all
select 'rpc_state',
       jsonb_build_object('function', proname, 'arguments', arguments,
         'security_definer', security_definer, 'has_duration_gate', has_duration_gate,
         'has_row_lock', has_row_lock, 'authenticated_can_execute', authenticated_can_execute,
         'anon_can_execute', anon_can_execute, 'public_can_execute')
from rpc_state
order by section, details->>'function';
