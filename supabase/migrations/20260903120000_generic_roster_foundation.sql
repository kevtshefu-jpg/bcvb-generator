-- GO-LIVE 08C.24 — generic roster foundation.
-- This migration is fail-closed and never rewrites existing business data.

begin;

do $$
begin
  if exists (select 1 from public.players where btrim(first_name) = '') then
    raise exception 'M3 preflight: blank player first name.' using errcode = 'PT409';
  end if;
  if exists (select 1 from public.players where btrim(last_name) = '') then
    raise exception 'M3 preflight: blank player last name.' using errcode = 'PT409';
  end if;
  if exists (
    select 1 from public.players
    where license_number is not null and btrim(license_number) = ''
  ) then
    raise exception 'M3 preflight: blank non-null player license.' using errcode = 'PT409';
  end if;
  if exists (
    select 1
    from public.players
    where nullif(btrim(license_number), '') is not null
    group by upper(btrim(license_number))
    having count(*) > 1
  ) then
    raise exception 'M3 preflight: normalized player license collision.' using errcode = 'PT409';
  end if;
  if exists (
    select 1 from public.team_memberships
    where status is null or status not in ('active', 'inactive')
  ) then
    raise exception 'M3 preflight: invalid membership status.' using errcode = 'PT409';
  end if;
  if to_regclass('public.players_license_unique_idx') is null
     or to_regprocedure('public.add_or_reactivate_team_membership(uuid,uuid,text)') is null
     or to_regprocedure('public.deactivate_team_membership(uuid)') is null
     or not exists (
       select 1 from pg_constraint
       where conrelid = 'public.team_memberships'::regclass
         and conname = 'team_memberships_player_team_season_key'
     ) then
    raise exception 'M3 preflight: required M2 contract is missing.' using errcode = 'PT409';
  end if;
end;
$$;

create or replace function public.normalize_player_license(value text)
returns text
language sql
immutable
strict
set search_path = public, pg_temp
as $$
  select nullif(upper(btrim(value)), '')
$$;

create or replace function public.normalize_player_name_compare(value text)
returns text
language sql
immutable
strict
set search_path = public, pg_temp
as $$
  select lower(
    translate(
      regexp_replace(btrim(value), '[[:space:]]+', ' ', 'g'),
      U&'\2019\2018\02BC\2010\2011\2012\2013\2014',
      repeat(chr(39), 3) || repeat('-', 5)
    )
  )
$$;

alter function public.normalize_player_license(text) owner to postgres;
alter function public.normalize_player_name_compare(text) owner to postgres;
revoke all on function public.normalize_player_license(text) from public, anon, authenticated, service_role;
revoke all on function public.normalize_player_name_compare(text) from public, anon, authenticated, service_role;
-- Required for existing local/infrastructure service-role writes: PostgreSQL
-- evaluates this immutable function while maintaining the expression index.
grant execute on function public.normalize_player_license(text) to service_role;

alter table public.players
  add constraint players_first_name_nonblank_check check (btrim(first_name) <> ''),
  add constraint players_last_name_nonblank_check check (btrim(last_name) <> '');

create unique index players_license_normalized_unique_idx
  on public.players (public.normalize_player_license(license_number))
  where public.normalize_player_license(license_number) is not null;

drop index public.players_license_unique_idx;

alter table public.team_memberships
  add column status_changed_at timestamptz null,
  add column status_changed_by uuid null references auth.users(id) on delete set null;

