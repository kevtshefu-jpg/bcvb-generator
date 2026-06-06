alter table if exists public.sessions add column if not exists level text not null default '';
alter table if exists public.sessions add column if not exists source_text text not null default '';

create table if not exists public.situations (
  id uuid primary key default gen_random_uuid(),
  session_id uuid null references public.sessions(id) on delete set null,
  title text not null default '',
  category text not null default '',
  theme text not null default '',
  sub_theme text not null default '',
  level text not null default '',
  duration_minutes integer not null default 10,
  player_count text not null default '',
  visibility text not null default 'private',
  status text not null default 'draft',
  content_json jsonb not null default '{}'::jsonb,
  quality_score integer not null default 0,
  created_by uuid null,
  owner_id uuid null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz null,
  archived_at timestamptz null,
  deleted_at timestamptz null
);

create table if not exists public.situation_tags (
  id uuid primary key default gen_random_uuid(),
  situation_id uuid not null references public.situations(id) on delete cascade,
  tag text not null default ''
);

create table if not exists public.session_imports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid null references public.sessions(id) on delete set null,
  situation_id uuid null references public.situations(id) on delete set null,
  file_name text not null default '',
  file_type text not null default '',
  extraction_method text not null default 'manual_fallback',
  extracted_text text not null default '',
  created_by uuid null,
  created_at timestamptz not null default now()
);

create index if not exists situations_session_idx on public.situations(session_id);
create index if not exists situations_owner_idx on public.situations(owner_id);
create index if not exists situations_visibility_idx on public.situations(visibility);
create index if not exists situations_category_theme_idx on public.situations(category, theme, sub_theme);
create index if not exists situation_tags_situation_idx on public.situation_tags(situation_id);
create index if not exists session_imports_session_idx on public.session_imports(session_id);
create index if not exists session_imports_situation_idx on public.session_imports(situation_id);
