-- BCVB — Durcissement des autorisations.
-- Cette migration remplace les politiques permissives par une sécurité fondée
-- sur le rôle actif et l'affectation explicite aux équipes.

begin;

create table if not exists public.team_staff_assignments (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  assignment_role text not null default 'team_staff'
    check (assignment_role in ('head_coach', 'assistant_coach', 'team_staff', 'parent_referent')),
  is_active boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (team_id, profile_id, assignment_role)
);

create index if not exists team_staff_assignments_profile_idx
  on public.team_staff_assignments(profile_id, is_active);
create index if not exists team_staff_assignments_team_idx
  on public.team_staff_assignments(team_id, is_active);

-- Une situation doit pouvoir être isolée par équipe même lorsqu'elle n'est pas
-- encore rattachée à une séance. Les anciennes situations liées héritent de
-- l'équipe de leur séance.
alter table public.situations
  add column if not exists team_id uuid null references public.teams(id) on delete set null;

alter table public.registration_requests
  add column if not exists notification_sent_at timestamptz null;

update public.situations si
set team_id = s.team_id
from public.sessions s
where si.session_id = s.id
  and si.team_id is null
  and s.team_id is not null;

create index if not exists situations_team_idx on public.situations(team_id);

-- Reprend les affectations déjà portées par teams sans inventer de comptes.
insert into public.team_staff_assignments (team_id, profile_id, assignment_role, created_by)
select t.id, t.head_coach_id, 'head_coach', null
from public.teams t
join public.profiles p on p.id = t.head_coach_id
where t.head_coach_id is not null
on conflict (team_id, profile_id, assignment_role) do nothing;

insert into public.team_staff_assignments (team_id, profile_id, assignment_role, created_by)
select t.id, assistant_id, 'assistant_coach', null
from public.teams t
cross join lateral unnest(coalesce(t.assistant_coach_ids, '{}'::uuid[])) assistant_id
join public.profiles p on p.id = assistant_id
on conflict (team_id, profile_id, assignment_role) do nothing;

-- Ces helpers s'exécutent hors RLS pour éviter toute récursion sur profiles.
-- Ils n'acceptent aucun identifiant utilisateur fourni par le client.
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when p.is_active is true and coalesce(p.profile_status, 'active') = 'active'
      then case
        when lower(coalesce(p.role, 'member')) = 'technical_manager' then 'responsable_technique'
        when lower(coalesce(p.role, 'member')) = 'membre' then 'member'
        else lower(coalesce(p.role, 'member'))
      end
    else 'inactive'
  end
  from public.profiles p
  where p.id = auth.uid()
  limit 1
$$;
alter function public.current_user_role() owner to postgres;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.current_user_role() in ('admin', 'responsable_technique'), false)
$$;
alter function public.is_current_user_admin() owner to postgres;

create or replace function public.is_current_user_club_leader()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(public.current_user_role() in ('admin', 'responsable_technique', 'dirigeant'), false)
$$;
alter function public.is_current_user_club_leader() owner to postgres;

