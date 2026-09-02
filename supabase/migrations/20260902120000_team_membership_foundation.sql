-- GO-LIVE 08C.11 — fondation canonique des appartenances joueur / équipe-saison.
-- Cette migration est fail-closed : aucune donnée métier existante n'est corrigée.

begin;

do $$
begin
  if exists (
    select 1 from public.team_memberships
    group by player_id, team_id, season having count(*) > 1
  ) then
    raise exception 'M2 preflight: duplicate team membership.' using errcode = 'PT409';
  end if;

  if exists (
    select 1
    from public.team_memberships tm
    join public.teams t on t.id = tm.team_id
    where tm.season is distinct from t.season
  ) then
    raise exception 'M2 preflight: membership season mismatch.' using errcode = 'PT409';
  end if;

  if exists (
    select 1 from public.team_memberships
    where status is null or status not in ('active', 'inactive')
  ) then
    raise exception 'M2 preflight: invalid membership status.' using errcode = 'PT409';
  end if;

  if exists (
    select 1 from public.team_memberships
    where season is null
       or btrim(season) = ''
       or not public.is_canonical_team_season(season)
  ) then
    raise exception 'M2 preflight: invalid membership season.' using errcode = 'PT409';
  end if;

  if exists (
    select 1 from public.team_memberships tm
    left join public.players p on p.id = tm.player_id
    where p.id is null
  ) then
    raise exception 'M2 preflight: orphan membership player.' using errcode = 'PT409';
  end if;

  if exists (
    select 1 from public.team_memberships tm
    left join public.teams t on t.id = tm.team_id
    where t.id is null
  ) then
    raise exception 'M2 preflight: orphan membership team.' using errcode = 'PT409';
  end if;
end;
$$;

alter table public.teams
  add constraint teams_id_season_key unique (id, season);

alter table public.team_memberships
  add constraint team_memberships_status_check
    check (status in ('active', 'inactive')),
  add constraint team_memberships_season_canonical_check
    check (public.is_canonical_team_season(season)),
  alter column season drop default,
  add constraint team_memberships_player_team_season_key
    unique (player_id, team_id, season);

alter table public.team_memberships
  add constraint team_memberships_team_id_season_fkey
  foreign key (team_id, season)
  references public.teams(id, season)
  on update no action
  on delete no action
  not valid;

alter table public.team_memberships
  validate constraint team_memberships_team_id_season_fkey;

alter table public.team_memberships
  drop constraint team_memberships_team_id_fkey;

alter table public.team_memberships
  add constraint team_memberships_player_id_restrict_fkey
  foreign key (player_id)
  references public.players(id)
  on update no action
  on delete no action
  not valid;

alter table public.team_memberships
  validate constraint team_memberships_player_id_restrict_fkey;

alter table public.team_memberships
  drop constraint team_memberships_player_id_fkey;

alter table public.team_memberships
  rename constraint team_memberships_player_id_restrict_fkey
  to team_memberships_player_id_fkey;

create or replace function public.touch_team_membership_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

alter function public.touch_team_membership_updated_at() owner to postgres;
revoke all on function public.touch_team_membership_updated_at() from public, anon, authenticated, service_role;

drop trigger if exists team_memberships_touch_updated_at on public.team_memberships;
create trigger team_memberships_touch_updated_at
before update on public.team_memberships
for each row execute function public.touch_team_membership_updated_at();

