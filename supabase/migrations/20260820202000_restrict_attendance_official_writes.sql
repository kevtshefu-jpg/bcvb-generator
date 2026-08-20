-- GO-02D
-- Restreint les écritures de présences officielles.
--
-- Principes :
-- - admin et responsable technique peuvent gérer les présences ;
-- - un coach ne peut écrire que sur ses équipes ;
-- - dirigeant, team_staff, parent_referent et autres rôles restent en lecture seule ;
-- - validated_by_coach ne peut jamais être promu directement par un utilisateur ;
-- - seule une opération serveur privilégiée, notamment
--   validate_attendance_session(), peut modifier validated_by_coach.

begin;

-- ============================================================
-- 1. POLICIES attendance_sessions
-- ============================================================

drop policy if exists attendance_sessions_insert
  on public.attendance_sessions;

create policy attendance_sessions_insert
on public.attendance_sessions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_current_user_admin()
    or public.current_user_role() in (
      'responsable_technique',
      'technical_manager'
    )
    or (
      public.current_user_role() = 'coach'
      and public.can_access_team(team_id)
    )
  )
);

drop policy if exists attendance_sessions_update
  on public.attendance_sessions;

create policy attendance_sessions_update
on public.attendance_sessions
for update
to authenticated
using (
  public.is_current_user_admin()
  or public.current_user_role() in (
    'responsable_technique',
    'technical_manager'
  )
  or (
    public.current_user_role() = 'coach'
    and public.can_access_team(team_id)
  )
)
with check (
  public.is_current_user_admin()
  or public.current_user_role() in (
    'responsable_technique',
    'technical_manager'
  )
  or (
    public.current_user_role() = 'coach'
    and public.can_access_team(team_id)
  )
);

-- ============================================================
-- 2. POLICIES attendance_records
-- ============================================================

drop policy if exists attendance_records_insert
  on public.attendance_records;

create policy attendance_records_insert
on public.attendance_records
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (
        public.is_current_user_admin()
        or public.current_user_role() in (
          'responsable_technique',
          'technical_manager'
        )
        or (
          public.current_user_role() = 'coach'
          and public.can_access_team(s.team_id)
        )
      )
  )
);

drop policy if exists attendance_records_update
  on public.attendance_records;

create policy attendance_records_update
on public.attendance_records
for update
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (
        public.is_current_user_admin()
        or public.current_user_role() in (
          'responsable_technique',
          'technical_manager'
        )
        or (
          public.current_user_role() = 'coach'
          and public.can_access_team(s.team_id)
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (
        public.is_current_user_admin()
        or public.current_user_role() in (
          'responsable_technique',
          'technical_manager'
        )
        or (
          public.current_user_role() = 'coach'
          and public.can_access_team(s.team_id)
        )
      )
  )
);

-- ============================================================
-- 3. PROTECTION DE validated_by_coach
-- ============================================================
--
-- Les policies RLS contrôlent les lignes mais pas suffisamment
-- les colonnes sensibles.
--
-- Une écriture PostgREST ordinaire s'exécute sous le rôle
-- authenticated.
--
-- validate_attendance_session() est SECURITY DEFINER et appartient
-- à postgres : l'UPDATE serveur légitime reste donc autorisé.
--

create or replace function public.protect_attendance_validation_flag()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if new.validated_by_coach is true
       and current_user not in ('postgres', 'service_role') then
      raise exception 'La validation coach doit passer par la procédure de validation.'
        using errcode = '42501';
    end if;

    return new;
  end if;

  if new.validated_by_coach is distinct from old.validated_by_coach
     and current_user not in ('postgres', 'service_role') then
    raise exception 'La validation coach doit passer par la procédure de validation.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

alter function public.protect_attendance_validation_flag()
owner to postgres;

revoke all
on function public.protect_attendance_validation_flag()
from public, anon, authenticated;

drop trigger if exists protect_attendance_validation_flag_trigger
on public.attendance_records;

create trigger protect_attendance_validation_flag_trigger
before insert or update of validated_by_coach
on public.attendance_records
for each row
execute function public.protect_attendance_validation_flag();

commit;