create or replace function public.can_access_team(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when target_team_id is null or auth.uid() is null then false
    when public.is_current_user_club_leader() then true
    when public.current_user_role() not in ('coach', 'team_staff', 'parent_referent') then false
    else exists (
      select 1
      from public.teams t
      where t.id = target_team_id
        and (
          t.head_coach_id = auth.uid()
          or auth.uid() = any(coalesce(t.assistant_coach_ids, '{}'::uuid[]))
          or exists (
            select 1
            from public.team_staff_assignments tsa
            where tsa.team_id = t.id
              and tsa.profile_id = auth.uid()
              and tsa.is_active is true
          )
        )
    )
  end
$$;
alter function public.can_access_team(uuid) owner to postgres;

revoke all on function public.current_user_role() from public, anon;
revoke all on function public.is_current_user_admin() from public, anon;
revoke all on function public.is_current_user_club_leader() from public, anon;
revoke all on function public.can_access_team(uuid) from public, anon;
grant execute on function public.current_user_role() to authenticated, service_role;
grant execute on function public.is_current_user_admin() to authenticated, service_role;
grant execute on function public.is_current_user_club_leader() to authenticated, service_role;
grant execute on function public.can_access_team(uuid) to authenticated, service_role;

-- Diagnostic administrateur : équipes qui n'ont aucun staff actif et dont le
-- profil est lui-même actif. La vérification est interne à la fonction.
create or replace function public.list_teams_without_active_staff()
returns table (id uuid, name text, category text, season text)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;

  return query
  select t.id, t.name, t.category, t.season
  from public.teams t
  where not exists (
    select 1
    from public.team_staff_assignments tsa
    join public.profiles p on p.id = tsa.profile_id
    where tsa.team_id = t.id
      and tsa.is_active is true
      and p.is_active is true
      and coalesce(p.profile_status, 'active') = 'active'
      and lower(coalesce(p.role, 'member')) in (
        'coach', 'team_staff', 'parent_referent', 'responsable_technique', 'technical_manager', 'admin'
      )
  )
  order by t.name;
end;
$$;
alter function public.list_teams_without_active_staff() owner to postgres;

revoke all on function public.list_teams_without_active_staff() from public, anon;
grant execute on function public.list_teams_without_active_staff() to authenticated, service_role;

-- Empêche un membre de modifier ses droits même si une future policy est élargie.
create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is not null
     and not public.is_current_user_admin()
     and (
       new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.profile_status is distinct from old.profile_status
       or new.category_id is distinct from old.category_id
     ) then
    raise exception 'Modification des droits du profil interdite.' using errcode = '42501';
  end if;
  return new;
end;
$$;
alter function public.protect_profile_security_fields() owner to postgres;

drop trigger if exists protect_profile_security_fields_trigger on public.profiles;
create trigger protect_profile_security_fields_trigger
before update on public.profiles
for each row execute function public.protect_profile_security_fields();

revoke all on function public.protect_profile_security_fields() from public, anon, authenticated;

-- Supprime toutes les anciennes policies des tables prises en charge afin
-- qu'une policy permissive historique ne puisse pas annuler le durcissement.
do $$
declare
  secured_table text;
  existing_policy record;
begin
  foreach secured_table in array array[
    'profiles', 'registration_requests', 'profile_requests',
    'admin_notifications', 'admin_notification_preferences',
    'teams', 'team_staff_assignments', 'players', 'team_memberships',
    'player_contacts', 'player_passports', 'roster_import_batches',
    'player_duplicate_candidates', 'sessions', 'session_situations',
    'session_tags', 'session_files', 'session_visibility_logs',
    'situations', 'situation_tags', 'session_imports',
    'ai_expert_modes', 'document_ai_results', 'email_events'
  ] loop
    if to_regclass(format('public.%I', secured_table)) is not null then
      execute format('alter table public.%I enable row level security', secured_table);
      execute format('alter table public.%I force row level security', secured_table);
      for existing_policy in
        select policyname from pg_policies
        where schemaname = 'public' and tablename = secured_table
      loop
        execute format('drop policy if exists %I on public.%I', existing_policy.policyname, secured_table);
      end loop;
    end if;
  end loop;
end
$$;

-- Tables historiques IA/email : lecture administrative, propriétaire lorsque
-- le schéma expose une relation fiable, et aucune écriture authenticated.
do $$
declare
  direct_owner_column text;
  document_owner_column text;
  owner_predicate text;
begin
  if to_regclass('public.ai_expert_modes') is not null then
    execute 'create policy ai_expert_modes_admin_read on public.ai_expert_modes for select to authenticated using (public.is_current_user_admin())';
  end if;

  if to_regclass('public.email_events') is not null then
    execute 'create policy email_events_admin_read on public.email_events for select to authenticated using (public.is_current_user_admin())';
    -- Les Edge Functions utilisent service_role. Aucun droit d'écriture n'est
    -- accordé aux utilisateurs authentifiés, y compris aux admins.
  end if;

  if to_regclass('public.document_ai_results') is not null then
    select c.column_name into direct_owner_column
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'document_ai_results'
      and c.column_name in ('owner_id', 'user_id', 'created_by', 'requested_by')
      and c.udt_name = 'uuid'
    order by array_position(array['owner_id', 'user_id', 'created_by', 'requested_by'], c.column_name)
    limit 1;

    if direct_owner_column is not null then
      owner_predicate := format('%I = auth.uid()', direct_owner_column);
    elsif exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'document_ai_results' and column_name = 'document_id'
    ) and to_regclass('public.library_documents') is not null then
      select c.column_name into document_owner_column
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'library_documents'
        and c.column_name in ('owner_id', 'user_id', 'created_by', 'author_id')
        and c.udt_name = 'uuid'
      order by array_position(array['owner_id', 'user_id', 'created_by', 'author_id'], c.column_name)
      limit 1;

      if document_owner_column is not null then
        owner_predicate := format(
          'exists (select 1 from public.library_documents d where d.id = document_ai_results.document_id and d.%I = auth.uid())',
          document_owner_column
        );
      end if;
    end if;

    if owner_predicate is null then
      raise notice 'document_ai_results sans propriétaire UUID exploitable : lecture admin uniquement.';
      execute 'create policy document_ai_results_admin_read on public.document_ai_results for select to authenticated using (public.is_current_user_admin())';
    else
      execute format(
        'create policy document_ai_results_owner_or_admin_read on public.document_ai_results for select to authenticated using (public.is_current_user_admin() or (%s))',
        owner_predicate
      );
    end if;
  end if;
