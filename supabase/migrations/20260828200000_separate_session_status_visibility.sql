-- GO-03D.5 — la visibilité ne diffuse un contenu qu'une fois publié.
-- Le workflow de transition reste volontairement hors migration tant que les
-- rôles de validation/publication team, club et public ne sont pas arbitrés.
begin;

create or replace function public.can_read_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.sessions s
    where s.id = target_session_id
      and public.current_user_role() <> 'inactive'
      and (
        public.is_current_user_admin()
        or (
          public.current_user_role() = 'coach'
          and auth.uid() in (s.owner_id, s.coach_id)
        )
        or (
          s.status = 'published'
          and (
            (s.visibility = 'team' and public.can_access_team(s.team_id))
            or s.visibility in ('club', 'public')
          )
        )
      )
  ), false)
$$;

create or replace function public.can_read_situation(target_situation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.situations s
    where s.id = target_situation_id
      and public.current_user_role() <> 'inactive'
      and (
        public.is_current_user_admin()
        or (
          public.current_user_role() = 'coach'
          and auth.uid() in (s.owner_id, s.created_by)
        )
        or (
          s.status = 'published'
          and (
            (s.visibility = 'team' and public.can_access_team(s.team_id))
            or s.visibility in ('club', 'public')
          )
        )
      )
  ), false)
$$;

alter function public.can_read_session(uuid) owner to postgres;
alter function public.can_read_situation(uuid) owner to postgres;
revoke all on function public.can_read_session(uuid) from public, anon;
revoke all on function public.can_read_situation(uuid) from public, anon;
grant execute on function public.can_read_session(uuid) to authenticated, service_role;
grant execute on function public.can_read_situation(uuid) to authenticated, service_role;

commit;
