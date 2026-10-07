-- P3 — least-privilege RPCs for performance test results.
begin;

create or replace function public.read_player_performance_tests(target_player_id uuid, target_team_id uuid default null)
returns table (
  result_id uuid, player_id uuid, team_id uuid, season text, test_code text, test_name text,
  measured_at date, value numeric, unit text, protocol_version text, context_note text,
  created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path=public,pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  if target_player_id is null then raise exception 'Joueur requis.' using errcode='22023'; end if;
  if not public.is_current_user_admin() and public.current_user_role()<>'responsable_technique'
     and not public.can_access_current_player(target_player_id) then
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
  if not public.can_manage_player_evaluation(target_player_id,target_team_id) then
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

commit;