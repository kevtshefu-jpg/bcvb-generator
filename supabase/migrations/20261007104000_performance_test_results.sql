-- P3 — canonical performance test result storage.
begin;

create table if not exists public.performance_test_results (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  season text not null,
  test_code text not null,
  test_name text not null,
  measured_at date not null,
  value numeric not null,
  unit text not null,
  protocol_version text not null,
  context_note text null,
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(player_id, team_id, season, test_code, measured_at, protocol_version)
);

create index if not exists performance_test_results_player_idx on public.performance_test_results(player_id, season, measured_at desc);
alter table public.performance_test_results enable row level security;
alter table public.performance_test_results force row level security;
revoke all privileges on table public.performance_test_results from public, anon, authenticated;

commit;