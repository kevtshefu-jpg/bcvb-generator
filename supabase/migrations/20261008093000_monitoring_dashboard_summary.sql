-- P10.3: dashboard receives only factual count/date, never monitoring observations.
begin;
create or replace function public.read_player_monitoring_summary(target_player_id uuid, target_team_id uuid)
returns table(entry_count bigint, last_monitored_on date)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
 if public.can_access_player_monitoring(target_player_id, target_team_id) is not true then
   raise exception 'Lecture monitoring interdite.' using errcode = '42501';
 end if;
 return query select count(*), max(m.monitored_on)
 from public.player_monitoring_entries m
 where m.player_id = target_player_id and m.team_id = target_team_id;
end;
$$;
alter function public.read_player_monitoring_summary(uuid,uuid) owner to postgres;
revoke all on function public.read_player_monitoring_summary(uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_player_monitoring_summary(uuid,uuid) to authenticated;
commit;
