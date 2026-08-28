-- GO-02E.8 — verrouillage serveur et confidentialité des notes attendance.

begin;

create or replace function public.guard_validated_attendance_record_writes()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_session_id uuid;
  target_status text;
begin
  -- La RPC officielle positionne ce marqueur dans sa transaction avant de
  -- promouvoir validated_by_coach. Aucun appel PostgREST ordinaire ne peut
  -- bénéficier de cette dérogation SECURITY DEFINER.
  if current_user = 'postgres'
     and current_setting('bcvb.attendance_validation_rpc', true) = 'allowed' then
    return coalesce(new, old);
  end if;

  target_session_id := case when tg_op = 'DELETE' then old.session_id else new.session_id end;

  select status
  into target_status
  from public.attendance_sessions
  where id = target_session_id
  for key share;

  if target_status is null then
    raise exception 'Séance d''appel introuvable.'
      using errcode = 'P0002';
  end if;

  if target_status <> 'draft' then
    raise exception 'La séance est validée et ne peut plus être modifiée.'
      using errcode = '42501';
  end if;

  if tg_op = 'UPDATE' and new.session_id is distinct from old.session_id then
    select status
    into target_status
    from public.attendance_sessions
    where id = old.session_id
    for key share;

    if target_status is distinct from 'draft' then
      raise exception 'La séance est validée et ne peut plus être modifiée.'
        using errcode = '42501';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

alter function public.guard_validated_attendance_record_writes()
owner to postgres;

revoke all
on function public.guard_validated_attendance_record_writes()
from public, anon, authenticated, service_role;

drop trigger if exists guard_validated_attendance_record_writes_trigger
on public.attendance_records;

create trigger guard_validated_attendance_record_writes_trigger
before insert or update or delete
on public.attendance_records
for each row
execute function public.guard_validated_attendance_record_writes();

-- Un même rôle PostgreSQL `authenticated` porte plusieurs rôles métier JWT :
-- les champs sensibles ne peuvent donc pas être accordés par GRANT conditionnel.
-- Ils sont retirés de la table et exposés par la RPC contrôlée ci-dessous.
revoke select on public.attendance_records from authenticated;

grant select (
  id,
  session_id,
  player_id,
  status,
  delay_minutes,
  source,
  parent_confirmed,
  validated_by_coach,
  created_by,
  updated_by,
  created_at,
  updated_at
) on public.attendance_records to authenticated;

create or replace function public.read_attendance_records(
  target_session_id uuid,
  target_player_id uuid default null
)
returns table (
  id uuid,
  session_id uuid,
  player_id uuid,
  status text,
  reason text,
  delay_minutes integer,
  injury_note text,
  logistic_note text,
  coach_comment text,
  source text,
  parent_confirmed boolean,
  validated_by_coach boolean,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  target_team_id uuid;
  may_read_sensitive boolean;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.'
      using errcode = '42501';
  end if;

  select s.team_id
  into target_team_id
  from public.attendance_sessions s
  where s.id = target_session_id;

  if target_team_id is null then
    raise exception 'Séance d''appel introuvable.'
      using errcode = 'P0002';
  end if;

  if not (
    public.is_current_user_club_leader()
    or public.can_access_team(target_team_id)
  ) then
    return;
  end if;

  actor_role := public.current_user_role();
  may_read_sensitive := actor_role in (
    'admin',
    'responsable_technique',
    'technical_manager',
    'coach'
  );

  return query
  select
    ar.id,
    ar.session_id,
    ar.player_id,
    ar.status,
    case when may_read_sensitive then ar.reason else null end,
    ar.delay_minutes,
    case when may_read_sensitive then ar.injury_note else null end,
    case when may_read_sensitive then ar.logistic_note else null end,
    case when may_read_sensitive then ar.coach_comment else null end,
    ar.source,
    ar.parent_confirmed,
    ar.validated_by_coach,
    ar.created_by,
    ar.updated_by,
    ar.created_at,
    ar.updated_at
  from public.attendance_records ar
  where ar.session_id = target_session_id
    and (target_player_id is null or ar.player_id = target_player_id);
end;
$$;

alter function public.read_attendance_records(uuid, uuid)
owner to postgres;

revoke all
on function public.read_attendance_records(uuid, uuid)
from public, anon;

grant execute
on function public.read_attendance_records(uuid, uuid)
to authenticated, service_role;

commit;
