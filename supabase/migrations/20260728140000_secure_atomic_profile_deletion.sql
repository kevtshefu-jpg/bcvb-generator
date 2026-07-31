create or replace function public.delete_profile_atomically(
  actor_profile_id uuid,
  target_profile_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  actor_row public.profiles;
  target_row public.profiles;
  active_admin_count bigint;
  blocking_dependencies text[] := array[]::text[];
  deleted_profile_count integer;
  deleted_auth_count integer;
begin
  if auth.uid() is null or auth.uid() <> actor_profile_id then
    raise sqlstate 'PT403' using message = 'Identité de l’administrateur incohérente.';
  end if;

  select * into actor_row
  from public.profiles
  where id = actor_profile_id
  for update;

  if actor_row is null
     or actor_row.is_active is not true
     or actor_row.profile_status <> 'active'
     or lower(coalesce(actor_row.role, '')) <> 'admin' then
    raise sqlstate 'PT403' using message = 'Accès administrateur requis.';
  end if;

  select * into target_row
  from public.profiles
  where id = target_profile_id
  for update;

  if target_row is null then
    raise sqlstate 'PT404' using message = 'Profil cible introuvable.';
  end if;

  if actor_profile_id = target_profile_id then
    raise sqlstate 'PT403' using message = 'Vous ne pouvez pas supprimer votre propre profil.';
  end if;

  if target_row.is_active is true
     and target_row.profile_status = 'active'
     and lower(coalesce(target_row.role, '')) = 'admin' then
    perform pg_advisory_xact_lock(
      hashtextextended('bcvb:active-admin-mutation', 0)
    );

    select count(*) into active_admin_count
    from public.profiles
    where is_active is true
      and profile_status = 'active'
      and lower(coalesce(role, '')) = 'admin';

    if active_admin_count <= 1 then
      raise sqlstate 'PT409'
      using message = 'Le dernier administrateur actif ne peut pas être supprimé.';
    end if;
  end if;

  if exists (select 1 from public.team_staff_assignments where profile_id = target_profile_id) then
    blocking_dependencies := array_append(blocking_dependencies, 'affectations équipe');
  end if;
  if exists (
    select 1 from public.teams
    where head_coach_id = target_profile_id
       or target_profile_id = any(coalesce(assistant_coach_ids, array[]::uuid[]))
       or created_by = target_profile_id
  ) then
    blocking_dependencies := array_append(blocking_dependencies, 'équipes');
  end if;
  if exists (
    select 1 from public.sessions
    where coach_id = target_profile_id or owner_id = target_profile_id or deleted_by = target_profile_id
  ) then
    blocking_dependencies := array_append(blocking_dependencies, 'séances');
  end if;
  if exists (
    select 1 from public.situations
    where owner_id = target_profile_id or created_by = target_profile_id
  ) then
    blocking_dependencies := array_append(blocking_dependencies, 'situations');
  end if;
  if exists (
    select 1 from public.players
    where owner_id = target_profile_id or created_by = target_profile_id
  ) then
    blocking_dependencies := array_append(blocking_dependencies, 'joueurs');
  end if;
  if exists (select 1 from public.player_contacts where created_by = target_profile_id) then
    blocking_dependencies := array_append(blocking_dependencies, 'contacts joueurs');
  end if;
  if exists (
    select 1 from public.profile_requests
    where user_id = target_profile_id or decided_by = target_profile_id
  ) then
    blocking_dependencies := array_append(blocking_dependencies, 'demandes de profil');
  end if;
  if exists (
    select 1 from public.registration_requests
    where approved_by = target_profile_id or rejected_by = target_profile_id
  ) then
    blocking_dependencies := array_append(blocking_dependencies, 'demandes d’inscription');
  end if;
  if exists (select 1 from public.roster_import_batches where created_by = target_profile_id) then
    blocking_dependencies := array_append(blocking_dependencies, 'imports d’effectif');
  end if;
  if exists (select 1 from public.session_imports where created_by = target_profile_id) then
    blocking_dependencies := array_append(blocking_dependencies, 'imports de séance');
  end if;
  if exists (select 1 from public.session_visibility_logs where user_id = target_profile_id) then
    blocking_dependencies := array_append(blocking_dependencies, 'journaux de consultation');
  end if;
  if exists (select 1 from public.team_memberships where created_by = target_profile_id) then
    blocking_dependencies := array_append(blocking_dependencies, 'historique d’effectif');
  end if;
  if exists (select 1 from public.player_duplicate_candidates where decided_by = target_profile_id) then
    blocking_dependencies := array_append(blocking_dependencies, 'décisions de rapprochement');
  end if;
  if exists (select 1 from public.admin_notifications where recipient_user_id = target_profile_id) then
    blocking_dependencies := array_append(blocking_dependencies, 'notifications personnelles');
  end if;

  if cardinality(blocking_dependencies) > 0 then
    raise sqlstate 'PT409'
    using
      message = 'Ce profil possède des données liées et ne peut pas être supprimé.',
      detail = array_to_string(blocking_dependencies, ', '),
      hint = 'Suspendez le compte ou réattribuez explicitement les données concernées.';
  end if;

  insert into public.admin_notifications (
    type,
    title,
    message,
    recipient_role,
    metadata
  ) values (
    'profile_deleted',
    'Suppression définitive d’un profil',
    'Un administrateur a supprimé définitivement un profil sans dépendance métier.',
    'admin',
    jsonb_build_object(
      'actor_id', actor_profile_id,
      'target_id', target_profile_id,
      'target_role', target_row.role,
      'result', 'deleted'
    )
  );

  delete from public.profiles where id = target_profile_id;
  get diagnostics deleted_profile_count = row_count;

  if deleted_profile_count <> 1 then
    raise exception 'Suppression du profil non confirmée.';
  end if;

  delete from auth.users where id = target_profile_id;
  get diagnostics deleted_auth_count = row_count;

  if deleted_auth_count <> 1 then
    raise sqlstate 'PT409'
    using message = 'Le compte associé au profil est introuvable.';
  end if;

  if exists (select 1 from auth.users where id = target_profile_id)
     or exists (select 1 from public.profiles where id = target_profile_id) then
    raise exception 'Suppression atomique incomplète.';
  end if;

  return jsonb_build_object(
    'deleted', true,
    'profile_id', target_profile_id,
    'audit_recorded', true
  );
end;
$$;
