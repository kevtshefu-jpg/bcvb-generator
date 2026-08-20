begin;

create or replace function public.validate_attendance_session(
  target_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  session_row public.attendance_sessions;
  actor_role text;
  validated_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.'
      using errcode = '42501';
  end if;

  select
    case
      when is_active is true
       and profile_status = 'active'
      then
        case
          when lower(role) = 'technical_manager'
            then 'responsable_technique'
          else lower(role)
        end
      else 'inactive'
    end
  into actor_role
  from public.profiles
  where id = auth.uid();

  if actor_role not in (
    'admin',
    'responsable_technique',
    'coach'
  ) then
    raise exception 'Validation des présences interdite.'
      using errcode = '42501';
  end if;

  select *
  into session_row
  from public.attendance_sessions
  where id = target_session_id
  for update;

  if session_row is null then
    raise exception 'Séance d''appel introuvable.'
      using errcode = 'P0002';
  end if;

  if actor_role = 'coach'
     and not public.can_access_team(session_row.team_id) then
    raise exception 'Accès à cette équipe interdit.'
      using errcode = '42501';
  end if;

  if session_row.status = 'cancelled' then
    raise exception 'Une séance annulée ne peut pas être validée.'
      using errcode = '22023';
  end if;

  update public.attendance_sessions
  set
    status = 'validated',
    validated_by = auth.uid(),
    validated_at = now(),
    updated_by = auth.uid(),
    updated_at = now()
  where id = target_session_id;

  update public.attendance_records
  set
    validated_by_coach = true,
    updated_by = auth.uid(),
    updated_at = now()
  where session_id = target_session_id;

  get diagnostics validated_count = row_count;

  return jsonb_build_object(
    'ok', true,
    'session_id', target_session_id,
    'validated_records', validated_count
  );
end;
$$;

alter function public.validate_attendance_session(uuid)
  owner to postgres;

revoke all
on function public.validate_attendance_session(uuid)
from public, anon;

grant execute
on function public.validate_attendance_session(uuid)
to authenticated, service_role;

commit;
