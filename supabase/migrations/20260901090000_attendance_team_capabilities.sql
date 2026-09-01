-- GO-LIVE 08B.2 — capacités Attendance par équipe et contrat coach explicite.

begin;

create or replace function public.can_manage_attendance_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when auth.uid() is null or p_team_id is null then false
    when public.current_user_role() in ('admin', 'responsable_technique') then
      exists (select 1 from public.teams t where t.id = p_team_id)
    when public.current_user_role() = 'coach' then exists (
      select 1
      from public.team_staff_assignments tsa
      where tsa.team_id = p_team_id
        and tsa.profile_id = auth.uid()
        and tsa.is_active is true
        and tsa.assignment_role in ('head_coach', 'assistant_coach')
    )
    else false
  end
$$;

alter function public.can_manage_attendance_team(uuid) owner to postgres;
revoke all on function public.can_manage_attendance_team(uuid) from public, anon;
grant execute on function public.can_manage_attendance_team(uuid) to authenticated, service_role;

create or replace function public.get_attendance_capabilities(p_team_id uuid)
returns table (
  can_view boolean,
  can_navigate boolean,
  can_edit_draft boolean,
  can_validate boolean,
  can_export boolean,
  can_view_sensitive_notes boolean,
  can_manage_planning boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  may_view boolean := false;
  may_manage boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  actor_role := public.current_user_role();
  if actor_role is null or actor_role = 'inactive'
    or not exists (select 1 from public.teams where id = p_team_id) then
    return query select false, false, false, false, false, false, false;
    return;
  end if;

  may_view := coalesce(
    public.is_current_user_club_leader() or public.can_access_team(p_team_id),
    false
  );
  may_manage := coalesce(public.can_manage_attendance_team(p_team_id), false);

  return query select
    coalesce(may_view, false),
    coalesce(may_view, false),
    coalesce(may_manage, false),
    coalesce(may_manage, false),
    coalesce(may_manage, false),
    coalesce(may_manage, false),
    coalesce(actor_role in ('admin', 'responsable_technique'), false);
end;
$$;

alter function public.get_attendance_capabilities(uuid) owner to postgres;
revoke all on function public.get_attendance_capabilities(uuid) from public, anon;
grant execute on function public.get_attendance_capabilities(uuid) to authenticated, service_role;

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
declare target_team_id uuid; may_read_sensitive boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  select s.team_id into target_team_id from public.attendance_sessions s where s.id = target_session_id;
  if target_team_id is null then raise exception 'Séance d''appel introuvable.' using errcode = 'P0002'; end if;
  if not (public.is_current_user_club_leader() or public.can_access_team(target_team_id)) then return; end if;
  may_read_sensitive := public.can_manage_attendance_team(target_team_id);
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

create or replace function public.read_attendance_records(
  target_session_id uuid,
  target_player_id uuid default null
)
returns table (
  id uuid, session_id uuid, player_id uuid, status text, reason text,
  delay_minutes integer, injury_note text, logistic_note text, coach_comment text,
  source text, parent_confirmed boolean, validated_by_coach boolean,
  created_by uuid, updated_by uuid, created_at timestamptz, updated_at timestamptz
)
language plpgsql security definer stable
set search_path = public, pg_temp
as $$
declare target_team_id uuid; may_read_sensitive boolean;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  select s.team_id into target_team_id from public.attendance_sessions s where s.id = target_session_id;
  if target_team_id is null then raise exception 'Séance d''appel introuvable.' using errcode = 'P0002'; end if;
  if not (public.is_current_user_club_leader() or public.can_access_team(target_team_id)) then return; end if;
  may_read_sensitive := public.can_manage_attendance_team(target_team_id);
  return query select ar.id, ar.session_id, ar.player_id, ar.status,
    case when may_read_sensitive then ar.reason else null end, ar.delay_minutes,
    case when may_read_sensitive then ar.injury_note else null end,
    case when may_read_sensitive then ar.logistic_note else null end,
    case when may_read_sensitive then ar.coach_comment else null end,
    ar.source, ar.parent_confirmed, ar.validated_by_coach, ar.created_by,
    ar.updated_by, ar.created_at, ar.updated_at
  from public.attendance_records ar
  where ar.session_id = target_session_id
    and (target_player_id is null or ar.player_id = target_player_id);
end;
$$;

alter function public.read_attendance_records(uuid, uuid) owner to postgres;
revoke all on function public.read_attendance_records(uuid, uuid) from public, anon;
grant execute on function public.read_attendance_records(uuid, uuid) to authenticated, service_role;

create or replace function public.save_attendance_record(
  record_payload jsonb,
  expected_version bigint default null
)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  target_id uuid := nullif(record_payload->>'id', '')::uuid;
  target_session_id uuid := (record_payload->>'session_id')::uuid;
  target_player_id uuid := (record_payload->>'player_id')::uuid;
  target_team_id uuid;
  saved public.attendance_records;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;

  select team_id into target_team_id from public.attendance_sessions
  where id = target_session_id and status = 'draft' for update;
  if target_team_id is null then
    raise exception 'La séance est validée et ne peut plus être modifiée.' using errcode = '42501';
  end if;
  if not public.can_manage_attendance_team(target_team_id) then
    raise exception 'Modification des présences interdite.' using errcode = '42501';
  end if;

  if target_id is null then
    if expected_version is not null then raise exception 'Version inattendue pour un nouveau relevé.' using errcode = '22023'; end if;
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
    if expected_version is null then raise exception 'Version attendue manquante.' using errcode = '22023'; end if;
    update public.attendance_records set
      status = record_payload->>'status', reason = nullif(record_payload->>'reason', ''),
      delay_minutes = nullif(record_payload->>'delay_minutes', '')::integer,
      injury_note = nullif(record_payload->>'injury_note', ''),
      logistic_note = nullif(record_payload->>'logistic_note', ''),
      coach_comment = nullif(record_payload->>'coach_comment', ''),
      source = coalesce(nullif(record_payload->>'source', ''), source),
      validated_by_coach = false, updated_by = auth.uid(), version = version + 1
    where id = target_id and session_id = target_session_id and player_id = target_player_id
      and version = expected_version returning * into saved;
    if saved.id is null then raise exception 'Cet appel a été modifié depuis votre dernier chargement.' using errcode = 'PT409'; end if;
  end if;
  return jsonb_build_object('ok', true, 'id', saved.id, 'version', saved.version, 'updated_at', saved.updated_at);
end;
$$;

alter function public.save_attendance_record(jsonb, bigint) owner to postgres;
revoke all on function public.save_attendance_record(jsonb, bigint) from public, anon;
grant execute on function public.save_attendance_record(jsonb, bigint) to authenticated, service_role;

create or replace function public.validate_attendance_session(target_session_id uuid)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare session_row public.attendance_sessions; validated_count integer;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  select * into session_row from public.attendance_sessions where id = target_session_id for update;
  if session_row is null then raise exception 'Séance d''appel introuvable.' using errcode = 'P0002'; end if;
  if not public.can_manage_attendance_team(session_row.team_id) then
    raise exception 'Validation des présences interdite.' using errcode = '42501';
  end if;
  if session_row.status = 'cancelled' then raise exception 'Une séance annulée ne peut pas être validée.' using errcode = '22023'; end if;

  update public.attendance_sessions set status = 'validated', validated_by = auth.uid(),
    validated_at = now(), updated_by = auth.uid(), updated_at = now()
  where id = target_session_id;
  perform set_config('bcvb.attendance_validation_rpc', 'allowed', true);
  update public.attendance_records set validated_by_coach = true,
    updated_by = auth.uid(), updated_at = now() where session_id = target_session_id;
  get diagnostics validated_count = row_count;
  return jsonb_build_object('ok', true, 'session_id', target_session_id, 'validated_records', validated_count);
end;
$$;

alter function public.validate_attendance_session(uuid) owner to postgres;
revoke all on function public.validate_attendance_session(uuid) from public, anon;
grant execute on function public.validate_attendance_session(uuid) to authenticated, service_role;

create or replace function public.create_attendance_session_idempotent(session_payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  target_team_id uuid; target_team_season text; target_slot_id uuid; target_date date; target_type text;
  supplied_start time; supplied_end time; supplied_location text; effective_start time; effective_end time; effective_location text;
  slot public.training_slots; slot_exception public.training_slot_exceptions; saved public.attendance_sessions;
  was_created boolean := false;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  begin
    target_team_id := (session_payload->>'team_id')::uuid;
    target_slot_id := nullif(session_payload->>'training_slot_id', '')::uuid;
    target_date := (session_payload->>'session_date')::date;
    target_type := session_payload->>'session_type';
    supplied_start := nullif(session_payload->>'start_time', '')::time;
    supplied_end := nullif(session_payload->>'end_time', '')::time;
    supplied_location := nullif(btrim(session_payload->>'location_name'), '');
  exception when others then raise exception 'Payload de séance invalide.' using errcode = '22023'; end;
  if target_team_id is null or target_date is null or target_type is null then
    raise exception 'Équipe, date et type sont requis.' using errcode = '22023';
  end if;
  if not public.can_manage_attendance_team(target_team_id) then
    raise exception 'Création de séance interdite.' using errcode = '42501';
  end if;

  select season into target_team_season from public.teams where id = target_team_id and archived_at is null;
  if target_team_season is null then raise exception 'Équipe canonique introuvable.' using errcode = '22023'; end if;
  if target_slot_id is not null then
    if target_type <> 'entrainement' then raise exception 'Une occurrence de planning doit être un entraînement.' using errcode = '22023'; end if;
    select * into slot from public.training_slots where id = target_slot_id for share;
    if slot.id is null or not slot.is_active or slot.team_id <> target_team_id or slot.season <> target_team_season then
      raise exception 'Créneau actif incompatible avec cette équipe.' using errcode = '22023';
    end if;
    if target_date < slot.valid_from or (slot.valid_until is not null and target_date > slot.valid_until)
      or extract(isodow from target_date)::smallint <> slot.weekday then
      raise exception 'La date ne correspond pas au créneau.' using errcode = '22023';
    end if;
    select * into slot_exception from public.training_slot_exceptions
    where training_slot_id = target_slot_id and exception_date = target_date;
    if slot_exception.exception_type = 'cancelled' then raise exception 'Cette occurrence est annulée.' using errcode = '22023'; end if;
    effective_start := coalesce(slot_exception.start_time, slot.start_time);
    effective_end := coalesce(slot_exception.end_time, slot.end_time);
    effective_location := coalesce(slot_exception.location_name, slot.location_name);
    if supplied_start is distinct from effective_start or supplied_end is distinct from effective_end
      or supplied_location is distinct from nullif(btrim(effective_location), '') then
      raise exception 'Horaire ou lieu incompatible avec le planning.' using errcode = '22023';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    concat_ws('|', target_team_id, target_date, coalesce(supplied_start, '00:00'::time), target_type), 0));
  select * into saved from public.attendance_sessions
  where team_id = target_team_id and session_date = target_date
    and coalesce(start_time, '00:00'::time) = coalesce(supplied_start, '00:00'::time)
    and session_type = target_type and status <> 'cancelled';
  if saved.id is not null then
    if saved.training_slot_id is distinct from target_slot_id or saved.end_time is distinct from supplied_end
      or nullif(btrim(saved.location_name), '') is distinct from supplied_location then
      raise exception 'Un appel historique incompatible utilise déjà cette identité.' using errcode = '22023';
    end if;
  else
    insert into public.attendance_sessions(team_id, training_slot_id, session_date, title, session_type,
      start_time, end_time, location_name, created_by)
    values (target_team_id, target_slot_id, target_date,
      coalesce(nullif(btrim(session_payload->>'title'), ''), 'Appel séance'), target_type,
      supplied_start, supplied_end, supplied_location, auth.uid()) returning * into saved;
    was_created := true;
  end if;
  return jsonb_build_object('ok', true, 'id', saved.id, 'created', was_created);
end;
$$;

alter function public.create_attendance_session_idempotent(jsonb) owner to postgres;
revoke all on function public.create_attendance_session_idempotent(jsonb) from public, anon;
grant execute on function public.create_attendance_session_idempotent(jsonb) to authenticated, service_role;

commit;
