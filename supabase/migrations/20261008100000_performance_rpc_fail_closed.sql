-- P10.4: fail-closed guards; no new actor rights or business policy.
begin;
create or replace function public.can_read_player_performance_scope(target_player_id uuid,target_team_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
 select coalesce(
   auth.uid() is not null and target_player_id is not null and target_team_id is not null
   and public.current_user_role() in ('admin','responsable_technique','coach','team_staff','parent_referent')
   and (
     public.is_current_user_admin()
     or (
       public.can_access_current_player(target_player_id)
       and public.can_access_team(target_team_id)
       and exists (
         select 1 from public.team_memberships tm
         where tm.player_id=target_player_id and tm.team_id=target_team_id and tm.status='active'
       )
     )
   ),false);
$$;
alter function public.can_read_player_performance_scope(uuid,uuid) owner to postgres;
revoke all on function public.can_read_player_performance_scope(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.can_read_player_performance_scope(uuid,uuid) to authenticated;
create or replace function public.read_player_performance_tests(target_player_id uuid, target_team_id uuid default null)
returns table (
  result_id uuid, player_id uuid, team_id uuid, season text, test_code text, test_name text,
  measured_at date, value numeric, unit text, protocol_version text, context_note text,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path=public,pg_temp
as $$
begin
  if public.can_read_player_performance_scope(target_player_id,target_team_id) is not true then
    raise exception 'Lecture des tests interdite.' using errcode='42501';
  end if;
  return query
    select r.id,r.player_id,r.team_id,r.season,r.test_code,r.test_name,r.measured_at,r.value,r.unit,
           r.protocol_version,r.context_note,r.created_at,r.updated_at
    from public.performance_test_results r
    where r.player_id=target_player_id
      and (target_team_id is null or r.team_id=target_team_id)
      and (public.is_current_user_admin() or public.current_user_role()='responsable_technique' or public.can_access_team(r.team_id))
    order by r.measured_at desc,r.test_code;
end $$;

alter function public.read_player_performance_tests(uuid,uuid) owner to postgres;
revoke all on function public.read_player_performance_tests(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_player_performance_tests(uuid,uuid) to authenticated;

create or replace function public.save_player_performance_test(
  target_player_id uuid,target_team_id uuid,target_season text,target_test_code text,target_test_name text,
  target_measured_at date,target_value numeric,target_unit text,target_protocol_version text,target_context_note text default null
) returns uuid
language plpgsql security definer set search_path=public,pg_temp
as $$
declare result_id uuid;
begin
  if public.can_manage_player_evaluation(target_player_id,target_team_id) is not true then
    raise exception 'Modification des tests interdite.' using errcode='42501';
  end if;
  if coalesce(trim(target_season),'')='' or coalesce(trim(target_test_code),'')='' or coalesce(trim(target_test_name),'')=''
     or coalesce(trim(target_unit),'')='' or coalesce(trim(target_protocol_version),'')='' or target_measured_at is null then
    raise exception 'Test incomplet.' using errcode='22023';
  end if;
  insert into public.performance_test_results(player_id,team_id,season,test_code,test_name,measured_at,value,unit,protocol_version,context_note,created_by,updated_by)
  values(target_player_id,target_team_id,trim(target_season),upper(trim(target_test_code)),trim(target_test_name),target_measured_at,target_value,trim(target_unit),trim(target_protocol_version),nullif(trim(target_context_note),''),auth.uid(),auth.uid())
  on conflict(player_id,team_id,season,test_code,measured_at,protocol_version) do update set
    test_name=excluded.test_name,value=excluded.value,unit=excluded.unit,context_note=excluded.context_note,updated_by=auth.uid(),updated_at=now()
  returning id into result_id;
  return result_id;
end $$;

alter function public.save_player_performance_test(uuid,uuid,text,text,text,date,numeric,text,text,text) owner to postgres;
revoke all on function public.save_player_performance_test(uuid,uuid,text,text,text,date,numeric,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.save_player_performance_test(uuid,uuid,text,text,text,date,numeric,text,text,text) to authenticated;

create or replace function public.read_player_programs(target_player_id uuid,target_team_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if public.can_read_player_performance_scope(target_player_id,target_team_id) is not true then raise exception 'Lecture programme interdite.' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'player_id',p.player_id,'team_id',p.team_id,'season',p.season,'title',p.title,'start_date',p.start_date,'end_date',p.end_date,'level',p.level,'status',p.status,'safety_state',p.safety_state,'weeks',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'week_number',w.week_number,'phase',w.phase,'starts_on',w.starts_on,'ends_on',w.ends_on,'sessions',coalesce((select jsonb_agg(jsonb_build_object('id',ps.id,'session_id',ps.session_id,'order_index',ps.order_index,'planned_on',ps.planned_on) order by ps.order_index) from public.player_program_sessions ps where ps.program_week_id=w.id),'[]'::jsonb)) order by w.week_number) from public.player_program_weeks w where w.program_id=p.id),'[]'::jsonb)) order by p.start_date desc) from public.player_programs p where p.player_id=target_player_id and p.team_id=target_team_id),'[]'::jsonb);
end $$;
alter function public.read_player_programs(uuid,uuid) owner to postgres;
revoke all on function public.read_player_programs(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_player_programs(uuid,uuid) to authenticated;


commit;
