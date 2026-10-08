-- Read-only deployment verification. Run in the target Supabase SQL editor.
-- Returns catalog/migration metadata only; never reads player observations.
select version
from supabase_migrations.schema_migrations
where version in ('20261008090000', '20261008093000')
order by version;

select
  signature,
  p.oid is not null as installed,
  p.prosecdef as security_definer,
  p.proowner = (select oid from pg_roles where rolname = 'postgres') as postgres_owner,
  p.proconfig @> array['search_path=public, pg_temp'] as fixed_search_path,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
  has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
  exists (
    select 1 from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
    where a.grantee = 0 and a.privilege_type = 'EXECUTE'
  ) as public_execute,
  pg_get_function_result(p.oid) as result_contract
from (values
  ('public.can_access_player_monitoring(uuid,uuid)'),
  ('public.read_player_monitoring(uuid,uuid)'),
  ('public.read_player_monitoring_summary(uuid,uuid)'),
  ('public.save_player_monitoring(uuid,uuid,text,date,smallint,smallint,smallint,smallint,smallint,smallint,text,text)')
) signatures(signature)
left join pg_proc p on p.oid = to_regprocedure(signature);

select
  relrowsecurity as rls_enabled,
  relforcerowsecurity as rls_forced,
  has_table_privilege('authenticated', oid, 'SELECT,INSERT,UPDATE,DELETE') as authenticated_raw_access,
  has_table_privilege('anon', oid, 'SELECT,INSERT,UPDATE,DELETE') as anon_raw_access
from pg_class
where oid = to_regclass('public.player_monitoring_entries');

-- Expected: both migration versions; installed/definer/owner/search_path true;
-- authenticated execute true; anon/service_role/public execute false;
-- summary result only entry_count bigint and last_monitored_on date;
-- RLS true/true and raw access false/false.
-- This catalog check alone does not validate deployed application behavior or
-- consent/retention policy. Use authorized test accounts for connected journeys.
