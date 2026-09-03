-- GO-LIVE 08C.18 — current-player authorization and least-privilege grants.
-- This migration changes authorization only. It does not mutate business data.

begin;

create or replace function public.can_access_current_player(target_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when target_player_id is null or auth.uid() is null then false
    when public.current_user_role() not in ('coach', 'team_staff', 'parent_referent') then false
    else exists (
      select 1
      from public.team_memberships tm
      where tm.player_id = target_player_id
        and tm.status = 'active'
        and public.can_access_team(tm.team_id)
    )
  end
$$;

alter function public.can_access_current_player(uuid) owner to postgres;
revoke all on function public.can_access_current_player(uuid) from public, anon, authenticated, service_role;
grant execute on function public.can_access_current_player(uuid) to authenticated;

drop policy if exists players_select_scope on public.players;
drop policy if exists players_insert_scope on public.players;
drop policy if exists players_update_scope on public.players;
drop policy if exists players_admin_delete on public.players;

create policy players_select_current_scope on public.players
for select to authenticated
using (
  public.is_current_user_admin()
  or public.can_access_current_player(id)
);

-- These policies are defense in depth. Runtime authenticated clients receive
-- no raw INSERT/UPDATE/DELETE table privileges below.
create policy players_admin_insert_scope on public.players
for insert to authenticated
with check (public.is_current_user_admin());

create policy players_admin_update_scope on public.players
for update to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

drop policy if exists player_contacts_select_scope on public.player_contacts;
drop policy if exists player_contacts_write_scope on public.player_contacts;

create policy player_contacts_admin_select_scope on public.player_contacts
for select to authenticated
using (public.is_current_user_admin());

create or replace function public.read_player_contacts_admin(target_player_id uuid)
returns table (
  id uuid,
  player_id uuid,
  parent_1_name text,
  parent_2_name text,
  parent_1_phone text,
  parent_2_phone text,
  parent_1_email text,
  parent_2_email text,
  emergency_phone text,
  parent_referent text,
  visibility text,
  created_by uuid,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Accès administratif requis.' using errcode = '42501';
  end if;

  if target_player_id is null then
    raise exception 'Identifiant joueur requis.' using errcode = '22023';
  end if;

  return query
  select
    pc.id,
    pc.player_id,
    pc.parent_1_name,
    pc.parent_2_name,
    pc.parent_1_phone,
    pc.parent_2_phone,
    pc.parent_1_email,
    pc.parent_2_email,
    pc.emergency_phone,
    pc.parent_referent,
    pc.visibility,
    pc.created_by,
    pc.created_at,
    pc.updated_at
  from public.player_contacts pc
  where pc.player_id = target_player_id
  order by pc.created_at, pc.id;
end
$$;

alter function public.read_player_contacts_admin(uuid) owner to postgres;
revoke all on function public.read_player_contacts_admin(uuid) from public, anon, authenticated, service_role;
grant execute on function public.read_player_contacts_admin(uuid) to authenticated;

alter table public.players enable row level security;
alter table public.players force row level security;
alter table public.player_contacts enable row level security;
alter table public.player_contacts force row level security;

revoke all privileges on table public.players from anon;
revoke all privileges on table public.player_contacts from anon;

revoke all privileges on table public.players from authenticated;
grant select on table public.players to authenticated;

revoke all privileges on table public.player_contacts from authenticated;

revoke truncate, references, trigger on table public.players from service_role;
revoke truncate, references, trigger on table public.player_contacts from service_role;

commit;