end
$$;

-- Profils : chacun lit et corrige son identité; seuls les rôles élevés gèrent les droits.
create policy profiles_select_own_or_admin on public.profiles
for select to authenticated
using (id = auth.uid() or public.is_current_user_admin());

create policy profiles_update_own_identity on public.profiles
for update to authenticated
using (id = auth.uid() and is_active is true)
with check (id = auth.uid());

create policy profiles_admin_insert on public.profiles
for insert to authenticated
with check (public.is_current_user_admin());

create policy profiles_admin_update on public.profiles
for update to authenticated
using (public.is_current_user_admin())
with check (public.is_current_user_admin());

create policy profiles_admin_delete on public.profiles
for delete to authenticated
using (public.current_user_role() = 'admin');

-- Demandes : dépôt public minimal, consultation et décision réservées.
create policy registration_requests_public_insert on public.registration_requests
for insert to anon, authenticated
with check (email is not null and length(trim(email)) between 3 and 320);

create policy registration_requests_admin_select on public.registration_requests
for select to authenticated using (public.is_current_user_admin());
create policy registration_requests_admin_update on public.registration_requests
for update to authenticated using (public.is_current_user_admin())
with check (public.is_current_user_admin());
create policy registration_requests_admin_delete on public.registration_requests
for delete to authenticated using (public.current_user_role() = 'admin');

create policy profile_requests_public_insert on public.profile_requests
for insert to anon, authenticated
with check (
  email is not null
  and length(trim(email)) between 3 and 320
  and (user_id is null or user_id = auth.uid())
  and coalesce(status, 'pending') = 'pending'
);
create policy profile_requests_own_or_admin_select on public.profile_requests
for select to authenticated
using (user_id = auth.uid() or public.is_current_user_admin());
create policy profile_requests_admin_update on public.profile_requests
for update to authenticated using (public.is_current_user_admin())
with check (public.is_current_user_admin());
create policy profile_requests_admin_delete on public.profile_requests
for delete to authenticated using (public.current_user_role() = 'admin');

-- Notifications et préférences strictement administratives.
create policy admin_notifications_admin_select on public.admin_notifications
for select to authenticated using (public.is_current_user_admin());
create policy admin_notifications_admin_insert on public.admin_notifications
for insert to authenticated with check (public.is_current_user_admin());
create policy admin_notifications_admin_update on public.admin_notifications
for update to authenticated using (public.is_current_user_admin())
with check (public.is_current_user_admin());
create policy admin_notifications_admin_delete on public.admin_notifications
for delete to authenticated using (public.current_user_role() = 'admin');

create policy admin_notification_preferences_admin_all on public.admin_notification_preferences
for all to authenticated using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Affectations : visibles par le membre concerné, gérées par la direction technique.
create policy team_staff_assignments_select on public.team_staff_assignments
for select to authenticated
using (profile_id = auth.uid() or public.is_current_user_admin());
create policy team_staff_assignments_admin_all on public.team_staff_assignments
for all to authenticated using (public.is_current_user_admin())
with check (public.is_current_user_admin());

