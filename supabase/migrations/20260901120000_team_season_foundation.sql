-- GO-LIVE 08C.4 — fondation canonique équipe-saison.
-- Une ligne teams représente une équipe pour une seule saison.

begin;

create or replace function public.normalize_team_identity_part(value text)
returns text
language sql
immutable
strict
set search_path = public, pg_temp
as $$
  select lower(regexp_replace(btrim(value), '[[:space:]]+', ' ', 'g'))
$$;
alter function public.normalize_team_identity_part(text) owner to postgres;
revoke all on function public.normalize_team_identity_part(text) from public, anon, authenticated, service_role;
grant execute on function public.normalize_team_identity_part(text) to authenticated, service_role;

create or replace function public.is_canonical_team_season(value text)
returns boolean
language sql
immutable
strict
set search_path = public, pg_temp
as $$
  select case
    when value ~ '^[0-9]{4}-[0-9]{4}$'
      then right(value, 4)::integer = left(value, 4)::integer + 1
    else false
  end
$$;
alter function public.is_canonical_team_season(text) owner to postgres;
revoke all on function public.is_canonical_team_season(text) from public, anon, authenticated, service_role;
grant execute on function public.is_canonical_team_season(text) to authenticated, service_role;

alter table public.teams
  add constraint teams_name_nonempty_check check (btrim(name) <> ''),
  add constraint teams_category_nonempty_check check (btrim(category) <> ''),
  add constraint teams_level_nonempty_check check (btrim(level) <> ''),
  add constraint teams_season_canonical_check check (public.is_canonical_team_season(season));

create unique index teams_logical_identity_unique_idx
  on public.teams (
    public.normalize_team_identity_part(name),
    public.normalize_team_identity_part(category),
    public.normalize_team_identity_part(level),
    public.normalize_team_identity_part(season)
  );

create or replace function public.protect_team_season_history()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if old.season is not distinct from new.season then
    return new;
  end if;

  if old.head_coach_id is not null
     or cardinality(coalesce(old.assistant_coach_ids, '{}'::uuid[])) > 0
     or exists (select 1 from public.team_memberships where team_id = old.id)
     or exists (select 1 from public.team_staff_assignments where team_id = old.id)
     or exists (select 1 from public.training_slots where team_id = old.id)
     or exists (select 1 from public.attendance_sessions where team_id = old.id)
     or exists (select 1 from public.sessions where team_id = old.id)
     or exists (select 1 from public.situations where team_id = old.id)
     or exists (select 1 from public.player_passports where current_team_id = old.id)
     or exists (select 1 from public.roster_import_batches where target_team_id = old.id) then
    raise exception 'La saison d’une équipe avec historique est immuable.'
      using errcode = 'PT409';
  end if;

  return new;
end;
$$;
alter function public.protect_team_season_history() owner to postgres;
revoke all on function public.protect_team_season_history() from public, anon, authenticated, service_role;

drop trigger if exists protect_team_season_history_trigger on public.teams;
create trigger protect_team_season_history_trigger
before update of season on public.teams
for each row execute function public.protect_team_season_history();

create or replace function public.create_team_season(
  target_name text,
  target_category text,
  target_level text,
  target_season text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  normalized_name text := regexp_replace(btrim(coalesce(target_name, '')), '[[:space:]]+', ' ', 'g');
  normalized_category text := regexp_replace(btrim(coalesce(target_category, '')), '[[:space:]]+', ' ', 'g');
  normalized_level text := regexp_replace(btrim(coalesce(target_level, '')), '[[:space:]]+', ' ', 'g');
  normalized_season text := btrim(coalesce(target_season, ''));
  existing_team_id uuid;
  saved_team_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  actor_role := public.current_user_role();
  if actor_role is null or actor_role not in ('admin', 'responsable_technique') then
    raise exception 'Création d’équipe interdite.' using errcode = '42501';
  end if;

  if normalized_name = '' or normalized_category = '' or normalized_level = '' then
    raise exception 'Nom, catégorie et niveau sont requis.' using errcode = '22023';
  end if;
  if normalized_season = '' or not public.is_canonical_team_season(normalized_season) then
    raise exception 'La saison doit respecter le format YYYY-YYYY avec deux années consécutives.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(concat_ws('|',
    public.normalize_team_identity_part(normalized_name),
    public.normalize_team_identity_part(normalized_category),
    public.normalize_team_identity_part(normalized_level),
    public.normalize_team_identity_part(normalized_season)
  ), 0));

  select id into existing_team_id
  from public.teams
  where public.normalize_team_identity_part(name) = public.normalize_team_identity_part(normalized_name)
    and public.normalize_team_identity_part(category) = public.normalize_team_identity_part(normalized_category)
    and public.normalize_team_identity_part(level) = public.normalize_team_identity_part(normalized_level)
    and public.normalize_team_identity_part(season) = public.normalize_team_identity_part(normalized_season)
  limit 1;

  if existing_team_id is not null then
    return jsonb_build_object('ok', true, 'created', false, 'status', 'ALREADY_EXISTS', 'team_id', existing_team_id);
  end if;

  begin
    insert into public.teams(name, category, level, season, created_by)
    values(normalized_name, normalized_category, normalized_level, normalized_season, auth.uid())
    returning id into saved_team_id;
  exception when unique_violation then
    select id into existing_team_id
    from public.teams
    where public.normalize_team_identity_part(name) = public.normalize_team_identity_part(normalized_name)
      and public.normalize_team_identity_part(category) = public.normalize_team_identity_part(normalized_category)
      and public.normalize_team_identity_part(level) = public.normalize_team_identity_part(normalized_level)
      and public.normalize_team_identity_part(season) = public.normalize_team_identity_part(normalized_season)
    limit 1;
    if existing_team_id is null then raise; end if;
    return jsonb_build_object('ok', true, 'created', false, 'status', 'ALREADY_EXISTS', 'team_id', existing_team_id);
  end;

  select id into saved_team_id from public.teams where id = saved_team_id;
  if saved_team_id is null then
    raise exception 'La création de l’équipe n’a pas été confirmée.' using errcode = 'P0002';
  end if;

  return jsonb_build_object('ok', true, 'created', true, 'status', 'CREATED', 'team_id', saved_team_id);
end;
$$;
alter function public.create_team_season(text, text, text, text) owner to postgres;
revoke all on function public.create_team_season(text, text, text, text) from public, anon, service_role;
grant execute on function public.create_team_season(text, text, text, text) to authenticated;

comment on function public.create_team_season(text, text, text, text) is
  'Crée de manière atomique et idempotente une équipe-saison pour un Admin ou Responsable technique actif.';

commit;
