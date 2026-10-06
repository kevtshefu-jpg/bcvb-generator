-- N6 — derive progression status from canonical evaluations/objectives.
begin;

drop function if exists public.read_player_progression_profile(uuid);
create function public.read_player_progression_profile(target_player_id uuid)
returns table (
  player_id uuid, first_name text, last_name text, player_category text,
  team_id uuid, team_name text, team_category text, season text,
  attendance_status text, evaluation_status text, objectives_status text, documents_status text,
  evaluation_count bigint, active_objective_count bigint, last_evaluation_date date,
  summary_json jsonb
)
language plpgsql stable security definer set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  if target_player_id is null then raise exception 'Joueur requis.' using errcode='22023'; end if;
  if not exists(select 1 from public.players p where p.id=target_player_id and p.archived_at is null and p.deleted_at is null) then
    raise exception 'Joueur introuvable.' using errcode='P0002';
  end if;
  if not public.is_current_user_admin() and public.current_user_role()<>'responsable_technique' and not public.can_access_current_player(target_player_id) then
    raise exception 'Lecture du suivi joueur interdite.' using errcode='42501';
  end if;

  return query
  select p.id,p.first_name,p.last_name,p.category,t.id,t.name,t.category,t.season,
    pp.attendance_status,
    case when count(distinct pe.id)>0 then 'ready' else 'to_link' end,
    case when count(distinct po.id) filter(where po.status in ('a_travailler','en_cours'))>0 then 'ready' else 'to_link' end,
    pp.documents_status,
    count(distinct pe.id),
    count(distinct po.id) filter(where po.status in ('a_travailler','en_cours')),
    max(pe.evaluation_date),
    coalesce(pp.summary_json,'{}'::jsonb)
  from public.players p
  join public.team_memberships tm on tm.player_id=p.id and tm.status='active'
  join public.teams t on t.id=tm.team_id and t.season=tm.season
  left join public.player_passports pp on pp.player_id=p.id and pp.current_team_id=t.id and pp.season=t.season
  left join public.player_evaluations pe on pe.player_id=p.id and pe.team_id=t.id and pe.season=t.season
  left join public.player_objectives po on po.player_id=p.id and po.team_id=t.id and po.season=t.season
  where p.id=target_player_id and p.archived_at is null and p.deleted_at is null
    and (public.is_current_user_admin() or public.current_user_role()='responsable_technique' or public.can_access_team(t.id))
  group by p.id,p.first_name,p.last_name,p.category,t.id,t.name,t.category,t.season,
    pp.attendance_status,pp.documents_status,pp.summary_json
  order by t.season desc,t.name
  limit 1;
end $$;

alter function public.read_player_progression_profile(uuid) owner to postgres;
revoke all on function public.read_player_progression_profile(uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_player_progression_profile(uuid) to authenticated;
commit;