-- GO-02B — Affectations staff transactionnelles.
-- team_staff_assignments devient la source de vérité. Les colonnes historiques
-- de teams restent synchronisées pour les consommateurs existants.

begin;

-- Les écritures authentifiées passent désormais exclusivement par les RPC
-- ci-dessous. La policy de lecture existante reste inchangée et service_role
-- conserve son bypass pour les fixtures et opérations serveur.
drop policy if exists team_staff_assignments_admin_all on public.team_staff_assignments;

-- Résorbe d'éventuels doublons historiques sans supprimer l'historique. Le
-- coach déjà référencé par teams est conservé en priorité, sinon le plus récent.
with ranked_head_coaches as (
  select
    tsa.id,
    row_number() over (
      partition by tsa.team_id
      order by (tsa.profile_id = t.head_coach_id) desc, tsa.updated_at desc, tsa.created_at desc, tsa.id
    ) as position
  from public.team_staff_assignments tsa
  join public.teams t on t.id = tsa.team_id
  where tsa.assignment_role = 'head_coach' and tsa.is_active is true
)
update public.team_staff_assignments tsa
set is_active = false, updated_at = now()
from ranked_head_coaches ranked
where tsa.id = ranked.id and ranked.position > 1;

create unique index if not exists team_staff_one_active_head_coach_idx
  on public.team_staff_assignments(team_id)
  where assignment_role = 'head_coach' and is_active is true;

create or replace function public.lock_team_staff_mutation(target_team_id uuid)
returns void
language sql
volatile
security definer
set search_path = public, pg_temp
as $$
  select pg_advisory_xact_lock(hashtextextended(target_team_id::text, 0))
$$;
alter function public.lock_team_staff_mutation(uuid) owner to postgres;
revoke all on function public.lock_team_staff_mutation(uuid) from public, anon, authenticated;

create or replace function public.sync_team_legacy_staff_columns(target_team_id uuid)
returns void
language sql
volatile
security definer
set search_path = public, pg_temp
as $$
  update public.teams t
  set
    head_coach_id = (
      select tsa.profile_id
      from public.team_staff_assignments tsa
      where tsa.team_id = target_team_id
        and tsa.assignment_role = 'head_coach'
        and tsa.is_active is true
      limit 1
    ),
    assistant_coach_ids = coalesce((
      select array_agg(tsa.profile_id order by tsa.created_at, tsa.id)
      from public.team_staff_assignments tsa
      where tsa.team_id = target_team_id
        and tsa.assignment_role = 'assistant_coach'
        and tsa.is_active is true
    ), '{}'::uuid[]),
    updated_at = now()
  where t.id = target_team_id
$$;
alter function public.sync_team_legacy_staff_columns(uuid) owner to postgres;
revoke all on function public.sync_team_legacy_staff_columns(uuid) from public, anon, authenticated;

create or replace function public.sync_team_staff_assignment_legacy_columns()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  affected_team_id uuid := coalesce(new.team_id, old.team_id);
begin
  perform public.lock_team_staff_mutation(affected_team_id);
  perform public.sync_team_legacy_staff_columns(affected_team_id);
  if tg_op = 'UPDATE' and old.team_id is distinct from new.team_id then
    perform public.lock_team_staff_mutation(old.team_id);
    perform public.sync_team_legacy_staff_columns(old.team_id);
  end if;
  return coalesce(new, old);
end;
$$;
alter function public.sync_team_staff_assignment_legacy_columns() owner to postgres;
revoke all on function public.sync_team_staff_assignment_legacy_columns() from public, anon, authenticated;

drop trigger if exists sync_team_staff_assignment_legacy_columns_trigger on public.team_staff_assignments;
create constraint trigger sync_team_staff_assignment_legacy_columns_trigger
after insert or update or delete on public.team_staff_assignments
deferrable initially deferred
for each row execute function public.sync_team_staff_assignment_legacy_columns();

-- Aligne immédiatement les colonnes historiques sur la source de vérité.
update public.teams t
set
  head_coach_id = (
    select tsa.profile_id from public.team_staff_assignments tsa
    where tsa.team_id = t.id and tsa.assignment_role = 'head_coach' and tsa.is_active is true
    limit 1
  ),
  assistant_coach_ids = coalesce((
    select array_agg(tsa.profile_id order by tsa.created_at, tsa.id)
    from public.team_staff_assignments tsa
    where tsa.team_id = t.id and tsa.assignment_role = 'assistant_coach' and tsa.is_active is true
  ), '{}'::uuid[]);

