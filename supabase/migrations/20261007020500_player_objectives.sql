-- N5 — canonical individual player objectives.
begin;

create table if not exists public.player_objectives (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  season text not null,
  title text not null,
  domain text not null,
  target_description text not null,
  observable_criterion text not null,
  quantifiable_criterion text null,
  deadline text null,
  status text not null default 'a_travailler' check (status in ('a_travailler','en_cours','valide','abandonne')),
  linked_session_ids text[] not null default '{}'::text[],
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists player_objectives_player_idx on public.player_objectives(player_id, season, updated_at desc);
alter table public.player_objectives enable row level security;
alter table public.player_objectives force row level security;
revoke all privileges on table public.player_objectives from public, anon, authenticated;

create or replace function public.read_player_objectives(target_player_id uuid, target_team_id uuid default null)
returns table (
  objective_id uuid, player_id uuid, team_id uuid, season text, title text, domain text,
  target_description text, observable_criterion text, quantifiable_criterion text, deadline text,
  status text, linked_session_ids text[], created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  if target_player_id is null then raise exception 'Joueur requis.' using errcode='22023'; end if;
  if not public.is_current_user_admin()
     and public.current_user_role() <> 'responsable_technique'
     and not public.can_access_current_player(target_player_id) then
    raise exception 'Lecture des objectifs interdite.' using errcode='42501';
  end if;
  return query select po.id, po.player_id, po.team_id, po.season, po.title, po.domain,
    po.target_description, po.observable_criterion, po.quantifiable_criterion, po.deadline,
    po.status, po.linked_session_ids, po.created_at, po.updated_at
  from public.player_objectives po
  where po.player_id=target_player_id and (target_team_id is null or po.team_id=target_team_id)
    and (public.is_current_user_admin() or public.current_user_role()='responsable_technique' or public.can_access_team(po.team_id))
  order by po.updated_at desc;
end $$;

alter function public.read_player_objectives(uuid, uuid) owner to postgres;
revoke all on function public.read_player_objectives(uuid, uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_player_objectives(uuid, uuid) to authenticated;

create or replace function public.save_player_objective(
  target_objective_id uuid, target_player_id uuid, target_team_id uuid, target_season text,
  target_title text, target_domain text, target_description text, target_observable_criterion text,
  target_quantifiable_criterion text, target_deadline text, target_status text, target_linked_session_ids text[]
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare result_id uuid := coalesce(target_objective_id, gen_random_uuid());
begin
  if not public.can_manage_player_evaluation(target_player_id,target_team_id) then
    raise exception 'Modification de l’objectif interdite.' using errcode='42501';
  end if;
  if coalesce(trim(target_title),'')='' or coalesce(trim(target_domain),'')='' or coalesce(trim(target_description),'')='' or coalesce(trim(target_observable_criterion),'')='' then
    raise exception 'Objectif incomplet.' using errcode='22023';
  end if;
  if target_status not in ('a_travailler','en_cours','valide','abandonne') then raise exception 'Statut objectif invalide.' using errcode='22023'; end if;

  insert into public.player_objectives(id,player_id,team_id,season,title,domain,target_description,observable_criterion,quantifiable_criterion,deadline,status,linked_session_ids,created_by,updated_by)
  values(result_id,target_player_id,target_team_id,trim(target_season),trim(target_title),trim(target_domain),trim(target_description),trim(target_observable_criterion),nullif(trim(target_quantifiable_criterion),''),nullif(trim(target_deadline),''),target_status,coalesce(target_linked_session_ids,'{}'::text[]),auth.uid(),auth.uid())
  on conflict(id) do update set
    title=excluded.title, domain=excluded.domain, target_description=excluded.target_description,
    observable_criterion=excluded.observable_criterion, quantifiable_criterion=excluded.quantifiable_criterion,
    deadline=excluded.deadline, status=excluded.status, linked_session_ids=excluded.linked_session_ids,
    updated_by=auth.uid(), updated_at=now()
  where public.player_objectives.player_id=target_player_id and public.player_objectives.team_id=target_team_id
  returning id into result_id;
  if result_id is null then raise exception 'Objectif incompatible avec ce joueur ou cette équipe.' using errcode='42501'; end if;
  return result_id;
end $$;

alter function public.save_player_objective(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text[]) owner to postgres;
revoke all on function public.save_player_objective(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text[]) from public, anon, authenticated, service_role;
grant execute on function public.save_player_objective(uuid, uuid, uuid, text, text, text, text, text, text, text, text, text[]) to authenticated;

commit;