-- N4 — persistent canonical player evaluations.
-- Evaluation content is stored as a versionable JSON document, while identity,
-- team, season and period remain relational and authorization-safe.

begin;

create table if not exists public.player_evaluations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  season text not null,
  period text not null,
  category text not null default '',
  evaluation_date date not null default current_date,
  content_json jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, team_id, season, period)
);

create index if not exists player_evaluations_player_season_idx
  on public.player_evaluations(player_id, season, updated_at desc);
create index if not exists player_evaluations_team_season_idx
  on public.player_evaluations(team_id, season, period);

alter table public.player_evaluations enable row level security;
alter table public.player_evaluations force row level security;
revoke all privileges on table public.player_evaluations from public, anon, authenticated;

create or replace function public.can_manage_player_evaluation(target_player_id uuid, target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and (
    public.is_current_user_admin()
    or public.current_user_role() = 'responsable_technique'
    or (
      public.current_user_role() = 'coach'
      and public.can_access_team(target_team_id)
      and exists (
        select 1 from public.team_memberships tm
        where tm.player_id = target_player_id
          and tm.team_id = target_team_id
          and tm.status = 'active'
      )
    )
  )
$$;

alter function public.can_manage_player_evaluation(uuid, uuid) owner to postgres;
revoke all on function public.can_manage_player_evaluation(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.can_manage_player_evaluation(uuid, uuid) to authenticated;

create or replace function public.read_player_evaluations(target_player_id uuid, target_team_id uuid default null)
returns table (
  evaluation_id uuid,
  player_id uuid,
  team_id uuid,
  season text,
  period text,
  category text,
  evaluation_date date,
  content_json jsonb,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  if target_player_id is null then raise exception 'Joueur requis.' using errcode = '22023'; end if;
  if not public.is_current_user_admin()
     and public.current_user_role() <> 'responsable_technique'
     and not public.can_access_current_player(target_player_id) then
    raise exception 'Lecture des évaluations interdite.' using errcode = '42501';
  end if;

  return query
  select pe.id, pe.player_id, pe.team_id, pe.season, pe.period, pe.category,
         pe.evaluation_date, pe.content_json, pe.created_by, pe.updated_by, pe.created_at, pe.updated_at
  from public.player_evaluations pe
  where pe.player_id = target_player_id
    and (target_team_id is null or pe.team_id = target_team_id)
    and (
      public.is_current_user_admin()
      or public.current_user_role() = 'responsable_technique'
      or public.can_access_team(pe.team_id)
    )
  order by pe.evaluation_date desc, pe.updated_at desc;
end
$$;

alter function public.read_player_evaluations(uuid, uuid) owner to postgres;
revoke all on function public.read_player_evaluations(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_player_evaluations(uuid, uuid) to authenticated;

create or replace function public.save_player_evaluation(
  target_player_id uuid,
  target_team_id uuid,
  target_season text,
  target_period text,
  target_category text,
  target_evaluation_date date,
  target_content_json jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare result_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  if target_player_id is null or target_team_id is null then raise exception 'Joueur et équipe requis.' using errcode = '22023'; end if;
  if coalesce(trim(target_season), '') = '' or coalesce(trim(target_period), '') = '' then raise exception 'Saison et période requises.' using errcode = '22023'; end if;
  if target_content_json is null or jsonb_typeof(target_content_json) <> 'object' then raise exception 'Contenu évaluation invalide.' using errcode = '22023'; end if;
  if not public.can_manage_player_evaluation(target_player_id, target_team_id) then
    raise exception 'Modification de l’évaluation interdite.' using errcode = '42501';
  end if;

  insert into public.player_evaluations (
    player_id, team_id, season, period, category, evaluation_date,
    content_json, created_by, updated_by
  ) values (
    target_player_id, target_team_id, trim(target_season), trim(target_period),
    coalesce(target_category, ''), coalesce(target_evaluation_date, current_date),
    target_content_json, auth.uid(), auth.uid()
  )
  on conflict (player_id, team_id, season, period) do update set
    category = excluded.category,
    evaluation_date = excluded.evaluation_date,
    content_json = excluded.content_json,
    updated_by = auth.uid(),
    updated_at = now()
  returning id into result_id;

  return result_id;
end
$$;

alter function public.save_player_evaluation(uuid, uuid, text, text, text, date, jsonb) owner to postgres;
revoke all on function public.save_player_evaluation(uuid, uuid, text, text, text, date, jsonb) from public, anon, authenticated, service_role;
grant execute on function public.save_player_evaluation(uuid, uuid, text, text, text, date, jsonb) to authenticated;

commit;