-- Équipes : direction en lecture globale; staff limité à ses affectations.
create policy teams_select_scope on public.teams
for select to authenticated
using (public.is_current_user_club_leader() or public.can_access_team(id));
create policy teams_admin_insert on public.teams
for insert to authenticated with check (public.is_current_user_admin());
create policy teams_staff_update on public.teams
for update to authenticated
using (public.is_current_user_admin() or (public.current_user_role() = 'coach' and public.can_access_team(id)))
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and public.can_access_team(id)));
create policy teams_admin_delete on public.teams
for delete to authenticated using (public.current_user_role() = 'admin');

-- Joueurs et rattachements : accès uniquement via une équipe autorisée.
create policy players_select_scope on public.players
for select to authenticated
using (
  public.is_current_user_club_leader()
  or exists (
    select 1 from public.team_memberships tm
    where tm.player_id = players.id and public.can_access_team(tm.team_id)
  )
);
create policy players_insert_scope on public.players
for insert to authenticated
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and coalesce(owner_id, created_by) = auth.uid()));
create policy players_update_scope on public.players
for update to authenticated
using (
  public.is_current_user_admin()
  or (public.current_user_role() = 'coach' and (
    exists (
      select 1 from public.team_memberships tm
      where tm.player_id = players.id and public.can_access_team(tm.team_id)
    )
  ))
)
with check (
  public.is_current_user_admin()
  or (public.current_user_role() = 'coach' and (
    exists (
      select 1 from public.team_memberships tm
      where tm.player_id = players.id and public.can_access_team(tm.team_id)
    )
  ))
);
create policy players_admin_delete on public.players
for delete to authenticated using (public.current_user_role() = 'admin');

create policy team_memberships_select_scope on public.team_memberships
for select to authenticated using (public.can_access_team(team_id));
create policy team_memberships_write_scope on public.team_memberships
for all to authenticated
using (public.is_current_user_admin() or (public.current_user_role() = 'coach' and public.can_access_team(team_id)))
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and public.can_access_team(team_id)));

create policy player_contacts_select_scope on public.player_contacts
for select to authenticated
using (public.is_current_user_admin() or exists (
  select 1 from public.team_memberships tm
  where tm.player_id = player_contacts.player_id and public.can_access_team(tm.team_id)
));
create policy player_contacts_write_scope on public.player_contacts
for all to authenticated
using (public.is_current_user_admin() or (public.current_user_role() = 'coach' and exists (
  select 1 from public.team_memberships tm
  where tm.player_id = player_contacts.player_id and public.can_access_team(tm.team_id)
)))
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and exists (
  select 1 from public.team_memberships tm
  where tm.player_id = player_contacts.player_id and public.can_access_team(tm.team_id)
)));

create policy player_passports_select_scope on public.player_passports
for select to authenticated
using (public.is_current_user_club_leader() or public.can_access_team(current_team_id));
create policy player_passports_write_scope on public.player_passports
for insert to authenticated
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and public.can_access_team(current_team_id)));
create policy player_passports_update_scope on public.player_passports
for update to authenticated
using (public.is_current_user_admin() or (public.current_user_role() = 'coach' and public.can_access_team(current_team_id)))
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and public.can_access_team(current_team_id)));
create policy player_passports_delete_scope on public.player_passports
for delete to authenticated
using (public.is_current_user_admin());

-- Imports d'effectifs : jamais accessibles à un simple membre.
create policy roster_import_batches_scope on public.roster_import_batches
for all to authenticated
using (public.is_current_user_admin() or (public.current_user_role() = 'coach' and created_by = auth.uid() and public.can_access_team(target_team_id)))
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and created_by = auth.uid() and public.can_access_team(target_team_id)));
create policy player_duplicate_candidates_scope on public.player_duplicate_candidates
for all to authenticated
using (public.is_current_user_admin() or exists (
  select 1 from public.roster_import_batches rib
  where rib.id = player_duplicate_candidates.import_batch_id
    and rib.created_by = auth.uid()
    and public.can_access_team(rib.target_team_id)
))
with check (public.is_current_user_admin() or exists (
  select 1 from public.roster_import_batches rib
  where rib.id = player_duplicate_candidates.import_batch_id
    and rib.created_by = auth.uid()
    and public.can_access_team(rib.target_team_id)
));

