create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text not null,
  phone text,
  birth_year integer,
  category_requested text,
  requested_category text,
  role_requested text,
  requested_role text,
  requested_team text,
  notes text,
  status text not null default 'pending',
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.registration_requests
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists email text,
  add column if not exists phone text,
  add column if not exists birth_year integer,
  add column if not exists category_requested text,
  add column if not exists requested_category text,
  add column if not exists role_requested text,
  add column if not exists requested_role text,
  add column if not exists requested_team text,
  add column if not exists notes text,
  add column if not exists status text default 'pending',
  add column if not exists approved_by uuid,
  add column if not exists approved_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.registration_requests
set status = 'pending'
where status is null;

alter table public.registration_requests
  alter column status set default 'pending',
  alter column status set not null,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1 from public.registration_requests where email is null limit 1
  ) then
    alter table public.registration_requests alter column email set not null;
  else
    raise notice 'registration_requests.email contient des valeurs nulles : contrainte not null non appliquée.';
  end if;
end;
$$;

create table if not exists public.profile_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text not null,
  full_name text,
  requested_role text,
  requested_category_id text,
  requested_team text,
  phone text,
  motivation text,
  message text,
  status text not null default 'pending',
  admin_note text,
  decided_by uuid,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_requests
  add column if not exists user_id uuid,
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists requested_role text,
  add column if not exists requested_category_id text,
  add column if not exists requested_team text,
  add column if not exists phone text,
  add column if not exists motivation text,
  add column if not exists message text,
  add column if not exists status text default 'pending',
  add column if not exists admin_note text,
  add column if not exists decided_by uuid,
  add column if not exists decided_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.profile_requests
set status = 'pending'
where status is null;

alter table public.profile_requests
  alter column status set default 'pending',
  alter column status set not null,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1 from public.profile_requests where email is null limit 1
  ) then
    alter table public.profile_requests alter column email set not null;
  else
    raise notice 'profile_requests.email contient des valeurs nulles : contrainte not null non appliquée.';
  end if;
end;
$$;

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  title text not null,
  message text not null,
  action_url text,
  metadata jsonb not null default '{}'::jsonb,
  recipient_user_id uuid,
  recipient_role text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.admin_notifications
  add column if not exists type text,
  add column if not exists title text,
  add column if not exists message text,
  add column if not exists action_url text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists recipient_user_id uuid,
  add column if not exists recipient_role text,
  add column if not exists read_at timestamptz,
  add column if not exists created_at timestamptz default now();

update public.admin_notifications
set metadata = '{}'::jsonb
where metadata is null;

alter table public.admin_notifications
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null,
  alter column created_at set default now();

do $$
begin
  if not exists (
    select 1 from public.admin_notifications
    where type is null or title is null or message is null
    limit 1
  ) then
    alter table public.admin_notifications
      alter column type set not null,
      alter column title set not null,
      alter column message set not null;
  else
    raise notice 'admin_notifications contient des valeurs nulles sur type/title/message : contraintes not null non appliquées.';
  end if;
end;
$$;

