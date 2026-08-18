-- GO-02C — Planning opérationnel partagé du club.
-- Aucun référentiel de lieux n'existe encore : le MVP stocke un libellé libre
-- location_name. Une FK pourra le remplacer lorsqu'un référentiel sera validé.

begin;

create table public.training_slots (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams(id) on delete cascade,
  season text not null check (btrim(season) <> ''),
  weekday smallint not null check (weekday between 1 and 7),
  start_time time not null,
  end_time time not null,
  location_name text null,
  valid_from date not null,
  valid_until date null,
  is_active boolean not null default true,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time),
  check (valid_until is null or valid_until >= valid_from)
);

create index training_slots_team_active_idx on public.training_slots(team_id, is_active);
create index training_slots_week_location_idx on public.training_slots(weekday, lower(location_name), start_time, end_time) where is_active;

create table public.training_slot_exceptions (
  id uuid primary key default gen_random_uuid(),
  training_slot_id uuid not null references public.training_slots(id) on delete cascade,
  exception_date date not null,
  exception_type text not null check (exception_type in ('cancelled', 'moved', 'modified')),
  start_time time null,
  end_time time null,
  location_name text null,
  reason text null,
  created_by uuid null references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(training_slot_id, exception_date),
  check (start_time is null or end_time is null or end_time > start_time)
);

alter table public.training_slots enable row level security;
alter table public.training_slot_exceptions enable row level security;

create policy training_slots_select_scope on public.training_slots
for select to authenticated
using (public.is_current_user_club_leader() or public.can_access_team(team_id));

create policy training_slot_exceptions_select_scope on public.training_slot_exceptions
for select to authenticated
using (exists (
  select 1 from public.training_slots slot
  where slot.id = training_slot_id
    and (public.is_current_user_club_leader() or public.can_access_team(slot.team_id))
));

create or replace function public.find_training_slot_conflicts(
  target_team_id uuid,
  target_weekday smallint,
  target_start_time time,
  target_end_time time,
  target_location_name text,
  target_valid_from date,
  target_valid_until date default null,
  excluded_slot_id uuid default null
)
returns table (id uuid, team_id uuid, team_name text, start_time time, end_time time, location_name text)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select slot.id, slot.team_id, team.name, slot.start_time, slot.end_time, slot.location_name
  from public.training_slots slot
  join public.teams team on team.id = slot.team_id
  where slot.is_active is true
    and slot.id is distinct from excluded_slot_id
    and target_location_name is not null and btrim(target_location_name) <> ''
    and slot.location_name is not null and btrim(slot.location_name) <> ''
    and lower(btrim(slot.location_name)) = lower(btrim(target_location_name))
    and slot.weekday = target_weekday
    and slot.start_time < target_end_time and slot.end_time > target_start_time
    and daterange(slot.valid_from, coalesce(slot.valid_until, 'infinity'::date), '[]')
        && daterange(target_valid_from, coalesce(target_valid_until, 'infinity'::date), '[]')
$$;
alter function public.find_training_slot_conflicts(uuid,smallint,time,time,text,date,date,uuid) owner to postgres;
revoke all on function public.find_training_slot_conflicts(uuid,smallint,time,time,text,date,date,uuid) from public, anon;
revoke all on function public.find_training_slot_conflicts(uuid,smallint,time,time,text,date,date,uuid) from authenticated;
grant execute on function public.find_training_slot_conflicts(uuid,smallint,time,time,text,date,date,uuid) to service_role;

