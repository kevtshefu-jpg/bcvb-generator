-- BCVB — PRODUCTION ONLY — MANUAL / NOT A MIGRATION
-- DO NOT EXECUTE until a verified, restorable OFF-DATABASE backup is available.
-- Run in one transaction using an operator with schema/DDL permissions.
-- Prepared against project leziahqmqyuewpzjmzxf (2026-10-14).
-- No player or document rows are modified by this script.

begin;

-- Fail closed if the remote schema has drifted.
do $preflight$
declare
  required_table text;
begin
  foreach required_table in array array[
    'profiles', 'library_documents', 'player_content_unlocks', 'player_fundamental_progress'
  ] loop
    if to_regclass('public.' || required_table) is null then
      raise exception 'Table attendue absente : %', required_table;
    end if;
  end loop;

  if not exists (
    select 1 from pg_trigger
    where tgrelid = 'public.profiles'::regclass
      and tgname = 'protect_profile_security_fields_trigger'
      and tgenabled in ('O', 'A')
  ) then
    raise exception 'Protection des droits de profils absente ou inactive';
  end if;

  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'current_user_role'
  ) then
    raise exception 'Helper de rôle courant absent';
  end if;

  -- GO05: deleted_at is authoritative for ordinary visibility.
  -- Historical active+deleted rows are preserved; never clear deleted_at.
  -- Review and test the policy and Storage access on an isolated clone first.

  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'library_documents'
  ) then
    raise exception 'Politiques bibliothèque inattendues : arrêter et auditer';
  end if;

  if (
    select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'player_content_unlocks'
  ) <> 3 or (
    select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'player_fundamental_progress'
  ) <> 3 then
    raise exception 'Politiques joueur différentes du préflight : arrêter et auditer';
  end if;

  -- Fail closed if the six legacy player policies differ from the audited set.
  if (
    select count(*) from pg_policies
    where schemaname = 'public'
      and (tablename, policyname, cmd) in (
        values
          ('player_content_unlocks', 'player_unlocks_select_own_or_staff', 'SELECT'),
          ('player_content_unlocks', 'staff_can_insert_player_unlocks', 'INSERT'),
          ('player_content_unlocks', 'staff_can_delete_player_unlocks', 'DELETE'),
          ('player_fundamental_progress', 'player_progress_select_own_or_staff', 'SELECT'),
          ('player_fundamental_progress', 'staff_can_insert_player_progress', 'INSERT'),
          ('player_fundamental_progress', 'staff_can_update_player_progress', 'UPDATE')
      )
      and roles = array['authenticated']::name[]
      and permissive = 'PERMISSIVE'
  ) <> 6 then
    raise exception 'Politiques joueur inattendues : arreter et auditer';
  end if;

  if exists (
    select 1 from pg_class c
    where c.oid in (
      'public.library_documents'::regclass,
      'public.player_content_unlocks'::regclass,
      'public.player_fundamental_progress'::regclass
    ) and c.relrowsecurity
  ) then
    raise exception 'RLS déjà active sur au moins une table : arrêter et auditer';
  end if;
end;
$preflight$;

-- Bibliothèque : ne jamais confondre "uploaded" et "published".
-- Staff actif : lecture; propriétaire : lecture de ses propres documents.
-- Autres membres : uniquement documents publiés explicitement pour les membres.
-- Public : uniquement documents publiés explicitement publics.
create policy bcvb_rls_20261014_library_public_read
on public.library_documents for select to anon
using (
  is_active is true and deleted_at is null
  and status = 'published' and audience = 'public'
);

create policy bcvb_rls_20261014_library_authenticated_read
on public.library_documents for select to authenticated
using (
  -- GO05: mandatory for ALL ordinary reads, including staff and owners.
  is_active is true and deleted_at is null
  and public.current_user_role() is not null
  and public.current_user_role() <> 'inactive'
  and (
    public.current_user_role() in ('admin', 'responsable_technique', 'dirigeant', 'coach')
    or uploaded_by = auth.uid()
    or (
      status = 'published'
      and (
        audience in ('public', 'member')
        or (audience = 'parent' and public.current_user_role() in ('parent', 'parent_referent'))
      )
    )
  )
);

create policy bcvb_rls_20261014_library_staff_insert
on public.library_documents for insert to authenticated
with check (
  public.current_user_role() in ('admin', 'responsable_technique', 'dirigeant')
);

