-- P6 — canonical player programs and ordered weeks/sessions.
begin;

create table public.player_programs (
 id uuid primary key default gen_random_uuid(),
 player_id uuid not null references public.players(id) on delete cascade,
 team_id uuid not null references public.teams(id) on delete cascade,
 season text not null,
 title text not null,
 start_date date not null,
 end_date date not null,
 level smallint not null check (level between 1 and 3),
 status text not null default 'draft' check (status in ('draft','active','completed','cancelled')),
 safety_state text not null default 'vert' check (safety_state in ('vert','orange','rouge')),
 created_by uuid not null references auth.users(id),
 updated_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 check (end_date >= start_date)
);
create table public.player_program_weeks (
 id uuid primary key default gen_random_uuid(),
 program_id uuid not null references public.player_programs(id) on delete cascade,
 week_number smallint not null check (week_number between 1 and 6),
 phase text not null check (phase in ('diagnostic_apprentissage','consolidation','surcharge','complexification_conversion','intensification_match','affutage')),
 starts_on date not null,
 ends_on date not null,
 unique(program_id,week_number),
 check(ends_on>=starts_on)
);
create table public.player_program_sessions (
 id uuid primary key default gen_random_uuid(),
 program_week_id uuid not null references public.player_program_weeks(id) on delete cascade,
 session_id uuid not null references public.sessions(id) on delete restrict,
 order_index smallint not null check(order_index>0),
 planned_on date null,
 unique(program_week_id,session_id),
 unique(program_week_id,order_index)
);
create index player_programs_player_idx on public.player_programs(player_id,season,start_date desc);
alter table public.player_programs enable row level security; alter table public.player_programs force row level security;
alter table public.player_program_weeks enable row level security; alter table public.player_program_weeks force row level security;
alter table public.player_program_sessions enable row level security; alter table public.player_program_sessions force row level security;
revoke all on public.player_programs,public.player_program_weeks,public.player_program_sessions from public,anon,authenticated;

create or replace function public.read_player_programs(target_player_id uuid,target_team_id uuid)
returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
 if not public.is_current_user_admin() and public.current_user_role()<>'responsable_technique' and not public.can_access_current_player(target_player_id) then raise exception 'Lecture programme interdite.' using errcode='42501'; end if;
 if not public.is_current_user_admin() and public.current_user_role()<>'responsable_technique' and not public.can_access_team(target_team_id) then raise exception 'Equipe interdite.' using errcode='42501'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',p.id,'player_id',p.player_id,'team_id',p.team_id,'season',p.season,'title',p.title,'start_date',p.start_date,'end_date',p.end_date,'level',p.level,'status',p.status,'safety_state',p.safety_state,'weeks',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'week_number',w.week_number,'phase',w.phase,'starts_on',w.starts_on,'ends_on',w.ends_on,'sessions',coalesce((select jsonb_agg(jsonb_build_object('id',ps.id,'session_id',ps.session_id,'order_index',ps.order_index,'planned_on',ps.planned_on) order by ps.order_index) from public.player_program_sessions ps where ps.program_week_id=w.id),'[]'::jsonb)) order by w.week_number) from public.player_program_weeks w where w.program_id=p.id),'[]'::jsonb)) order by p.start_date desc) from public.player_programs p where p.player_id=target_player_id and p.team_id=target_team_id),'[]'::jsonb);
end $$;
alter function public.read_player_programs(uuid,uuid) owner to postgres;
revoke all on function public.read_player_programs(uuid,uuid) from public,anon,authenticated,service_role;
grant execute on function public.read_player_programs(uuid,uuid) to authenticated;

commit;