create or replace function public.assign_team_staff(
  target_team_id uuid,
  target_profile_id uuid,
  target_assignment_role text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  assignment_id uuid;
  replaced_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  select case when p.is_active is true and p.profile_status = 'active'
    then case when lower(p.role) = 'technical_manager' then 'responsable_technique' else lower(p.role) end
    else 'inactive' end
  into actor_role
  from public.profiles p where p.id = auth.uid();
  if actor_role not in ('admin', 'responsable_technique') then
    raise exception 'Gestion des affectations staff interdite.' using errcode = '42501';
  end if;

  if target_assignment_role not in ('head_coach', 'assistant_coach', 'team_staff', 'parent_referent') then
    raise exception 'Rôle d’affectation invalide.' using errcode = '22023';
  end if;

  perform public.lock_team_staff_mutation(target_team_id);
  if not exists (select 1 from public.teams where id = target_team_id for update) then
    raise exception 'Équipe introuvable.' using errcode = 'P0002';
  end if;
  if not exists (
    select 1 from public.profiles
    where id = target_profile_id and is_active is true and profile_status = 'active'
  ) then
    raise exception 'Profil cible absent ou inactif.' using errcode = 'P0002';
  end if;
  if exists (
    select 1 from public.team_staff_assignments
    where team_id = target_team_id and profile_id = target_profile_id
      and assignment_role = target_assignment_role and is_active is true
  ) then
    raise exception 'Cette affectation existe déjà.' using errcode = '23505';
  end if;

  if target_assignment_role = 'head_coach' then
    update public.team_staff_assignments
    set is_active = false, updated_at = now()
    where team_id = target_team_id and assignment_role = 'head_coach' and is_active is true;
    get diagnostics replaced_count = row_count;
  end if;

  insert into public.team_staff_assignments (
    team_id, profile_id, assignment_role, is_active, created_by, updated_at
  ) values (
    target_team_id, target_profile_id, target_assignment_role, true, auth.uid(), now()
  )
  on conflict (team_id, profile_id, assignment_role) do update
  set is_active = true, updated_at = now(), created_by = auth.uid()
  returning id into assignment_id;

  perform public.sync_team_legacy_staff_columns(target_team_id);
  return jsonb_build_object('ok', true, 'assignment_id', assignment_id, 'replaced_count', replaced_count);
end;
$$;
alter function public.assign_team_staff(uuid, uuid, text) owner to postgres;
revoke all on function public.assign_team_staff(uuid, uuid, text) from public, anon;
grant execute on function public.assign_team_staff(uuid, uuid, text) to authenticated, service_role;

create or replace function public.remove_team_staff(target_assignment_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  affected_team_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;
  select case when p.is_active is true and p.profile_status = 'active'
    then case when lower(p.role) = 'technical_manager' then 'responsable_technique' else lower(p.role) end
    else 'inactive' end
  into actor_role
  from public.profiles p where p.id = auth.uid();
  if actor_role not in ('admin', 'responsable_technique') then
    raise exception 'Gestion des affectations staff interdite.' using errcode = '42501';
  end if;

  select team_id into affected_team_id
  from public.team_staff_assignments where id = target_assignment_id;
  if affected_team_id is null then
    raise exception 'Affectation introuvable.' using errcode = 'P0002';
  end if;
  perform public.lock_team_staff_mutation(affected_team_id);
  perform 1 from public.teams where id = affected_team_id for update;

  update public.team_staff_assignments
  set is_active = false, updated_at = now()
  where id = target_assignment_id and is_active is true;
  if not found then
    raise exception 'Affectation déjà inactive.' using errcode = 'P0002';
  end if;
  perform public.sync_team_legacy_staff_columns(affected_team_id);
  return jsonb_build_object('ok', true, 'assignment_id', target_assignment_id);
end;
$$;
alter function public.remove_team_staff(uuid) owner to postgres;
revoke all on function public.remove_team_staff(uuid) from public, anon;
grant execute on function public.remove_team_staff(uuid) to authenticated, service_role;

commit;
