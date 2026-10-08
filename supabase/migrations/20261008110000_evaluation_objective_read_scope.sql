-- P10.7: use the existing fail-closed player/team scope for detailed reads.
-- No new roles, no family distribution, no changes to writes or stored content.
begin;

create or replace function public.read_player_evaluations(target_player_id uuid, target_team_id uuid default null)
returns table (
  evaluation_id uuid, player_id uuid, team_id uuid, season text, period text,
  category text, evaluation_date date, content_json jsonb, created_by uuid,
  updated_by uuid, created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.can_read_player_performance_scope(target_player_id, target_team_id) is not true then
    raise exception 'Lecture des évaluations interdite.' using errcode = '42501';
  end if;
  return query
    select pe.id, pe.player_id, pe.team_id, pe.season, pe.period, pe.category,
      pe.evaluation_date, pe.content_json, pe.created_by, pe.updated_by, pe.created_at, pe.updated_at
    from public.player_evaluations pe
    where pe.player_id = target_player_id and pe.team_id = target_team_id
    order by pe.evaluation_date desc, pe.updated_at desc;
end $$;

create or replace function public.read_player_objectives(target_player_id uuid, target_team_id uuid default null)
returns table (
  objective_id uuid, player_id uuid, team_id uuid, season text, title text, domain text,
  target_description text, observable_criterion text, quantifiable_criterion text,
  deadline text, status text, linked_session_ids text[], created_at timestamptz, updated_at timestamptz
)
language plpgsql stable security definer set search_path = public, pg_temp as $$
begin
  if public.can_read_player_performance_scope(target_player_id, target_team_id) is not true then
    raise exception 'Lecture des objectifs interdite.' using errcode = '42501';
  end if;
  return query
    select po.id, po.player_id, po.team_id, po.season, po.title, po.domain,
      po.target_description, po.observable_criterion, po.quantifiable_criterion,
      po.deadline, po.status, po.linked_session_ids, po.created_at, po.updated_at
    from public.player_objectives po
    where po.player_id = target_player_id and po.team_id = target_team_id
    order by po.updated_at desc;
end $$;

alter function public.read_player_evaluations(uuid,uuid) owner to postgres;
alter function public.read_player_objectives(uuid,uuid) owner to postgres;
revoke all on function public.read_player_evaluations(uuid,uuid) from public, anon, authenticated, service_role;
revoke all on function public.read_player_objectives(uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_player_evaluations(uuid,uuid) to authenticated;
grant execute on function public.read_player_objectives(uuid,uuid) to authenticated;
commit;
