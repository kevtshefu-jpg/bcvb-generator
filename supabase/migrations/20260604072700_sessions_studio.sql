create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  category text not null default 'U13',
  theme text not null default '',
  sub_theme text not null default '',
  team_id uuid null,
  coach_id uuid null,
  owner_id uuid null,
  visibility text not null default 'private',
  status text not null default 'draft',
  duration_minutes integer not null default 90,
  expected_players integer not null default 12,
  source_type text not null default 'manual',
  source_file_name text not null default '',
  source_raw_text text not null default '',
  content_json jsonb not null default '{}'::jsonb,
  quality_score integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  archived_at timestamptz null,
  deleted_at timestamptz null,
  deleted_by uuid null
);

create table if not exists public.session_situations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  order_index integer not null default 1,
  title text not null default '',
  duration_minutes integer not null default 10,
  theme text not null default '',
  sub_theme text not null default '',
  pedagogical_phase text not null default 'je-m-exerce',
  content_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_tags (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  tag text not null default ''
);

create table if not exists public.session_files (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  file_name text not null default '',
  file_type text not null default '',
  file_url text not null default '',
  extracted_text text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.session_visibility_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  action text not null default '',
  user_id uuid null,
  created_at timestamptz not null default now()
);

create index if not exists sessions_owner_idx on public.sessions(owner_id);
create index if not exists sessions_visibility_idx on public.sessions(visibility);
create index if not exists sessions_status_idx on public.sessions(status);
create index if not exists sessions_category_theme_idx on public.sessions(category, theme, sub_theme);
create index if not exists session_situations_session_idx on public.session_situations(session_id, order_index);
create index if not exists session_tags_session_idx on public.session_tags(session_id);