create or replace function public.add_or_reactivate_team_membership(
  target_player_id uuid,
  target_team_id uuid,
  target_season text
)
returns table (
  membership_id uuid,
  status text,
  changed boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  target_team public.teams%rowtype;
  target_player public.players%rowtype;
  current_membership public.team_memberships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  if coalesce(public.current_user_role(), '') not in ('admin', 'responsable_technique') then
    raise exception 'Modification des appartenances interdite.' using errcode = '42501';
  end if;

  if target_player_id is null or target_team_id is null
     or target_season is null
     or not public.is_canonical_team_season(target_season) then
    raise exception 'Joueur, équipe et saison canonique sont requis.' using errcode = '22023';
  end if;

  select * into target_team
  from public.teams t
  where t.id = target_team_id;

  if target_team.id is null or target_team.archived_at is not null then
    raise exception 'Équipe introuvable ou archivée.' using errcode = '22023';
  end if;
  if target_team.season is distinct from target_season then
    raise exception 'La saison du membership ne correspond pas à celle de l’équipe.' using errcode = '22023';
  end if;

  select * into target_player
  from public.players p
  where p.id = target_player_id;

  if target_player.id is null
     or target_player.archived_at is not null
     or target_player.deleted_at is not null then
    raise exception 'Joueur introuvable, archivé ou supprimé.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    concat_ws('|', target_player_id::text, target_team_id::text, target_season),
    0
  ));

  select * into current_membership
  from public.team_memberships tm
  where tm.player_id = target_player_id
    and tm.team_id = target_team_id
    and tm.season = target_season
  for update;

  if current_membership.id is null then
    insert into public.team_memberships (
      player_id, team_id, season, status, created_by
    ) values (
      target_player_id, target_team_id, target_season, 'active', auth.uid()
    )
    returning id, team_memberships.status
    into membership_id, status;
    changed := true;
  elsif current_membership.status = 'inactive' then
    update public.team_memberships tm
    set status = 'active'
    where tm.id = current_membership.id
    returning tm.id, tm.status
    into membership_id, status;
    changed := true;
  else
    membership_id := current_membership.id;
    status := current_membership.status;
    changed := false;
  end if;

  return next;
end;
$$;

create or replace function public.deactivate_team_membership(
  target_membership_id uuid
)
returns table (
  membership_id uuid,
  status text,
  changed boolean
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_membership public.team_memberships%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  if coalesce(public.current_user_role(), '') not in ('admin', 'responsable_technique') then
    raise exception 'Modification des appartenances interdite.' using errcode = '42501';
  end if;

  if target_membership_id is null then
    raise exception 'Membership introuvable.' using errcode = 'P0002';
  end if;

  select * into current_membership
  from public.team_memberships tm
  where tm.id = target_membership_id
  for update;

  if current_membership.id is null then
    raise exception 'Membership introuvable.' using errcode = 'P0002';
  end if;

  if current_membership.status = 'inactive' then
    membership_id := current_membership.id;
    status := current_membership.status;
    changed := false;
  else
    update public.team_memberships tm
    set status = 'inactive'
    where tm.id = current_membership.id
    returning tm.id, tm.status
    into membership_id, status;
    changed := true;
  end if;

  return next;
end;
$$;

alter function public.add_or_reactivate_team_membership(uuid, uuid, text) owner to postgres;
alter function public.deactivate_team_membership(uuid) owner to postgres;

revoke all on function public.add_or_reactivate_team_membership(uuid, uuid, text)
  from public, anon, service_role;
revoke all on function public.deactivate_team_membership(uuid)
  from public, anon, service_role;
grant execute on function public.add_or_reactivate_team_membership(uuid, uuid, text)
  to authenticated;
grant execute on function public.deactivate_team_membership(uuid)
  to authenticated;

drop policy if exists team_memberships_write_scope on public.team_memberships;
drop policy if exists team_memberships_select_scope on public.team_memberships;
create policy team_memberships_select_scope
on public.team_memberships
for select
to authenticated
using (public.can_access_team(team_id));

revoke all on table public.team_memberships from anon;
revoke insert, update, delete, truncate on table public.team_memberships from authenticated, service_role;
grant select on table public.team_memberships to authenticated;

do $$
begin
  if exists (
    select 1 from pg_policy p
    where p.polrelid = 'public.team_memberships'::regclass
      and p.polcmd <> 'r'
  ) then
    raise exception 'M2 validation: a membership write policy remains.' using errcode = 'PT409';
  end if;

  if has_table_privilege('authenticated', 'public.team_memberships', 'INSERT')
     or has_table_privilege('authenticated', 'public.team_memberships', 'UPDATE')
     or has_table_privilege('authenticated', 'public.team_memberships', 'DELETE')
     or has_table_privilege('service_role', 'public.team_memberships', 'INSERT')
     or has_table_privilege('service_role', 'public.team_memberships', 'UPDATE')
     or has_table_privilege('service_role', 'public.team_memberships', 'DELETE') then
    raise exception 'M2 validation: direct membership DML remains granted.' using errcode = 'PT409';
  end if;
end;
$$;

commit;