create policy bcvb_rls_20261014_library_staff_update
on public.library_documents for update to authenticated
using (
  public.current_user_role() in ('admin', 'responsable_technique', 'dirigeant')
)
with check (
  public.current_user_role() in ('admin', 'responsable_technique', 'dirigeant')
);

create policy bcvb_rls_20261014_library_admin_delete
on public.library_documents for delete to authenticated
using (public.current_user_role() in ('admin', 'responsable_technique'));

-- Harden existing player policies: preserve the audited staff roles, but require
-- an active profile. Owner reads must also reject inactive accounts.
-- Team scoping is NOT introduced here: progress rows reference profiles.id,
-- whereas team memberships reference players.id (no verified canonical link).
alter policy player_unlocks_select_own_or_staff
on public.player_content_unlocks
using (
  (player_id = auth.uid()
   and public.current_user_role() is not null
   and public.current_user_role() <> 'inactive')
  or public.current_user_role() in ('admin', 'coach', 'dirigeant')
);

alter policy player_progress_select_own_or_staff
on public.player_fundamental_progress
using (
  (player_id = auth.uid()
   and public.current_user_role() is not null
   and public.current_user_role() <> 'inactive')
  or public.current_user_role() in ('admin', 'coach', 'dirigeant')
);

alter policy staff_can_insert_player_unlocks
on public.player_content_unlocks
with check (public.current_user_role() in ('admin', 'coach', 'dirigeant'));

alter policy staff_can_delete_player_unlocks
on public.player_content_unlocks
using (public.current_user_role() in ('admin', 'coach', 'dirigeant'));

alter policy staff_can_insert_player_progress
on public.player_fundamental_progress
with check (public.current_user_role() in ('admin', 'coach', 'dirigeant'));

alter policy staff_can_update_player_progress
on public.player_fundamental_progress
using (public.current_user_role() in ('admin', 'coach', 'dirigeant'))
with check (public.current_user_role() in ('admin', 'coach', 'dirigeant'));

-- Remove direct anonymous writes even if future policies drift.
revoke insert, update, delete on public.library_documents from anon;
revoke all on public.player_content_unlocks, public.player_fundamental_progress from anon;
-- TRUNCATE bypasses row-level security. Neither API role may retain these
-- table-level privileges, even if future grants or policies change.
revoke truncate, trigger, references
on public.library_documents, public.player_content_unlocks,
   public.player_fundamental_progress
from anon, authenticated;

alter table public.library_documents enable row level security;
alter table public.player_content_unlocks enable row level security;
alter table public.player_fundamental_progress enable row level security;

-- Guard against accidental RLS disablement or policy mismatch.
do $verify$
begin
  if (
    select count(*) from pg_class
    where oid in (
      'public.library_documents'::regclass,
      'public.player_content_unlocks'::regclass,
      'public.player_fundamental_progress'::regclass
    ) and relrowsecurity
  ) <> 3 then
    raise exception 'RLS non activée sur les trois tables';
  end if;

  if (
    select count(*) from pg_policies
    where schemaname = 'public' and tablename = 'library_documents'
      and policyname like 'bcvb_rls_20261014_%'
  ) <> 5 then
    raise exception 'Politiques bibliothèque incomplètes';
  end if;

  if has_table_privilege('anon', 'public.library_documents', 'INSERT')
    or has_table_privilege('anon', 'public.library_documents', 'UPDATE')
    or has_table_privilege('anon', 'public.library_documents', 'DELETE')
    or has_table_privilege('anon', 'public.player_content_unlocks', 'SELECT')
    or has_table_privilege('anon', 'public.player_fundamental_progress', 'SELECT')
  then
    raise exception 'Privilèges anonymes non révoqués';
  end if;
  if exists (
    select 1
    from unnest(array[
      'library_documents', 'player_content_unlocks', 'player_fundamental_progress'
    ]) as target(table_name)
    cross join unnest(array['TRUNCATE', 'TRIGGER', 'REFERENCES']) as perm(privilege)
    where has_table_privilege('anon', 'public.' || target.table_name, perm.privilege)
       or has_table_privilege('authenticated', 'public.' || target.table_name, perm.privilege)
  ) then
    raise exception 'Privileges dangereux non revoques pour les roles API';
  end if;
end;
$verify$;

commit;
