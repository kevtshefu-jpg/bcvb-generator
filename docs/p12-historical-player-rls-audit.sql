-- P12.2: catalog-only audit of historical player scope before October migrations.
-- No player rows, notes, pain, fatigue, sleep data or identities are selected.
-- Run with a sufficiently privileged audit identity in the intended environment.
select c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced,
       has_table_privilege('anon',c.oid,'SELECT') as anon_select_granted,
       has_table_privilege('authenticated',c.oid,'SELECT') as authenticated_select_granted,
       has_table_privilege('anon',c.oid,'INSERT') as anon_insert_granted,
       has_table_privilege('anon',c.oid,'UPDATE') as anon_update_granted,
       has_table_privilege('anon',c.oid,'DELETE') as anon_delete_granted
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind in ('r','p')
  and c.relname in ('players','teams','team_memberships','player_passports',
                    'player_evaluations','player_objectives','player_monitoring_entries',
                    'player_performance_test_results','player_programs')
order by c.relname;

-- SQL grants alone do not imply that a row can be read: effective access
-- also depends on RLS policy role, command, USING and referenced functions.
select tablename,policyname,roles::text as applicable_roles,cmd,permissive,
       qual as using_expression,with_check as check_expression
from pg_policies
where schemaname='public'
  and tablename in ('players','teams','team_memberships','player_passports')
order by tablename,policyname;

-- Deployment gate: classify effective anonymous and role-specific reads
-- using authorized test identities, not live athletes. Investigate broad
-- can_access_team / club-leader scope before enabling new sensitive RPCs.
-- These metadata queries do not prove or disprove cross-team exposure.
