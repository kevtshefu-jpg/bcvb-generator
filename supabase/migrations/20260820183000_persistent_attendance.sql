-- ============================================================
-- BCVB — GO-02D
-- Présences persistantes et sécurisées
-- ============================================================

-- ------------------------------------------------------------
-- 1. SÉANCES D'APPEL
-- Une occurrence réelle d'entraînement, match, stage...
-- ------------------------------------------------------------

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),

  team_id uuid not null
    references public.teams(id)
    on delete cascade,

  training_slot_id uuid null
    references public.training_slots(id)
    on delete set null,

  session_date date not null,

  title text not null default 'Appel séance',

  session_type text not null default 'entrainement'
    check (
      session_type in (
        'entrainement',
        'match',
        'stage',
        'tournoi',
        'reunion',
        'autre',
        'evenement_club'
      )
    ),

  start_time time null,
  end_time time null,
  location_name text null,

  notes text null,

  status text not null default 'draft'
    check (status in ('draft', 'validated', 'cancelled')),

  validated_by uuid null
    references public.profiles(id)
    on delete set null,

  validated_at timestamptz null,

  created_by uuid not null default auth.uid(),
  updated_by uuid null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint attendance_session_times_check
    check (
      start_time is null
      or end_time is null
      or end_time > start_time
    )
);

create unique index if not exists attendance_sessions_team_date_identity_idx
  on public.attendance_sessions (
    team_id,
    session_date,
    coalesce(start_time, '00:00'::time),
    session_type
  )
  where status <> 'cancelled';

create index if not exists attendance_sessions_team_date_idx
  on public.attendance_sessions(team_id, session_date desc);

create index if not exists attendance_sessions_training_slot_idx
  on public.attendance_sessions(training_slot_id)
  where training_slot_id is not null;


-- ------------------------------------------------------------
-- 2. ENREGISTREMENTS INDIVIDUELS
--
-- IMPORTANT :
-- absence de ligne = statut non encore renseigné.
-- Nous ne transformons jamais automatiquement un joueur
-- en "présent".
-- ------------------------------------------------------------

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),

  session_id uuid not null
    references public.attendance_sessions(id)
    on delete cascade,

  player_id uuid not null
    references public.players(id)
    on delete cascade,

  status text not null
    check (
      status in (
        'present',
        'absent_excused',
        'absent_unexcused',
        'late',
        'injured',
        'exempt',
        'observation',
        'exempted',
        'club_selection',
        'external_selection',
        'other'
      )
    ),

  reason text null,

  delay_minutes integer null
    check (
      delay_minutes is null
      or delay_minutes >= 0
    ),

  injury_note text null,
  logistic_note text null,
  coach_comment text null,

  source text not null default 'coach'
    check (
      source in (
        'coach',
        'admin',
        'parent_referent',
        'import',
        'auto'
      )
    ),

  parent_confirmed boolean not null default false,

  validated_by_coach boolean not null default false,

  created_by uuid not null default auth.uid(),
  updated_by uuid null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint attendance_records_session_player_unique
    unique(session_id, player_id),

  constraint attendance_late_delay_check
    check (
      status <> 'late'
      or coalesce(delay_minutes, 0) > 0
    )
);

create index if not exists attendance_records_session_idx
  on public.attendance_records(session_id);

create index if not exists attendance_records_player_idx
  on public.attendance_records(player_id);

create index if not exists attendance_records_unvalidated_idx
  on public.attendance_records(session_id, validated_by_coach)
  where validated_by_coach = false;


-- ------------------------------------------------------------
-- 3. CONTRÔLES MÉTIER SERVEUR
-- ------------------------------------------------------------

create or replace function public.validate_attendance_record_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_team_id uuid;
  target_session_date date;
begin
  select s.team_id, s.session_date
  into target_team_id, target_session_date
  from public.attendance_sessions s
  where s.id = new.session_id;

  if target_team_id is null then
    raise exception 'ATTENDANCE_SESSION_NOT_FOUND';
  end if;

  if not exists (
    select 1
    from public.team_memberships tm
    where tm.player_id = new.player_id
      and tm.team_id = target_team_id
      and tm.status <> 'inactive'
  ) then
    raise exception 'PLAYER_NOT_IN_TEAM';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_attendance_record_membership_trigger
  on public.attendance_records;

