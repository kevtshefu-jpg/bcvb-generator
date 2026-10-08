-- P10.5: factual dashboard aggregates, with the existing scoped read permission.
begin;
create or replace function public.read_player_performance_test_summary(target_player_id uuid, target_team_id uuid)
returns table(test_count bigint, last_measured_at date)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
 if public.can_read_player_performance_scope(target_player_id, target_team_id) is not true then
  raise exception 'Lecture tests interdite.' using errcode = '42501';
 end if;
 return query select count(*), max(t.measured_at) from public.performance_test_results t
 where t.player_id = target_player_id and t.team_id = target_team_id;
end;
$$;
create or replace function public.read_player_program_summary(target_player_id uuid, target_team_id uuid)
returns table(program_count bigint, active_program_count bigint)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
 if public.can_read_player_performance_scope(target_player_id, target_team_id) is not true then
  raise exception 'Lecture programmes interdite.' using errcode = '42501';
 end if;
 return query select count(*), count(*) filter (where p.status = 'active') from public.player_programs p
 where p.player_id = target_player_id and p.team_id = target_team_id;
end;
$$;
alter function public.read_player_performance_test_summary(uuid,uuid) owner to postgres;
alter function public.read_player_program_summary(uuid,uuid) owner to postgres;
revoke all on function public.read_player_performance_test_summary(uuid,uuid) from public, anon, authenticated, service_role;
revoke all on function public.read_player_program_summary(uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_player_performance_test_summary(uuid,uuid) to authenticated;
grant execute on function public.read_player_program_summary(uuid,uuid) to authenticated;
commit;
