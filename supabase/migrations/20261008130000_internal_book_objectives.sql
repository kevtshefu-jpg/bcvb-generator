-- P11.2: canonical pedagogical objectives for the internal book only.
begin;
create or replace function public.read_player_staff_book(target_player_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
declare p record;
begin
 if target_player_id is null or coalesce(public.current_user_role() in ('admin','responsable_technique','coach','team_staff'),false) is not true then
  raise exception 'Player Book interne interdit.' using errcode='42501';
 end if;
 select * into p from public.read_player_progression_profile(target_player_id);
 if p.player_id is null or public.can_read_player_performance_scope(p.player_id,p.team_id) is not true then
  raise exception 'Player Book interne interdit.' using errcode='42501';
 end if;
 return jsonb_build_object(
  'player',jsonb_build_object('id',p.player_id,'teamId',p.team_id,'firstName',p.first_name,'lastName',p.last_name,'teamName',p.team_name,'season',p.season),
  'evaluationCount',p.evaluation_count,'activeObjectiveCount',p.active_objective_count,'generatedAt',statement_timestamp(),
  'monitoring','[]'::jsonb,
  'objectives',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'playerId',o.player_id,'teamId',o.team_id,'season',o.season,'title',o.title,'domain',o.domain,'targetDescription',o.target_description,'observableCriterion',o.observable_criterion,'quantifiableCriterion',o.quantifiable_criterion,'deadline',o.deadline,'status',o.status) order by o.updated_at desc,o.id) from public.player_objectives o where o.player_id=p.player_id and o.team_id=p.team_id and o.season=p.season),'[]'::jsonb),
  'tests',coalesce((select jsonb_agg(jsonb_build_object('playerId',r.player_id,'teamId',r.team_id,'season',r.season,'testName',r.test_name,'value',r.value,'unit',r.unit,'measuredAt',r.measured_at,'protocolVersion',r.protocol_version) order by r.measured_at desc,r.test_code) from public.performance_test_results r where r.player_id=p.player_id and r.team_id=p.team_id and r.season=p.season),'[]'::jsonb),
  'programs',coalesce((select jsonb_agg(jsonb_build_object('playerId',r.player_id,'teamId',r.team_id,'season',r.season,'title',r.title,'startDate',r.start_date,'endDate',r.end_date,'level',r.level,'status',r.status) order by r.start_date desc,r.id) from public.player_programs r where r.player_id=p.player_id and r.team_id=p.team_id and r.season=p.season),'[]'::jsonb)
 );
end $$;
alter function public.read_player_staff_book(uuid) owner to postgres;
revoke all on function public.read_player_staff_book(uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_player_staff_book(uuid) to authenticated;
commit;