-- Séances et situations : propriétaire, équipe affectée ou contenu club publié.
create policy sessions_select_scope on public.sessions
for select to authenticated
using (
  public.is_current_user_club_leader()
  or public.can_access_team(team_id)
  or (visibility in ('club', 'public') and status = 'published')
);
create policy sessions_insert_scope on public.sessions
for insert to authenticated
with check (
  public.is_current_user_admin()
  or (public.current_user_role() = 'coach' and coalesce(owner_id, coach_id) = auth.uid()
      and team_id is not null and public.can_access_team(team_id))
);
create policy sessions_update_scope on public.sessions
for update to authenticated
using (public.is_current_user_admin() or (public.current_user_role() = 'coach' and (owner_id = auth.uid() or coach_id = auth.uid() or public.can_access_team(team_id))))
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and (owner_id = auth.uid() or coach_id = auth.uid()) and team_id is not null and public.can_access_team(team_id)));
create policy sessions_delete_scope on public.sessions
for delete to authenticated
using (public.is_current_user_admin() or (public.current_user_role() = 'coach' and owner_id = auth.uid() and public.can_access_team(team_id)));

create policy session_situations_select on public.session_situations
for select to authenticated
using (exists (select 1 from public.sessions s where s.id = session_situations.session_id))
;
create policy session_situations_write on public.session_situations
for all to authenticated
using (exists (
  select 1 from public.sessions s where s.id = session_situations.session_id
    and (public.is_current_user_admin() or (public.current_user_role() = 'coach' and (s.owner_id = auth.uid() or s.coach_id = auth.uid() or public.can_access_team(s.team_id))))
))
with check (exists (
  select 1 from public.sessions s where s.id = session_situations.session_id
    and (public.is_current_user_admin() or (public.current_user_role() = 'coach' and (s.owner_id = auth.uid() or s.coach_id = auth.uid() or public.can_access_team(s.team_id))))
));
create policy session_tags_select on public.session_tags
for select to authenticated using (exists (select 1 from public.sessions s where s.id = session_tags.session_id));
create policy session_tags_write on public.session_tags
for all to authenticated
using (exists (select 1 from public.sessions s where s.id = session_tags.session_id and (public.is_current_user_admin() or s.owner_id = auth.uid() or s.coach_id = auth.uid())))
with check (exists (select 1 from public.sessions s where s.id = session_tags.session_id and (public.is_current_user_admin() or s.owner_id = auth.uid() or s.coach_id = auth.uid())));
create policy session_files_select on public.session_files
for select to authenticated using (exists (select 1 from public.sessions s where s.id = session_files.session_id));
create policy session_files_write on public.session_files
for all to authenticated
using (exists (select 1 from public.sessions s where s.id = session_files.session_id and (public.is_current_user_admin() or s.owner_id = auth.uid() or s.coach_id = auth.uid())))
with check (exists (select 1 from public.sessions s where s.id = session_files.session_id and (public.is_current_user_admin() or s.owner_id = auth.uid() or s.coach_id = auth.uid())));
create policy session_visibility_logs_select on public.session_visibility_logs
for select to authenticated
using (public.is_current_user_admin() or exists (select 1 from public.sessions s where s.id = session_visibility_logs.session_id and (s.owner_id = auth.uid() or s.coach_id = auth.uid())));
create policy session_visibility_logs_insert on public.session_visibility_logs
for insert to authenticated
with check (user_id = auth.uid() and exists (select 1 from public.sessions s where s.id = session_visibility_logs.session_id));

create policy situations_select_scope on public.situations
for select to authenticated
using (
  public.is_current_user_club_leader()
  or public.can_access_team(team_id)
  or (visibility in ('club', 'public') and status = 'published')
);
create policy situations_insert_scope on public.situations
for insert to authenticated
with check (
  public.is_current_user_admin()
  or (public.current_user_role() = 'coach'
      and coalesce(owner_id, created_by) = auth.uid()
      and team_id is not null
      and public.can_access_team(team_id))
);
create policy situations_update_scope on public.situations
for update to authenticated
using (public.is_current_user_admin() or (public.current_user_role() = 'coach' and public.can_access_team(team_id)))
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and public.can_access_team(team_id) and (owner_id = auth.uid() or created_by = auth.uid())));
create policy situations_delete_scope on public.situations
for delete to authenticated
using (public.is_current_user_admin() or (public.current_user_role() = 'coach' and owner_id = auth.uid() and public.can_access_team(team_id)));