create trigger validate_attendance_record_membership_trigger
before insert or update of session_id, player_id
on public.attendance_records
for each row
execute function public.validate_attendance_record_membership();


-- ------------------------------------------------------------
-- 4. UPDATED_AT
-- ------------------------------------------------------------

create or replace function public.touch_attendance_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists attendance_sessions_touch_updated_at
  on public.attendance_sessions;

create trigger attendance_sessions_touch_updated_at
before update on public.attendance_sessions
for each row
execute function public.touch_attendance_updated_at();

drop trigger if exists attendance_records_touch_updated_at
  on public.attendance_records;

create trigger attendance_records_touch_updated_at
before update on public.attendance_records
for each row
execute function public.touch_attendance_updated_at();


-- ------------------------------------------------------------
-- 5. RLS
-- ------------------------------------------------------------

alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

drop policy if exists attendance_sessions_select
  on public.attendance_sessions;

create policy attendance_sessions_select
on public.attendance_sessions
for select
to authenticated
using (
  public.is_current_user_club_leader()
  or public.can_access_team(team_id)
);


drop policy if exists attendance_sessions_insert
  on public.attendance_sessions;

create policy attendance_sessions_insert
on public.attendance_sessions
for insert
to authenticated
with check (
  (
    public.is_current_user_club_leader()
    or (
      public.current_user_role() in ('coach', 'team_staff')
      and public.can_access_team(team_id)
    )
  )
  and created_by = auth.uid()
);


drop policy if exists attendance_sessions_update
  on public.attendance_sessions;

create policy attendance_sessions_update
on public.attendance_sessions
for update
to authenticated
using (
  public.is_current_user_club_leader()
  or (
    public.current_user_role() in ('coach', 'team_staff')
    and public.can_access_team(team_id)
  )
)
with check (
  public.is_current_user_club_leader()
  or (
    public.current_user_role() in ('coach', 'team_staff')
    and public.can_access_team(team_id)
  )
);


drop policy if exists attendance_sessions_delete
  on public.attendance_sessions;

create policy attendance_sessions_delete
on public.attendance_sessions
for delete
to authenticated
using (
  public.is_current_user_admin()
);


-- RECORDS --------------------------------------------

drop policy if exists attendance_records_select
  on public.attendance_records;

create policy attendance_records_select
on public.attendance_records
for select
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (
        public.is_current_user_club_leader()
        or public.can_access_team(s.team_id)
      )
  )
);


drop policy if exists attendance_records_insert
  on public.attendance_records;

create policy attendance_records_insert
on public.attendance_records
for insert
to authenticated
with check (
  exists (
    select 1
    from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (
        public.is_current_user_club_leader()
        or (
          public.current_user_role() in ('coach', 'team_staff')
          and public.can_access_team(s.team_id)
        )
      )
  )
  and created_by = auth.uid()
);


drop policy if exists attendance_records_update
  on public.attendance_records;

create policy attendance_records_update
on public.attendance_records
for update
to authenticated
using (
  exists (
    select 1
    from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (
        public.is_current_user_club_leader()
        or (
          public.current_user_role() in ('coach', 'team_staff')
          and public.can_access_team(s.team_id)
        )
      )
  )
)
with check (
  exists (
    select 1
    from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (
        public.is_current_user_club_leader()
        or (
          public.current_user_role() in ('coach', 'team_staff')
          and public.can_access_team(s.team_id)
        )
      )
  )
);


drop policy if exists attendance_records_delete
  on public.attendance_records;

create policy attendance_records_delete
on public.attendance_records
for delete
to authenticated
using (
  public.is_current_user_admin()
);


-- ------------------------------------------------------------
-- 6. DROITS TABLES
-- ------------------------------------------------------------

revoke all on public.attendance_sessions from anon;
revoke all on public.attendance_records from anon;

grant select, insert, update, delete
  on public.attendance_sessions
  to authenticated;

grant select, insert, update, delete
  on public.attendance_records
  to authenticated;
