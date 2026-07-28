-- Restaure localement trois tables historiques dont le schéma exact est
-- versionné dans 20260722120000_add_team_scoped_sport_data.sql (commit 1883440).
-- Aucune donnée métier n'est créée par cette migration.

begin;

create table if not exists public.ai_expert_modes (
  id uuid primary key default gen_random_uuid(),
  mode_key text not null unique,
  label text not null,
  description text null,
  is_active boolean not null default true,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.document_ai_results (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid null references auth.users(id) on delete set null,
  document_id uuid null,
  provider text null,
  model text null,
  status text not null default 'pending',
  result jsonb not null default '{}'::jsonb,
  error_message text null,
  created_at timestamptz not null default now()
);

create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  recipient_email text null,
  status text not null,
  error_message text null,
  registration_request_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.ai_expert_modes enable row level security;
alter table public.ai_expert_modes force row level security;
alter table public.document_ai_results enable row level security;
alter table public.document_ai_results force row level security;
alter table public.email_events enable row level security;
alter table public.email_events force row level security;

drop policy if exists ai_expert_modes_admin_read on public.ai_expert_modes;
drop policy if exists document_ai_results_admin_read on public.document_ai_results;
drop policy if exists document_ai_results_owner_or_admin_read on public.document_ai_results;
drop policy if exists email_events_admin_read on public.email_events;

create policy ai_expert_modes_admin_read on public.ai_expert_modes
for select to authenticated using (public.is_current_user_admin());

create policy document_ai_results_owner_or_admin_read on public.document_ai_results
for select to authenticated
using (public.is_current_user_admin() or owner_id = auth.uid());

create policy email_events_admin_read on public.email_events
for select to authenticated using (public.is_current_user_admin());

commit;
