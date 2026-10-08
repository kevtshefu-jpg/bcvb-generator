-- P12: read-only migration preflight for the production Supabase project.
-- Catalog metadata only. NEVER reads players or monitoring observations.
-- This script does not apply migrations or validate legal / consent policies.
-- The expected versions are the 16 Oct 7-8 files listed on main at audit time.
with expected(version, migration_file) as (
  values
  ('20261007003000','player_progression_profile'),
  ('20261007015500','player_evaluations'),
  ('20261007020500','player_objectives'),
  ('20261007022000','progression_summary'),
  ('20261007104000','performance_test_results'),
  ('20261007104100','performance_test_rpcs'),
  ('20261007175500','player_monitoring'),
  ('20261007210500','player_programs'),
  ('20261008090000','monitoring_access_scope'),
  ('20261008093000','monitoring_dashboard_summary'),
  ('20261008100000','performance_rpc_fail_closed'),
  ('20261008103000','performance_dashboard_summaries'),
  ('20261008110000','evaluation_objective_read_scope'),
  ('20261008120000','internal_player_book'),
  ('20261008130000','internal_book_objectives'),
  ('20261008140000','internal_book_evaluation_register')
)
select e.version, e.migration_file,
       case when m.version is null then 'MISSING' else 'RECORDED' end as registry_state
from expected e
left join supabase_migrations.schema_migrations m on m.version=e.version
order by e.version;

-- Prerequisites for the first migration in the missing series.
-- Presence is necessary, NOT proof that the schema is compatible.
select obj, to_regclass(obj) is not null as present
from (values
 ('public.players'),('public.teams'),('public.team_memberships'),
 ('public.player_passports')
) required(obj)
order by obj;

select signature, to_regprocedure(signature) is not null as present
from (values
 ('public.can_access_current_player(uuid)'),
 ('public.can_access_team(uuid)'),
 ('public.current_user_role()'),
 ('public.is_current_user_admin()'),
 ('public.can_manage_attendance_team(uuid)')
) required(signature)
order by signature;

-- A required gate before deployment:
-- * All preexisting migrations must match the repository history;
-- * Compare schemas, signatures, table privileges and RLS on the target;
-- * Inspect the DROP FUNCTION in 20261007022000 before application;
-- * Take and verify an approved backup/recovery path;
-- * Test the exact ordered set on an isolated copy with no real-player output;
-- * Agree a maintenance window and post-deployment authenticated role tests;
-- * Apply each version exactly once using the project's migration workflow.
-- Never mark migrations as applied without actually executing and verifying them.
