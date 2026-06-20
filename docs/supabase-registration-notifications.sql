create extension if not exists pgcrypto;

create table if not exists public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  last_name text,
  email text not null,
  phone text,
  birth_year integer,
  category_requested text,
  role_requested text,
  requested_team text,
  notes text,
  status text not null default 'pending',
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
  add column if not exists role_requested text,
  add column if not exists requested_team text,
  add column if not exists notes text,
  add column if not exists status text default 'pending',
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

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

alter table public.registration_requests enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.admin_notification_preferences enable row level security;

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

drop policy if exists "Authenticated can update notification preferences" on public.admin_notification_preferences;
create policy "Authenticated can update notification preferences"
on public.admin_notification_preferences
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can create notification preferences" on public.admin_notification_preferences;
create policy "Authenticated can create notification preferences"
on public.admin_notification_preferences
for insert
to authenticated
with check (true);

insert into public.admin_notification_preferences
  (event_type, label, description, enabled, notify_admin, notify_responsable_technique)
values
  ('registration_request_created', 'Nouvelle demande d''inscription', 'Notification lorsqu''un utilisateur envoie une demande d''inscription.', true, true, true),
  ('profile_request_created', 'Nouvelle demande de profil', 'Notification lorsqu''un utilisateur demande un accès à la plateforme.', true, true, true),
  ('document_created', 'Document créé', 'Notification lorsqu''un document est créé.', true, true, false),
  ('document_updated', 'Document modifié', 'Notification lorsqu''un document est modifié.', true, true, false),
  ('document_deleted', 'Document supprimé', 'Notification lorsqu''un document est supprimé.', true, true, true),
  ('document_exported', 'Document exporté', 'Notification lorsqu''un document est exporté.', false, true, false),
  ('session_created', 'Séance créée', 'Notification lorsqu''une séance est créée.', false, true, false),
  ('planning_created', 'Planification créée', 'Notification lorsqu''une planification est créée.', false, true, false),
  ('bulk_action_performed', 'Action groupée', 'Notification lorsqu''une suppression ou archive groupée est effectuée.', true, true, true)
on conflict (event_type) do nothing;
