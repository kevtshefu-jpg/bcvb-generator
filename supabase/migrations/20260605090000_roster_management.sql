create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  first_name text not null default '',
  last_name text not null default '',
  birth_date date null,
  gender text null,
  category text null,
  height_cm integer null,
  position text null,
  license_number text null,
  license_status text null,
  notes text null,
  owner_id uuid null,
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null,
  deleted_at timestamptz null
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  category text not null default '',
  level text not null default '',
  season text not null default '',
  head_coach_id uuid null,
  assistant_coach_ids uuid[] not null default '{}'::uuid[],
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null
);

create table if not exists public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  season text not null default '',
  status text not null default 'active',
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_contacts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  parent_1_name text null,
  parent_2_name text null,
  parent_1_phone text null,
  parent_2_phone text null,
  parent_1_email text null,
  parent_2_email text null,
  emergency_phone text null,
  parent_referent text null,
  visibility text not null default 'team_staff',
  created_by uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.roster_import_batches (
  id uuid primary key default gen_random_uuid(),
  file_name text not null default '',
  file_type text not null default '',
  season text not null default '',
  target_team_id uuid null references public.teams(id) on delete set null,
  import_mode text not null default 'existing',
  status text not null default 'preview',
  readiness_score integer not null default 0,
  mapping_json jsonb not null default '{}'::jsonb,
  summary_json jsonb not null default '{}'::jsonb,
  created_by uuid null,
  created_at timestamptz not null default now(),
  validated_at timestamptz null,
  imported_at timestamptz null
);

create table if not exists public.player_duplicate_candidates (
  id uuid primary key default gen_random_uuid(),
  import_batch_id uuid null references public.roster_import_batches(id) on delete cascade,
  source_line integer not null,
  matched_player_id uuid null references public.players(id) on delete set null,
  matched_source_line integer null,
  score integer not null default 0,
  reasons text[] not null default '{}'::text[],
  suggested_action text not null default 'verifier',
  decided_action text null,
  decided_by uuid null,
  decided_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.player_passports (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  current_team_id uuid null references public.teams(id) on delete set null,
  season text not null default '',
  attendance_status text not null default 'ready',
  evaluation_status text not null default 'ready',
  objectives_status text not null default 'to_link',
  documents_status text not null default 'to_link',
  summary_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create unique index if not exists players_license_unique_idx
  on public.players(license_number)
  where license_number is not null and license_number <> '';

create index if not exists players_name_birth_idx on public.players(last_name, first_name, birth_date);
create index if not exists players_category_idx on public.players(category);
create index if not exists teams_season_category_idx on public.teams(season, category);
create index if not exists team_memberships_team_idx on public.team_memberships(team_id, season);
create index if not exists team_memberships_player_idx on public.team_memberships(player_id, season);
create index if not exists player_contacts_player_idx on public.player_contacts(player_id);
create index if not exists roster_import_batches_status_idx on public.roster_import_batches(status, season);
create index if not exists player_duplicate_candidates_batch_idx on public.player_duplicate_candidates(import_batch_id, score);
create index if not exists player_passports_player_idx on public.player_passports(player_id, season);
