-- P10.2: sensitive monitoring must not inherit general roster read permissions.
-- Preserve the existing evaluation writer scope; add no new actor entitlement.
begin;

create or replace function public.can_access_player_monitoring(target_player_id uuid, target_team_id uuid)
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
 select coalesce(
   auth.uid() is not null
   and target_player_id is not null
   and target_team_id is not null
   and public.current_user_role() in ('admin', 'responsable_technique', 'coach')
   and public.can_manage_player_evaluation(target_player_id, target_team_id)
   and public.can_manage_attendance_team(target_team_id),
   false
 );
$$;
alter function public.can_access_player_monitoring(uuid,uuid) owner to postgres;
revoke all on function public.can_access_player_monitoring(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.can_access_player_monitoring(uuid,uuid) to authenticated;

alter table public.player_monitoring_entries enable row level security;
alter table public.player_monitoring_entries force row level security;
revoke all privileges on table public.player_monitoring_entries from public,anon,authenticated;

create or replace function public.read_player_monitoring(target_player_id uuid,target_team_id uuid default null)
returns table(entry_id uuid,player_id uuid,team_id uuid,season text,monitored_on date,session_rpe smallint,session_duration_minutes smallint,fatigue smallint,soreness smallint,sleep_quality smallint,pain smallint,availability text,note text,created_at timestamptz,updated_at timestamptz)
language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
 if public.can_access_player_monitoring(target_player_id,target_team_id) is not true then raise exception 'Lecture monitoring interdite.' using errcode='42501'; end if;
 return query select m.id,m.player_id,m.team_id,m.season,m.monitored_on,m.session_rpe,m.session_duration_minutes,m.fatigue,m.soreness,m.sleep_quality,m.pain,m.availability,m.note,m.created_at,m.updated_at
 from public.player_monitoring_entries m where m.player_id=target_player_id and (target_team_id is null or m.team_id=target_team_id)
 and public.can_access_player_monitoring(m.player_id,m.team_id) is true
 order by m.monitored_on desc;
end $$;
alter function public.read_player_monitoring(uuid,uuid) owner to postgres;
revoke all on function public.read_player_monitoring(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_player_monitoring(uuid,uuid) to authenticated;

create or replace function public.save_player_monitoring(target_player_id uuid,target_team_id uuid,target_season text,target_monitored_on date,target_session_rpe smallint,target_session_duration_minutes smallint,target_fatigue smallint,target_soreness smallint,target_sleep_quality smallint,target_pain smallint,target_availability text,target_note text default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare result_id uuid;
begin
 if public.can_access_player_monitoring(target_player_id,target_team_id) is not true then raise exception 'Modification monitoring interdite.' using errcode='42501'; end if;
 if coalesce(trim(target_season),'')='' or target_monitored_on is null or target_availability not in ('normal','adaptee','arret') then raise exception 'Monitoring incomplet.' using errcode='22023'; end if;
 insert into public.player_monitoring_entries(player_id,team_id,season,monitored_on,session_rpe,session_duration_minutes,fatigue,soreness,sleep_quality,pain,availability,note,created_by,updated_by)
 values(target_player_id,target_team_id,trim(target_season),target_monitored_on,target_session_rpe,target_session_duration_minutes,target_fatigue,target_soreness,target_sleep_quality,target_pain,target_availability,nullif(trim(target_note),''),auth.uid(),auth.uid())
 on conflict(player_id,team_id,season,monitored_on) do update set session_rpe=excluded.session_rpe,session_duration_minutes=excluded.session_duration_minutes,fatigue=excluded.fatigue,soreness=excluded.soreness,sleep_quality=excluded.sleep_quality,pain=excluded.pain,availability=excluded.availability,note=excluded.note,updated_by=auth.uid(),updated_at=now()
 returning id into result_id; return result_id;
end $$;
alter function public.save_player_monitoring(uuid,uuid,text,date,smallint,smallint,smallint,smallint,smallint,smallint,text,text) owner to postgres;
revoke all on function public.save_player_monitoring(uuid,uuid,text,date,smallint,smallint,smallint,smallint,smallint,smallint,text,text) from public,anon,authenticated,service_role;
grant execute on function public.save_player_monitoring(uuid,uuid,text,date,smallint,smallint,smallint,smallint,smallint,smallint,text,text) to authenticated;

commit;