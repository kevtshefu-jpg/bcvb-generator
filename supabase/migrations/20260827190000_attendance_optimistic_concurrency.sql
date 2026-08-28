-- GO-02E.10 — concurrence optimiste et création de séance idempotente.

begin;

alter table public.attendance_records
add column if not exists version bigint not null default 1
check (version > 0);

grant select (version) on public.attendance_records to authenticated;

create or replace function public.read_attendance_record_versions(target_session_id uuid)
returns table (id uuid, player_id uuid, version bigint)
language plpgsql security definer stable
set search_path = public, pg_temp
as $$
declare target_team_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;
  select team_id into target_team_id from public.attendance_sessions where attendance_sessions.id = target_session_id;
  if target_team_id is null then
    raise exception 'Séance d''appel introuvable.' using errcode = 'P0002';
  end if;
  if not (public.is_current_user_club_leader() or public.can_access_team(target_team_id)) then return; end if;
  return query select ar.id, ar.player_id, ar.version from public.attendance_records ar where ar.session_id = target_session_id;
end;
$$;

alter function public.read_attendance_record_versions(uuid) owner to postgres;
revoke all on function public.read_attendance_record_versions(uuid) from public, anon;
grant execute on function public.read_attendance_record_versions(uuid) to authenticated, service_role;

create or replace function public.read_attendance_records_versioned(
  target_session_id uuid,
  target_player_id uuid default null
)
returns table (
  id uuid, session_id uuid, player_id uuid, status text, reason text,
  delay_minutes integer, injury_note text, logistic_note text, coach_comment text,
  source text, parent_confirmed boolean, validated_by_coach boolean,
  created_by uuid, updated_by uuid, created_at timestamptz, updated_at timestamptz,
  version bigint
)
language plpgsql security definer stable
set search_path = public, pg_temp
as $$
declare actor_role text; target_team_id uuid; may_read_sensitive boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  select s.team_id into target_team_id from public.attendance_sessions s where s.id = target_session_id;
  if target_team_id is null then raise exception 'Séance d''appel introuvable.' using errcode = 'P0002'; end if;
  if not (public.is_current_user_club_leader() or public.can_access_team(target_team_id)) then return; end if;
  actor_role := public.current_user_role();
  may_read_sensitive := actor_role in ('admin','responsable_technique','technical_manager','coach');
  return query select ar.id, ar.session_id, ar.player_id, ar.status,
    case when may_read_sensitive then ar.reason else null end, ar.delay_minutes,
    case when may_read_sensitive then ar.injury_note else null end,
    case when may_read_sensitive then ar.logistic_note else null end,
    case when may_read_sensitive then ar.coach_comment else null end,
    ar.source, ar.parent_confirmed, ar.validated_by_coach, ar.created_by,
    ar.updated_by, ar.created_at, ar.updated_at, ar.version
  from public.attendance_records ar
  where ar.session_id = target_session_id
    and (target_player_id is null or ar.player_id = target_player_id);
end;
$$;

alter function public.read_attendance_records_versioned(uuid, uuid) owner to postgres;
revoke all on function public.read_attendance_records_versioned(uuid, uuid) from public, anon;
grant execute on function public.read_attendance_records_versioned(uuid, uuid) to authenticated, service_role;