create or replace function public.save_training_slot(
  target_slot_id uuid,
  target_team_id uuid,
  target_season text,
  target_weekday smallint,
  target_start_time time,
  target_end_time time,
  target_location_name text,
  target_valid_from date,
  target_valid_until date default null,
  allow_conflict boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor_role text;
  saved_id uuid;
  conflicts jsonb;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode = '42501'; end if;
  select case when is_active and profile_status = 'active'
    then case when lower(role) = 'technical_manager' then 'responsable_technique' else lower(role) end
    else 'inactive' end into actor_role
  from public.profiles where id = auth.uid();
  if actor_role not in ('admin', 'responsable_technique') then
    raise exception 'Modification du planning opérationnel interdite.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.teams where id = target_team_id and archived_at is null) then
    raise exception 'Équipe introuvable.' using errcode = 'P0002';
  end if;
  if target_weekday not between 1 and 7 then raise exception 'Jour invalide.' using errcode = '22023'; end if;
  if target_start_time is null or target_end_time is null or target_end_time <= target_start_time then
    raise exception 'Horaire invalide.' using errcode = '22023';
  end if;
  if btrim(coalesce(target_season, '')) = '' then raise exception 'Saison requise.' using errcode = '22023'; end if;
  if target_valid_from is null or (target_valid_until is not null and target_valid_until < target_valid_from) then
    raise exception 'Période de validité invalide.' using errcode = '22023';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(concat_ws('|', target_weekday, lower(btrim(coalesce(target_location_name, '')))), 0));
  select coalesce(jsonb_agg(to_jsonb(conflict_row)), '[]'::jsonb) into conflicts
  from public.find_training_slot_conflicts(target_team_id, target_weekday, target_start_time, target_end_time,
    nullif(btrim(target_location_name), ''), target_valid_from, target_valid_until, target_slot_id) conflict_row;
  if jsonb_array_length(conflicts) > 0 and not allow_conflict then
    return jsonb_build_object('ok', false, 'code', 'SLOT_CONFLICT', 'conflicts', conflicts);
  end if;

  if target_slot_id is null then
    insert into public.training_slots(team_id, season, weekday, start_time, end_time, location_name, valid_from, valid_until, created_by)
    values(target_team_id, btrim(target_season), target_weekday, target_start_time, target_end_time,
      nullif(btrim(target_location_name), ''), target_valid_from, target_valid_until, auth.uid()) returning id into saved_id;
  else
    update public.training_slots set team_id=target_team_id, season=btrim(target_season), weekday=target_weekday,
      start_time=target_start_time, end_time=target_end_time, location_name=nullif(btrim(target_location_name), ''),
      valid_from=target_valid_from, valid_until=target_valid_until, updated_at=now()
    where id=target_slot_id returning id into saved_id;
    if saved_id is null then raise exception 'Créneau introuvable.' using errcode = 'P0002'; end if;
  end if;
  return jsonb_build_object('ok', true, 'slot_id', saved_id, 'conflicts', conflicts);
end;
$$;
alter function public.save_training_slot(uuid,uuid,text,smallint,time,time,text,date,date,boolean) owner to postgres;
revoke all on function public.save_training_slot(uuid,uuid,text,smallint,time,time,text,date,date,boolean) from public, anon;
grant execute on function public.save_training_slot(uuid,uuid,text,smallint,time,time,text,date,date,boolean) to authenticated, service_role;

create or replace function public.deactivate_training_slot(target_slot_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor_role text; affected integer;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  select case when is_active and profile_status='active' then case when lower(role)='technical_manager' then 'responsable_technique' else lower(role) end else 'inactive' end
    into actor_role from public.profiles where id=auth.uid();
  if actor_role not in ('admin','responsable_technique') then raise exception 'Modification du planning opérationnel interdite.' using errcode='42501'; end if;
  update public.training_slots set is_active=false, updated_at=now() where id=target_slot_id and is_active=true;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Créneau introuvable ou déjà inactif.' using errcode='P0002'; end if;
  return jsonb_build_object('ok',true,'slot_id',target_slot_id);
end $$;
alter function public.deactivate_training_slot(uuid) owner to postgres;
revoke all on function public.deactivate_training_slot(uuid) from public,anon;
grant execute on function public.deactivate_training_slot(uuid) to authenticated,service_role;

commit;