create table public.player_roster_creation_operations (
  operation_id uuid primary key,
  request_fingerprint text not null,
  created_player_id uuid not null references public.players(id) on delete restrict,
  result_match_state text not null check (result_match_state in ('NO_MATCH', 'AMBIGUOUS')),
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table public.player_identity_decisions (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null unique
    references public.player_roster_creation_operations(operation_id) on delete restrict,
  created_player_id uuid not null references public.players(id) on delete restrict,
  acknowledged_candidate_ids uuid[] not null,
  decision text not null check (decision = 'DISTINCT_PERSON'),
  reason text not null check (btrim(reason) <> ''),
  decided_by uuid not null,
  decided_at timestamptz not null default now(),
  check (cardinality(acknowledged_candidate_ids) > 0)
);

alter table public.player_roster_creation_operations enable row level security;
alter table public.player_roster_creation_operations force row level security;
alter table public.player_identity_decisions enable row level security;
alter table public.player_identity_decisions force row level security;

revoke all on table public.player_roster_creation_operations from public, anon, authenticated, service_role;
revoke all on table public.player_identity_decisions from public, anon, authenticated, service_role;

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

  select * into target_team from public.teams t where t.id = target_team_id;
  if target_team.id is null or target_team.archived_at is not null then
    raise exception 'Équipe introuvable ou archivée.' using errcode = '22023';
  end if;
  if target_team.season is distinct from target_season then
    raise exception 'La saison du membership ne correspond pas à celle de l’équipe.' using errcode = '22023';
  end if;

  select * into target_player from public.players p where p.id = target_player_id;
  if target_player.id is null
     or target_player.archived_at is not null
     or target_player.deleted_at is not null then
    raise exception 'Joueur introuvable, archivé ou supprimé.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    concat_ws('|', target_player_id::text, target_team_id::text, target_season), 0
  ));

  select * into current_membership
  from public.team_memberships tm
  where tm.player_id = target_player_id
    and tm.team_id = target_team_id
    and tm.season = target_season
  for update;

  if current_membership.id is null then
    insert into public.team_memberships (player_id, team_id, season, status, created_by)
    values (target_player_id, target_team_id, target_season, 'active', auth.uid())
    returning id, team_memberships.status into membership_id, status;
    changed := true;
  elsif current_membership.status = 'inactive' then
    update public.team_memberships tm
    set status = 'active', status_changed_at = now(), status_changed_by = auth.uid()
    where tm.id = current_membership.id
    returning tm.id, tm.status into membership_id, status;
    changed := true;
  else
    membership_id := current_membership.id;
    status := current_membership.status;
    changed := false;
  end if;

  return next;
end;
$$;

create or replace function public.deactivate_team_membership(target_membership_id uuid)
returns table (membership_id uuid, status text, changed boolean)
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
    set status = 'inactive', status_changed_at = now(), status_changed_by = auth.uid()
    where tm.id = current_membership.id
    returning tm.id, tm.status into membership_id, status;
    changed := true;
  end if;

  return next;
end;
$$;