create or replace function public.save_attendance_record(
  record_payload jsonb,
  expected_version bigint default null
)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  target_id uuid := nullif(record_payload->>'id', '')::uuid;
  target_session_id uuid := (record_payload->>'session_id')::uuid;
  target_player_id uuid := (record_payload->>'player_id')::uuid;
  target_team_id uuid;
  saved public.attendance_records;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  actor_role := public.current_user_role();

  select team_id into target_team_id
  from public.attendance_sessions
  where id = target_session_id and status = 'draft'
  for update;

  if target_team_id is null then
    raise exception 'La séance est validée et ne peut plus être modifiée.' using errcode = '42501';
  end if;
  if not (
    actor_role in ('admin', 'responsable_technique', 'technical_manager')
    or (actor_role = 'coach' and public.can_access_team(target_team_id))
  ) then raise exception 'Modification des présences interdite.' using errcode = '42501'; end if;

  if target_id is null then
    if expected_version is not null then
      raise exception 'Version inattendue pour un nouveau relevé.' using errcode = '22023';
    end if;
    begin
      insert into public.attendance_records (
        session_id, player_id, status, reason, delay_minutes, injury_note,
        logistic_note, coach_comment, source, validated_by_coach,
        created_by, updated_by, version
      ) values (
        target_session_id, target_player_id, record_payload->>'status',
        nullif(record_payload->>'reason', ''), nullif(record_payload->>'delay_minutes', '')::integer,
        nullif(record_payload->>'injury_note', ''), nullif(record_payload->>'logistic_note', ''),
        nullif(record_payload->>'coach_comment', ''), coalesce(nullif(record_payload->>'source', ''), 'coach'),
        false, auth.uid(), auth.uid(), 1
      ) returning * into saved;
    exception when unique_violation then
      raise exception 'Ce relevé a été créé depuis votre dernier chargement.' using errcode = 'PT409';
    end;
  else
    if expected_version is null then
      raise exception 'Version attendue manquante.' using errcode = '22023';
    end if;
    update public.attendance_records set
      status = record_payload->>'status', reason = nullif(record_payload->>'reason', ''),
      delay_minutes = nullif(record_payload->>'delay_minutes', '')::integer,
      injury_note = nullif(record_payload->>'injury_note', ''),
      logistic_note = nullif(record_payload->>'logistic_note', ''),
      coach_comment = nullif(record_payload->>'coach_comment', ''),
      source = coalesce(nullif(record_payload->>'source', ''), source),
      validated_by_coach = false, updated_by = auth.uid(), version = version + 1
    where id = target_id and session_id = target_session_id and player_id = target_player_id
      and version = expected_version
    returning * into saved;
    if saved.id is null then
      raise exception 'Cet appel a été modifié depuis votre dernier chargement.' using errcode = 'PT409';
    end if;
  end if;
  return jsonb_build_object('ok', true, 'id', saved.id, 'version', saved.version, 'updated_at', saved.updated_at);
end;
$$;

alter function public.save_attendance_record(jsonb, bigint) owner to postgres;
revoke all on function public.save_attendance_record(jsonb, bigint) from public, anon;
grant execute on function public.save_attendance_record(jsonb, bigint) to authenticated, service_role;

create or replace function public.create_attendance_session_idempotent(session_payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare actor_role text; target_team_id uuid := (session_payload->>'team_id')::uuid; saved public.attendance_sessions;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  actor_role := public.current_user_role();
  if not (actor_role in ('admin','responsable_technique','technical_manager') or (actor_role='coach' and public.can_access_team(target_team_id))) then
    raise exception 'Création de séance interdite.' using errcode = '42501';
  end if;
  begin
    insert into public.attendance_sessions(team_id, training_slot_id, session_date, title, session_type, start_time, end_time, location_name, created_by)
    values (target_team_id, nullif(session_payload->>'training_slot_id','')::uuid, (session_payload->>'session_date')::date,
      coalesce(nullif(trim(session_payload->>'title'),''),'Appel séance'), session_payload->>'session_type',
      nullif(session_payload->>'start_time','')::time, nullif(session_payload->>'end_time','')::time,
      nullif(trim(session_payload->>'location_name'),''), auth.uid()) returning * into saved;
  exception when unique_violation then
    select * into saved from public.attendance_sessions
    where team_id=target_team_id and session_date=(session_payload->>'session_date')::date
      and coalesce(start_time,'00:00'::time)=coalesce(nullif(session_payload->>'start_time','')::time,'00:00'::time)
      and session_type=session_payload->>'session_type' and status <> 'cancelled';
  end;
  return jsonb_build_object('ok',true,'id',saved.id,'created',saved.created_by=auth.uid() and saved.created_at=saved.updated_at);
end;
$$;

alter function public.create_attendance_session_idempotent(jsonb) owner to postgres;
revoke all on function public.create_attendance_session_idempotent(jsonb) from public, anon;
grant execute on function public.create_attendance_session_idempotent(jsonb) to authenticated, service_role;

revoke insert, update, delete on public.attendance_records from authenticated;
revoke insert on public.attendance_sessions from authenticated;

commit;