create policy situation_tags_select on public.situation_tags
for select to authenticated using (exists (select 1 from public.situations s where s.id = situation_tags.situation_id));
create policy situation_tags_write on public.situation_tags
for all to authenticated
using (exists (select 1 from public.situations s where s.id = situation_tags.situation_id and (public.is_current_user_admin() or s.owner_id = auth.uid() or s.created_by = auth.uid())))
with check (exists (select 1 from public.situations s where s.id = situation_tags.situation_id and (public.is_current_user_admin() or s.owner_id = auth.uid() or s.created_by = auth.uid())));
create policy session_imports_scope on public.session_imports
for all to authenticated
using (public.is_current_user_admin() or created_by = auth.uid())
with check (public.is_current_user_admin() or (public.current_user_role() = 'coach' and created_by = auth.uid()));

-- RPC security definer : vérification interne obligatoire, indépendamment des grants.
create or replace function public.approve_profile_request(
  request_id uuid,
  final_role text,
  final_category_id text default null,
  admin_note_value text default null
)
returns public.profile_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_row public.profile_requests;
begin
  if not public.is_current_user_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;
  if lower(coalesce(final_role, '')) not in (
    'admin', 'responsable_technique', 'dirigeant', 'coach', 'team_staff',
    'parent_referent', 'joueur', 'parent', 'benevole', 'arbitre', 'otm', 'member'
  ) then
    raise exception 'Rôle final invalide.' using errcode = '22023';
  end if;
  if lower(final_role) in ('admin', 'responsable_technique')
     and public.current_user_role() <> 'admin' then
    raise exception 'Seul un administrateur peut attribuer un rôle élevé.' using errcode = '42501';
  end if;

  update public.profile_requests
  set requested_role = lower(final_role), requested_category_id = coalesce(final_category_id, requested_category_id),
      admin_note = admin_note_value, status = 'approved', decided_by = auth.uid(),
      decided_at = now(), updated_at = now()
  where id = request_id and status = 'pending'
  returning * into updated_row;

  if updated_row is null then
    raise exception 'Demande introuvable ou déjà traitée.' using errcode = 'P0002';
  end if;
  return updated_row;
end;
$$;
alter function public.approve_profile_request(uuid, text, text, text) owner to postgres;

create or replace function public.reject_profile_request(request_id uuid, admin_note_value text default null)
returns public.profile_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_row public.profile_requests;
begin
  if not public.is_current_user_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;
  update public.profile_requests
  set admin_note = admin_note_value, status = 'rejected', decided_by = auth.uid(),
      decided_at = now(), updated_at = now()
  where id = request_id and status = 'pending'
  returning * into updated_row;
  if updated_row is null then
    raise exception 'Demande introuvable ou déjà traitée.' using errcode = 'P0002';
  end if;
  return updated_row;
end;
$$;
alter function public.reject_profile_request(uuid, text) owner to postgres;

revoke all on function public.approve_profile_request(uuid, text, text, text) from public, anon;
revoke all on function public.reject_profile_request(uuid, text) from public, anon;
grant execute on function public.approve_profile_request(uuid, text, text, text) to authenticated, service_role;
grant execute on function public.reject_profile_request(uuid, text) to authenticated, service_role;

-- Échec explicite plutôt que suppression silencieuse d'une policy inconnue.
-- Toute policy historique globalement permissive doit être examinée et
-- remplacée dans une migration dédiée avant que celle-ci puisse être validée.
do $$
declare
  permissive_policies text;
begin
  select string_agg(format('%I.%I', tablename, policyname), ', ' order by tablename, policyname)
  into permissive_policies
  from pg_policies
  where schemaname = 'public'
    and (trim(coalesce(qual, '')) = 'true' or trim(coalesce(with_check, '')) = 'true');

  if permissive_policies is not null then
    raise exception 'Policies globalement permissives restantes : %', permissive_policies;
  end if;
end
$$;

commit;