create or replace function public.search_players_for_roster(
  target_first_name text default null,
  target_last_name text default null,
  target_license_number text default null,
  target_birth_date date default null,
  result_limit integer default 20
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_first text := public.normalize_player_name_compare(nullif(target_first_name, ''));
  normalized_last text := public.normalize_player_name_compare(nullif(target_last_name, ''));
  normalized_license text := public.normalize_player_license(target_license_number);
  candidate_count integer;
  exact_count integer;
  ambiguous_count integer;
  deleted_conflict boolean;
  match_state text;
  candidates jsonb;
begin
  if auth.uid() is null
     or coalesce(public.current_user_role(), '') not in ('admin', 'responsable_technique') then
    raise exception 'Recherche de joueurs interdite.' using errcode = '42501';
  end if;
  if length(coalesce(target_first_name, '')) > 200
     or length(coalesce(target_last_name, '')) > 200
     or length(coalesce(target_license_number, '')) > 100
     or result_limit is null or result_limit < 1 or result_limit > 50 then
    raise exception 'Paramètres de recherche invalides.' using errcode = '22023';
  end if;
  if normalized_license is null and (normalized_first is null or normalized_last is null
     or normalized_first = '' or normalized_last = '') then
    raise exception 'Licence ou prénom et nom requis.' using errcode = '22023';
  end if;

  with matched as (
    select
      p.*,
      normalized_license is not null
        and public.normalize_player_license(p.license_number) = normalized_license as license_match,
      case
        when normalized_license is not null
          and public.normalize_player_license(p.license_number) = normalized_license
          and (normalized_first is null or public.normalize_player_name_compare(p.first_name) = normalized_first)
          and (normalized_last is null or public.normalize_player_name_compare(p.last_name) = normalized_last)
          and (target_birth_date is null or p.birth_date = target_birth_date)
          then 'EXACT'
        when normalized_license is not null
          and public.normalize_player_license(p.license_number) = normalized_license
          then 'AMBIGUOUS'
        else 'PROBABLE'
      end as classification
    from public.players p
    where p.deleted_at is null
      and (
        (normalized_license is not null and public.normalize_player_license(p.license_number) = normalized_license)
        or (
          normalized_first is not null and normalized_last is not null
          and public.normalize_player_name_compare(p.first_name) = normalized_first
          and public.normalize_player_name_compare(p.last_name) = normalized_last
        )
      )
  ), limited as (
    select * from matched
    order by case classification when 'EXACT' then 1 when 'AMBIGUOUS' then 2 else 3 end,
      public.normalize_player_name_compare(last_name),
      public.normalize_player_name_compare(first_name), id
    limit result_limit
  )
  select
    (select count(*) from matched),
    (select count(*) from matched where classification = 'EXACT'),
    (select count(*) from matched where classification = 'AMBIGUOUS'),
    coalesce(jsonb_agg(jsonb_build_object(
      'player_id', l.id,
      'first_name', l.first_name,
      'last_name', l.last_name,
      'birth_year', case when l.birth_date is null then null else extract(year from l.birth_date)::integer end,
      'license_hint', case
        when public.normalize_player_license(l.license_number) is null then null
        when length(public.normalize_player_license(l.license_number)) <= 4
          then repeat('•', length(public.normalize_player_license(l.license_number)))
        else repeat('•', length(public.normalize_player_license(l.license_number)) - 4)
          || right(public.normalize_player_license(l.license_number), 4)
      end,
      'exact_license_match', l.license_match,
      'archived', l.archived_at is not null,
      'active_memberships', coalesce((
        select jsonb_agg(jsonb_build_object(
          'team_id', t.id, 'team_name', t.name, 'season', tm.season
        ) order by tm.season, t.name, t.id)
        from public.team_memberships tm
        join public.teams t on t.id = tm.team_id
        where tm.player_id = l.id and tm.status = 'active'
      ), '[]'::jsonb),
      'classification', l.classification,
      'reasons', case l.classification
        when 'EXACT' then jsonb_build_array('LICENSE_AND_PROVIDED_IDENTITY_COHERENT')
        when 'AMBIGUOUS' then jsonb_build_array('LICENSE_IDENTITY_CONFLICT')
        when 'PROBABLE' then case
          when target_birth_date is not null and l.birth_date = target_birth_date
            then jsonb_build_array('NAME_AND_BIRTH_DATE_MATCH')
          else jsonb_build_array('NAME_MATCH_REQUIRES_REVIEW')
        end
      end
    ) order by case l.classification when 'EXACT' then 1 when 'AMBIGUOUS' then 2 else 3 end,
      public.normalize_player_name_compare(l.last_name),
      public.normalize_player_name_compare(l.first_name), l.id), '[]'::jsonb)
  into candidate_count, exact_count, ambiguous_count, candidates
  from limited l;

  select exists (
    select 1 from public.players p
    where p.deleted_at is not null
      and (
        (normalized_license is not null and public.normalize_player_license(p.license_number) = normalized_license)
        or (
          normalized_first is not null and normalized_last is not null
          and public.normalize_player_name_compare(p.first_name) = normalized_first
          and public.normalize_player_name_compare(p.last_name) = normalized_last
          and (target_birth_date is null or p.birth_date = target_birth_date)
        )
      )
  ) into deleted_conflict;

  match_state := case
    when deleted_conflict or ambiguous_count > 0 then 'AMBIGUOUS'
    when exact_count = 1 then 'EXACT'
    when exact_count > 1 or candidate_count > 1 then 'AMBIGUOUS'
    when candidate_count = 1 then 'PROBABLE'
    else 'NO_MATCH'
  end;

  return jsonb_build_object('match_state', match_state, 'candidates', candidates);
end;
$$;

create or replace function public.create_player_for_roster(
  operation_id uuid,
  target_first_name text,
  target_last_name text,
  target_birth_date date default null,
  target_gender text default null,
  target_category text default null,
  target_height_cm integer default null,
  target_position text default null,
  target_license_number text default null,
  target_license_status text default null,
  confirm_distinct_person boolean default false,
  acknowledged_candidate_ids uuid[] default '{}'::uuid[],
  distinct_person_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  normalized_first text;
  normalized_last text;
  normalized_license text;
  stored_first text;
  stored_last text;
  fingerprint text;
  existing_operation public.player_roster_creation_operations%rowtype;
  matching_license public.players%rowtype;
  deleted_conflict boolean;
  current_candidate_ids uuid[];
  requested_candidate_ids uuid[];
  saved_player_id uuid;
begin
  if auth.uid() is null
     or coalesce(public.current_user_role(), '') not in ('admin', 'responsable_technique') then
    raise exception 'Création de joueur interdite.' using errcode = '42501';
  end if;
  if operation_id is null then
    raise exception 'Identifiant d’opération requis.' using errcode = '22023';
  end if;
  if target_first_name is null or target_last_name is null
     or btrim(target_first_name) = '' or btrim(target_last_name) = ''
     or length(target_first_name) > 200 or length(target_last_name) > 200
     or length(coalesce(target_license_number, '')) > 100 then
    raise exception 'Prénom et nom non vides requis.' using errcode = '22023';
  end if;

  stored_first := regexp_replace(btrim(target_first_name), '[[:space:]]+', ' ', 'g');
  stored_last := regexp_replace(btrim(target_last_name), '[[:space:]]+', ' ', 'g');
  normalized_first := public.normalize_player_name_compare(stored_first);
  normalized_last := public.normalize_player_name_compare(stored_last);
  normalized_license := public.normalize_player_license(target_license_number);
  requested_candidate_ids := array(
    select distinct candidate_id
    from unnest(coalesce(acknowledged_candidate_ids, '{}'::uuid[])) candidate_id
    order by candidate_id
  );
  fingerprint := encode(extensions.digest(jsonb_build_object(
    'first_name', stored_first,
    'last_name', stored_last,
    'birth_date', target_birth_date,
    'gender', target_gender,
    'category', target_category,
    'height_cm', target_height_cm,
    'position', target_position,
    'license_number', normalized_license,
    'license_status', target_license_status,
    'confirm_distinct_person', coalesce(confirm_distinct_person, false),
    'acknowledged_candidate_ids', requested_candidate_ids,
    'distinct_person_reason', nullif(btrim(distinct_person_reason), '')
  )::text, 'sha256'), 'hex');

  perform pg_advisory_xact_lock(hashtextextended('roster-operation|' || operation_id::text, 0));
  select * into existing_operation
  from public.player_roster_creation_operations o
  where o.operation_id = create_player_for_roster.operation_id;
  if existing_operation.operation_id is not null then
    if existing_operation.request_fingerprint is distinct from fingerprint
       or existing_operation.created_by is distinct from auth.uid() then
      raise exception 'Identifiant d’opération déjà utilisé avec une autre requête.' using errcode = 'PT409';
    end if;
    return jsonb_build_object(
      'status', 'CREATED', 'player_id', existing_operation.created_player_id,
      'match_state', existing_operation.result_match_state, 'idempotent_replay', true
    );
  end if;

  perform pg_advisory_xact_lock(hashtextextended(
    case
      when normalized_license is not null then 'player-license|' || normalized_license
      else concat_ws('|', 'player-name-dob', normalized_first, normalized_last, coalesce(target_birth_date::text, ''))
    end, 0
  ));

  if normalized_license is not null then
    select * into matching_license
    from public.players p
    where public.normalize_player_license(p.license_number) = normalized_license
    order by p.id
    limit 1;

    if matching_license.id is not null then
      return jsonb_build_object(
        'status', 'CONFLICT',
        'player_id', null,
        'match_state', case
          when matching_license.deleted_at is null
            and public.normalize_player_name_compare(matching_license.first_name) = normalized_first
            and public.normalize_player_name_compare(matching_license.last_name) = normalized_last
            and (target_birth_date is null or matching_license.birth_date = target_birth_date)
          then 'EXACT' else 'AMBIGUOUS' end,
        'candidate_ids', case when matching_license.deleted_at is null
          then jsonb_build_array(matching_license.id) else '[]'::jsonb end
      );
    end if;
  end if;

  select exists (
    select 1 from public.players p
    where p.deleted_at is not null
      and public.normalize_player_name_compare(p.first_name) = normalized_first
      and public.normalize_player_name_compare(p.last_name) = normalized_last
      and (target_birth_date is null or p.birth_date = target_birth_date)
  ) into deleted_conflict;
  if deleted_conflict then
    return jsonb_build_object(
      'status', 'CONFLICT', 'player_id', null,
      'match_state', 'AMBIGUOUS', 'candidate_ids', '[]'::jsonb
    );
  end if;

  select coalesce(array_agg(p.id order by p.id), '{}'::uuid[])
  into current_candidate_ids
  from public.players p
  where p.deleted_at is null
    and public.normalize_player_name_compare(p.first_name) = normalized_first
    and public.normalize_player_name_compare(p.last_name) = normalized_last
    and (target_birth_date is null or p.birth_date = target_birth_date);

  if cardinality(current_candidate_ids) > 0 then
    if coalesce(confirm_distinct_person, false) is not true then
      return jsonb_build_object(
        'status', 'AMBIGUOUS', 'player_id', null,
        'match_state', 'AMBIGUOUS', 'candidate_ids', to_jsonb(current_candidate_ids)
      );
    end if;
    if cardinality(requested_candidate_ids) = 0
       or requested_candidate_ids is distinct from current_candidate_ids
       or nullif(btrim(distinct_person_reason), '') is null then
      raise exception 'La décision de personne distincte doit être renouvelée.' using errcode = 'PT409';
    end if;
  elsif coalesce(confirm_distinct_person, false) is true then
    raise exception 'Aucune ambiguïté actuelle ne justifie cette décision.' using errcode = '22023';
  end if;

  begin
    insert into public.players (
      first_name, last_name, birth_date, gender, category, height_cm,
      position, license_number, license_status, created_by
    ) values (
      stored_first, stored_last, target_birth_date, target_gender, target_category,
      target_height_cm, target_position, normalized_license, target_license_status, auth.uid()
    ) returning id into saved_player_id;
  exception when unique_violation then
    return jsonb_build_object(
      'status', 'CONFLICT', 'player_id', null,
      'match_state', 'EXACT', 'candidate_ids', '[]'::jsonb
    );
  end;

  insert into public.player_roster_creation_operations (
    operation_id, request_fingerprint, created_player_id, result_match_state, created_by
  ) values (
    operation_id, fingerprint, saved_player_id,
    case when cardinality(current_candidate_ids) > 0 then 'AMBIGUOUS' else 'NO_MATCH' end,
    auth.uid()
  );

  if cardinality(current_candidate_ids) > 0 then
    insert into public.player_identity_decisions (
      operation_id, created_player_id, acknowledged_candidate_ids,
      decision, reason, decided_by
    ) values (
      operation_id, saved_player_id, current_candidate_ids,
      'DISTINCT_PERSON', btrim(distinct_person_reason), auth.uid()
    );
  end if;

  return jsonb_build_object(
    'status', 'CREATED', 'player_id', saved_player_id,
    'match_state', case when cardinality(current_candidate_ids) > 0 then 'AMBIGUOUS' else 'NO_MATCH' end,
    'idempotent_replay', false
  );
end;
$$;

create or replace function public.get_roster_capabilities(target_team_id uuid)
returns table (
  can_view_roster boolean,
  can_manage_roster boolean,
  can_search_players boolean,
  can_create_player boolean,
  can_add_membership boolean,
  can_deactivate_membership boolean,
  can_archive_player boolean
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  team_active boolean;
  assigned boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;
  if target_team_id is null then
    raise exception 'Équipe requise.' using errcode = '22023';
  end if;

  select t.archived_at is null into team_active from public.teams t where t.id = target_team_id;
  if team_active is null then
    raise exception 'Équipe introuvable.' using errcode = 'P0002';
  end if;
  actor_role := public.current_user_role();
  if actor_role in ('coach', 'team_staff') then
    select exists (
      select 1 from public.team_staff_assignments tsa
      where tsa.team_id = target_team_id
        and tsa.profile_id = auth.uid()
        and tsa.is_active is true
        and (
          (actor_role = 'coach' and tsa.assignment_role in ('head_coach', 'assistant_coach'))
          or (actor_role = 'team_staff' and tsa.assignment_role = 'team_staff')
        )
    ) into assigned;
  end if;

  return query select
    coalesce(actor_role in ('admin', 'responsable_technique', 'dirigeant') or (team_active and assigned), false),
    coalesce(team_active and actor_role in ('admin', 'responsable_technique'), false),
    coalesce(actor_role in ('admin', 'responsable_technique'), false),
    coalesce(actor_role in ('admin', 'responsable_technique'), false),
    coalesce(team_active and actor_role in ('admin', 'responsable_technique'), false),
    coalesce(team_active and actor_role in ('admin', 'responsable_technique'), false),
    false;
end;
$$;

create or replace function public.read_team_roster(
  target_team_id uuid,
  include_inactive boolean default false
)
returns table (
  membership_id uuid,
  membership_status text,
  player_id uuid,
  first_name text,
  last_name text,
  player_category text,
  team_id uuid,
  team_name text,
  team_category text,
  season text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  assigned boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;
  if target_team_id is null then
    raise exception 'Équipe requise.' using errcode = '22023';
  end if;
  if not exists (select 1 from public.teams t where t.id = target_team_id) then
    raise exception 'Équipe introuvable.' using errcode = 'P0002';
  end if;

  actor_role := public.current_user_role();
  if actor_role in ('coach', 'team_staff') then
    select exists (
      select 1 from public.team_staff_assignments tsa
      where tsa.team_id = target_team_id
        and tsa.profile_id = auth.uid()
        and tsa.is_active is true
        and (
          (actor_role = 'coach' and tsa.assignment_role in ('head_coach', 'assistant_coach'))
          or (actor_role = 'team_staff' and tsa.assignment_role = 'team_staff')
        )
    ) into assigned;
  end if;

  if actor_role not in ('admin', 'responsable_technique', 'dirigeant') and not assigned then
    raise exception 'Lecture de l’effectif interdite.' using errcode = '42501';
  end if;
  if coalesce(include_inactive, false)
     and actor_role not in ('admin', 'responsable_technique') then
    raise exception 'Historique de l’effectif interdit.' using errcode = '42501';
  end if;

  return query
  select
    tm.id, tm.status, p.id, p.first_name, p.last_name, p.category,
    t.id, t.name, t.category, t.season
  from public.team_memberships tm
  join public.players p on p.id = tm.player_id
  join public.teams t on t.id = tm.team_id and t.season = tm.season
  where tm.team_id = target_team_id
    and (coalesce(include_inactive, false) or tm.status = 'active')
    and p.archived_at is null
    and p.deleted_at is null
  order by public.normalize_player_name_compare(p.last_name),
    public.normalize_player_name_compare(p.first_name), p.id;
end;
$$;

alter function public.add_or_reactivate_team_membership(uuid, uuid, text) owner to postgres;
alter function public.deactivate_team_membership(uuid) owner to postgres;
alter function public.search_players_for_roster(text, text, text, date, integer) owner to postgres;
alter function public.create_player_for_roster(uuid, text, text, date, text, text, integer, text, text, text, boolean, uuid[], text) owner to postgres;
alter function public.get_roster_capabilities(uuid) owner to postgres;
alter function public.read_team_roster(uuid, boolean) owner to postgres;

revoke all on function public.add_or_reactivate_team_membership(uuid, uuid, text) from public, anon, authenticated, service_role;
revoke all on function public.deactivate_team_membership(uuid) from public, anon, authenticated, service_role;
revoke all on function public.search_players_for_roster(text, text, text, date, integer) from public, anon, authenticated, service_role;
revoke all on function public.create_player_for_roster(uuid, text, text, date, text, text, integer, text, text, text, boolean, uuid[], text) from public, anon, authenticated, service_role;
revoke all on function public.get_roster_capabilities(uuid) from public, anon, authenticated, service_role;
revoke all on function public.read_team_roster(uuid, boolean) from public, anon, authenticated, service_role;

grant execute on function public.add_or_reactivate_team_membership(uuid, uuid, text) to authenticated;
grant execute on function public.deactivate_team_membership(uuid) to authenticated;
grant execute on function public.search_players_for_roster(text, text, text, date, integer) to authenticated;
grant execute on function public.create_player_for_roster(uuid, text, text, date, text, text, integer, text, text, text, boolean, uuid[], text) to authenticated;
grant execute on function public.get_roster_capabilities(uuid) to authenticated;
grant execute on function public.read_team_roster(uuid, boolean) to authenticated;

do $$
begin
  if to_regclass('public.players_license_unique_idx') is not null
     or to_regclass('public.players_license_normalized_unique_idx') is null then
    raise exception 'M3 validation: canonical license index mismatch.' using errcode = 'PT409';
  end if;
  if has_table_privilege('authenticated', 'public.players', 'INSERT')
     or has_table_privilege('authenticated', 'public.players', 'UPDATE')
     or has_table_privilege('authenticated', 'public.players', 'DELETE')
     or has_table_privilege('authenticated', 'public.team_memberships', 'INSERT')
     or has_table_privilege('authenticated', 'public.team_memberships', 'UPDATE')
     or has_table_privilege('authenticated', 'public.team_memberships', 'DELETE')
     or has_table_privilege('authenticated', 'public.player_identity_decisions', 'SELECT')
     or has_table_privilege('authenticated', 'public.player_roster_creation_operations', 'SELECT') then
    raise exception 'M3 validation: forbidden direct privilege detected.' using errcode = 'PT409';
  end if;
  if has_function_privilege('public', 'public.search_players_for_roster(text,text,text,date,integer)', 'EXECUTE')
     or has_function_privilege('anon', 'public.search_players_for_roster(text,text,text,date,integer)', 'EXECUTE')
     or has_function_privilege('service_role', 'public.search_players_for_roster(text,text,text,date,integer)', 'EXECUTE')
     or not has_function_privilege('authenticated', 'public.search_players_for_roster(text,text,text,date,integer)', 'EXECUTE') then
    raise exception 'M3 validation: search RPC ACL mismatch.' using errcode = 'PT409';
  end if;
end;
$$;

commit;
