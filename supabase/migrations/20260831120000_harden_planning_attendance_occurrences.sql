-- GO-LIVE 07E — lie la création d'un appel d'entraînement à une occurrence
-- canonique du planning, sans réécrire les appels historiques.

begin;

create or replace function public.create_attendance_session_idempotent(session_payload jsonb)
returns jsonb
language plpgsql security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  target_team_id uuid;
  target_team_season text;
  target_slot_id uuid;
  target_date date;
  target_type text;
  supplied_start time;
  supplied_end time;
  supplied_location text;
  effective_start time;
  effective_end time;
  effective_location text;
  slot public.training_slots;
  slot_exception public.training_slot_exceptions;
  saved public.attendance_sessions;
  was_created boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  begin
    target_team_id := (session_payload->>'team_id')::uuid;
    target_slot_id := nullif(session_payload->>'training_slot_id', '')::uuid;
    target_date := (session_payload->>'session_date')::date;
    target_type := session_payload->>'session_type';
    supplied_start := nullif(session_payload->>'start_time', '')::time;
    supplied_end := nullif(session_payload->>'end_time', '')::time;
    supplied_location := nullif(btrim(session_payload->>'location_name'), '');
  exception when others then
    raise exception 'Payload de séance invalide.' using errcode = '22023';
  end;

  if target_team_id is null or target_date is null or target_type is null then
    raise exception 'Équipe, date et type sont requis.' using errcode = '22023';
  end if;

  actor_role := public.current_user_role();
  if not (
    actor_role in ('admin', 'responsable_technique', 'technical_manager')
    or (actor_role = 'coach' and public.can_access_team(target_team_id))
  ) then
    raise exception 'Création de séance interdite.' using errcode = '42501';
  end if;

  select season into target_team_season from public.teams
  where id = target_team_id and archived_at is null;
  if target_team_season is null then
    raise exception 'Équipe canonique introuvable.' using errcode = '22023';
  end if;

  if target_slot_id is not null then
    if target_type <> 'entrainement' then
      raise exception 'Une occurrence de planning doit être un entraînement.' using errcode = '22023';
    end if;

    select * into slot from public.training_slots
    where id = target_slot_id
    for share;
    if slot.id is null or not slot.is_active or slot.team_id <> target_team_id
      or slot.season <> target_team_season then
      raise exception 'Créneau actif incompatible avec cette équipe.' using errcode = '22023';
    end if;
    if target_date < slot.valid_from
      or (slot.valid_until is not null and target_date > slot.valid_until)
      or extract(isodow from target_date)::smallint <> slot.weekday then
      raise exception 'La date ne correspond pas au créneau.' using errcode = '22023';
    end if;

    select * into slot_exception from public.training_slot_exceptions
    where training_slot_id = target_slot_id and exception_date = target_date;
    if slot_exception.exception_type = 'cancelled' then
      raise exception 'Cette occurrence est annulée.' using errcode = '22023';
    end if;

    effective_start := coalesce(slot_exception.start_time, slot.start_time);
    effective_end := coalesce(slot_exception.end_time, slot.end_time);
    effective_location := coalesce(slot_exception.location_name, slot.location_name);
    if supplied_start is distinct from effective_start
      or supplied_end is distinct from effective_end
      or supplied_location is distinct from nullif(btrim(effective_location), '') then
      raise exception 'Horaire ou lieu incompatible avec le planning.' using errcode = '22023';
    end if;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    concat_ws('|', target_team_id, target_date, coalesce(supplied_start, '00:00'::time), target_type), 0
  ));

  select * into saved from public.attendance_sessions
  where team_id = target_team_id
    and session_date = target_date
    and coalesce(start_time, '00:00'::time) = coalesce(supplied_start, '00:00'::time)
    and session_type = target_type
    and status <> 'cancelled';

  if saved.id is not null then
    if saved.training_slot_id is distinct from target_slot_id
      or saved.end_time is distinct from supplied_end
      or nullif(btrim(saved.location_name), '') is distinct from supplied_location then
      raise exception 'Un appel historique incompatible utilise déjà cette identité.' using errcode = '22023';
    end if;
  else
    insert into public.attendance_sessions(
      team_id, training_slot_id, session_date, title, session_type,
      start_time, end_time, location_name, created_by
    ) values (
      target_team_id, target_slot_id, target_date,
      coalesce(nullif(btrim(session_payload->>'title'), ''), 'Appel séance'),
      target_type, supplied_start, supplied_end, supplied_location, auth.uid()
    ) returning * into saved;
    was_created := true;
  end if;

  return jsonb_build_object('ok', true, 'id', saved.id, 'created', was_created);
end;
$$;

alter function public.create_attendance_session_idempotent(jsonb) owner to postgres;
revoke all on function public.create_attendance_session_idempotent(jsonb) from public, anon;
grant execute on function public.create_attendance_session_idempotent(jsonb) to authenticated, service_role;

commit;