create table if not exists public.admin_notification_preferences (
  id uuid primary key default gen_random_uuid(),
  event_type text not null unique,
  label text not null,
  description text,
  enabled boolean not null default true,
  notify_admin boolean not null default true,
  notify_responsable_technique boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.admin_notification_preferences
  add column if not exists event_type text,
  add column if not exists label text,
  add column if not exists description text,
  add column if not exists enabled boolean default true,
  add column if not exists notify_admin boolean default true,
  add column if not exists notify_responsable_technique boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.admin_notification_preferences
set
  enabled = coalesce(enabled, true),
  notify_admin = coalesce(notify_admin, true),
  notify_responsable_technique = coalesce(notify_responsable_technique, true)
where enabled is null
  or notify_admin is null
  or notify_responsable_technique is null;

alter table public.admin_notification_preferences
  alter column enabled set default true,
  alter column enabled set not null,
  alter column notify_admin set default true,
  alter column notify_admin set not null,
  alter column notify_responsable_technique set default true,
  alter column notify_responsable_technique set not null,
  alter column created_at set default now(),
  alter column updated_at set default now();

do $$
begin
  if not exists (
    select 1 from public.admin_notification_preferences
    where event_type is null or label is null
    limit 1
  ) then
    alter table public.admin_notification_preferences
      alter column event_type set not null,
      alter column label set not null;
  else
    raise notice 'admin_notification_preferences contient des valeurs nulles sur event_type/label : contraintes not null non appliquées.';
  end if;
end;
$$;

create unique index if not exists admin_notification_preferences_event_type_key
  on public.admin_notification_preferences (event_type);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text,
  full_name text,
  role text default 'member',
  profile_status text default 'active',
  category_id text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles
  add column if not exists email text,
  add column if not exists full_name text,
  add column if not exists role text default 'member',
  add column if not exists profile_status text default 'active',
  add column if not exists category_id text,
  add column if not exists is_active boolean default true,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

update public.profiles
set
  role = coalesce(role, 'member'),
  profile_status = coalesce(profile_status, case when is_active is false then 'inactive' else 'active' end),
  is_active = coalesce(is_active, true)
where role is null
  or profile_status is null
  or is_active is null;

alter table public.profiles
  alter column role set default 'member',
  alter column profile_status set default 'active',
  alter column is_active set default true,
  alter column created_at set default now(),
  alter column updated_at set default now();

alter table public.registration_requests enable row level security;
alter table public.profile_requests enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.admin_notification_preferences enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "Public can create registration requests" on public.registration_requests;
create policy "Public can create registration requests"
on public.registration_requests
for insert
to anon, authenticated
with check (email is not null);

drop policy if exists "Authenticated can read registration requests" on public.registration_requests;
create policy "Authenticated can read registration requests"
on public.registration_requests
for select
to authenticated
using (true);

drop policy if exists "Authenticated can update registration requests" on public.registration_requests;
create policy "Authenticated can update registration requests"
on public.registration_requests
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Public can create profile requests" on public.profile_requests;
create policy "Public can create profile requests"
on public.profile_requests
for insert
to anon, authenticated
with check (email is not null);

drop policy if exists "Authenticated can read profile requests" on public.profile_requests;
create policy "Authenticated can read profile requests"
on public.profile_requests
for select
to authenticated
using (true);

drop policy if exists "Authenticated can update profile requests" on public.profile_requests;
create policy "Authenticated can update profile requests"
on public.profile_requests
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can read admin notifications" on public.admin_notifications;
create policy "Authenticated can read admin notifications"
on public.admin_notifications
for select
to authenticated
using (true);

drop policy if exists "Authenticated can create admin notifications" on public.admin_notifications;
create policy "Authenticated can create admin notifications"
on public.admin_notifications
for insert
to authenticated, anon
with check (true);

drop policy if exists "Authenticated can update admin notifications" on public.admin_notifications;
create policy "Authenticated can update admin notifications"
on public.admin_notifications
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can read notification preferences" on public.admin_notification_preferences;
create policy "Authenticated can read notification preferences"
on public.admin_notification_preferences
for select
to authenticated
using (true);

drop policy if exists "Authenticated can create notification preferences" on public.admin_notification_preferences;
create policy "Authenticated can create notification preferences"
on public.admin_notification_preferences
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update notification preferences" on public.admin_notification_preferences;
create policy "Authenticated can update notification preferences"
on public.admin_notification_preferences
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can read profiles" on public.profiles;
create policy "Authenticated can read profiles"
on public.profiles
for select
to authenticated
using (true);

drop policy if exists "Authenticated can create profiles" on public.profiles;
create policy "Authenticated can create profiles"
on public.profiles
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated can update profiles" on public.profiles;
create policy "Authenticated can update profiles"
on public.profiles
for update
to authenticated
using (true)
with check (true);

drop trigger if exists set_registration_requests_updated_at on public.registration_requests;
create trigger set_registration_requests_updated_at
before update on public.registration_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_profile_requests_updated_at on public.profile_requests;
create trigger set_profile_requests_updated_at
before update on public.profile_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_admin_notification_preferences_updated_at on public.admin_notification_preferences;
create trigger set_admin_notification_preferences_updated_at
before update on public.admin_notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create index if not exists registration_requests_status_created_at_idx
  on public.registration_requests (status, created_at desc);

create index if not exists registration_requests_email_idx
  on public.registration_requests (email);

create index if not exists profile_requests_status_created_at_idx
  on public.profile_requests (status, created_at desc);

create index if not exists profile_requests_email_idx
  on public.profile_requests (email);

create index if not exists admin_notifications_created_at_idx
  on public.admin_notifications (created_at desc);

create index if not exists admin_notifications_read_at_idx
  on public.admin_notifications (read_at);

create index if not exists profiles_role_idx
  on public.profiles (role);

insert into public.admin_notification_preferences
  (event_type, label, description, enabled, notify_admin, notify_responsable_technique)
values
  ('registration_created', 'Nouvelle demande d''inscription', 'Notification lorsqu''un visiteur envoie une demande d''inscription publique.', true, true, true),
  ('registration_request_created', 'Nouvelle demande d''inscription', 'Notification lorsqu''un visiteur envoie une demande d''inscription publique.', true, true, true),
  ('registration_approved', 'Inscription validée', 'Notification lorsqu''une demande d''inscription est validée.', true, true, false),
  ('registration_rejected', 'Inscription refusée', 'Notification lorsqu''une demande d''inscription est refusée.', true, true, false),
  ('profile_request_created', 'Nouvelle demande de profil', 'Notification lorsqu''un utilisateur demande un accès ou une évolution de rôle.', true, true, true),
  ('authorization_requested', 'Autorisation demandée', 'Notification lorsqu''un utilisateur demande une autorisation sensible.', true, true, true),
  ('document_created', 'Document créé', 'Notification lorsqu''un document club est ajouté au référentiel.', true, true, false),
  ('document_updated', 'Document modifié', 'Notification lorsqu''un document existant est corrigé ou enrichi.', true, true, false),
  ('document_deleted', 'Document supprimé', 'Notification lorsqu''un document est supprimé ou retiré du référentiel actif.', true, true, true),
  ('document_archived', 'Document archivé', 'Notification lorsqu''un document est archivé ou retiré du référentiel courant.', true, true, true),
  ('import_failed', 'Import échoué', 'Notification lorsqu''un import de données ou de documents échoue.', true, true, true),
  ('document_exported', 'Document exporté', 'Notification lorsqu''un PDF ou une source est généré depuis la plateforme.', true, false, false),
  ('session_created', 'Séance créée', 'Notification lorsqu''un coach ou admin crée une séance terrain.', true, false, true),
  ('planning_created', 'Planification créée', 'Notification lorsqu''une planification sportive est créée ou initialisée.', true, false, true),
  ('bulk_action_performed', 'Action groupée effectuée', 'Notification lorsqu''une suppression ou archive groupée est effectuée.', true, true, false),
  ('bulk_action_completed', 'Action groupée effectuée', 'Compatibilité avec le nom d''événement actuellement utilisé côté interface.', true, true, false)
on conflict (event_type) do nothing;

drop function if exists public.approve_profile_request(uuid, text, text, text);
create function public.approve_profile_request(
  request_id uuid,
  final_role text,
  final_category_id text default null,
  admin_note_value text default null
)
returns public.profile_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.profile_requests;
begin
  update public.profile_requests
  set
    requested_role = coalesce(nullif(final_role, ''), requested_role),
    requested_category_id = coalesce(final_category_id, requested_category_id),
    admin_note = admin_note_value,
    status = 'approved',
    decided_by = auth.uid(),
    decided_at = now(),
    updated_at = now()
  where id = request_id
  returning * into updated_row;

  if updated_row is null then
    raise exception 'Demande de profil introuvable.';
  end if;

  return updated_row;
end;
$$;

drop function if exists public.reject_profile_request(uuid, text);
create function public.reject_profile_request(
  request_id uuid,
  admin_note_value text default null
)
returns public.profile_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.profile_requests;
begin
  update public.profile_requests
  set
    admin_note = admin_note_value,
    status = 'rejected',
    decided_by = auth.uid(),
    decided_at = now(),
    updated_at = now()
  where id = request_id
  returning * into updated_row;

  if updated_row is null then
    raise exception 'Demande de profil introuvable.';
  end if;

  return updated_row;
end;
$$;

grant execute on function public.approve_profile_request(uuid, text, text, text) to authenticated;
grant execute on function public.reject_profile_request(uuid, text) to authenticated;
