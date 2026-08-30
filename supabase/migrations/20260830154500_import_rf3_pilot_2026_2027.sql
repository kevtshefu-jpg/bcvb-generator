-- GO-LIVE 06C.1 — import transactionnel, fixe et idempotent du pilote RF3.
-- Cette RPC ne reçoit aucun payload : seules les données approuvées ci-dessous
-- peuvent être créées. Toute anomalie lève une exception et annule l'appel.

begin;

create or replace function public.import_rf3_pilot_2026_2027()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $$
declare
  actor_id uuid := auth.uid();
  target_team_id uuid;
  target_profile_id uuid;
  source_player record;
  target_player_id uuid;
  matched_count integer;
  team_created integer := 0;
  team_reused integer := 0;
  players_created integer := 0;
  players_reused integer := 0;
  memberships_created integer := 0;
  memberships_reused integer := 0;
  staff_created integer := 0;
  staff_reused integer := 0;
  staff_result jsonb;
begin
  if actor_id is null then
    raise exception 'Authentification requise.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = actor_id
      and lower(p.role) = 'admin'
      and p.is_active is true
      and p.profile_status = 'active'
  ) then
    raise exception 'Import RF3 réservé à un administrateur actif.' using errcode = '42501';
  end if;

  -- Le verrou logique sérialise les appels de cette RPC. Les verrous de tables
  -- empêchent en plus une écriture concurrente par un autre chemin officiel.
  perform pg_advisory_xact_lock(hashtextextended('bcvb:rf3:2026-2027', 0));
  lock table public.teams in share row exclusive mode;
  lock table public.players in share row exclusive mode;
  lock table public.team_memberships in share row exclusive mode;
  lock table public.team_staff_assignments in share row exclusive mode;

  select count(*), (array_agg(t.id order by t.id))[1]
  into matched_count, target_team_id
  from public.teams t
  where lower(btrim(t.name)) = lower('RF3 - SF')
    and t.category = 'Seniors'
    and t.level = 'RF3'
    and t.season = '2026-2027';

  if matched_count > 1 then
    raise exception 'Plusieurs équipes RF3 - SF 2026-2027 correspondent.' using errcode = '22023';
  elsif matched_count = 0 then
    if exists (
      select 1 from public.teams t
      where lower(btrim(t.name)) = lower('RF3 - SF')
        and (t.category, t.level, t.season) is distinct from ('Seniors', 'RF3', '2026-2027')
    ) then
      raise exception 'Une équipe RF3 - SF incompatible existe déjà.' using errcode = '22023';
    end if;

    insert into public.teams(name, category, level, season, created_by)
    values ('RF3 - SF', 'Seniors', 'RF3', '2026-2027', actor_id)
    returning id into target_team_id;
    team_created := 1;
  else
    team_reused := 1;
  end if;

  for source_player in
    select * from (values
      ('Chiara'::text,   'DELGADO'::text,    '2005-01-21'::date, 'VT052472'::text),
      ('Melis'::text,    'DEMIR VIDAL'::text,'1998-07-13'::date, 'VT986831'::text),
      ('Elisa'::text,    'DESBIOLLES'::text, '2002-10-02'::date, 'VT026946'::text),
      ('Tiphaine'::text, 'GREUZARD'::text,   '2005-08-04'::date, 'VT054548'::text),
      ('Emma'::text,     'HINGUE'::text,     '2005-01-27'::date, 'VT050954'::text),
      ('Chloe'::text,    'LAVAL'::text,      '2002-09-06'::date, 'VT025564'::text),
      ('Katleen'::text,  'MATRION'::text,    '2003-04-30'::date, 'VT031276'::text)
    ) as approved(first_name, last_name, birth_date, license_number)
  loop
    select count(*), (array_agg(p.id order by p.id))[1]
    into matched_count, target_player_id
    from public.players p
    where upper(btrim(p.license_number)) = upper(btrim(source_player.license_number));

    if matched_count > 1 then
      raise exception 'Licence dupliquée dans players: %', source_player.license_number using errcode = '22023';
    elsif matched_count = 0 then
      insert into public.players(first_name, last_name, birth_date, category, license_number, created_by)
      values (
        source_player.first_name,
        source_player.last_name,
        source_player.birth_date,
        'Seniors',
        upper(btrim(source_player.license_number)),
        actor_id
      )
      returning id into target_player_id;
      players_created := players_created + 1;
    else
      if not exists (
        select 1 from public.players p
        where p.id = target_player_id
          and lower(btrim(p.first_name)) = lower(btrim(source_player.first_name))
          and lower(btrim(p.last_name)) = lower(btrim(source_player.last_name))
          and p.birth_date = source_player.birth_date
          and p.category = 'Seniors'
          and p.archived_at is null
          and p.deleted_at is null
      ) then
        raise exception 'Identité incompatible pour la licence %', source_player.license_number using errcode = '22023';
      end if;
      players_reused := players_reused + 1;
    end if;

    select count(*)
    into matched_count
    from public.team_memberships tm
    where tm.player_id = target_player_id
      and tm.team_id = target_team_id
      and tm.season = '2026-2027';

    if matched_count > 1 then
      raise exception 'Membership RF3 dupliqué pour la licence %', source_player.license_number using errcode = '22023';
    elsif matched_count = 0 then
      insert into public.team_memberships(player_id, team_id, season, status, created_by)
      values (target_player_id, target_team_id, '2026-2027', 'active', actor_id);
      memberships_created := memberships_created + 1;
    elsif not exists (
      select 1 from public.team_memberships tm
      where tm.player_id = target_player_id
        and tm.team_id = target_team_id
        and tm.season = '2026-2027'
        and tm.status = 'active'
    ) then
      raise exception 'Membership RF3 incompatible pour la licence %', source_player.license_number using errcode = '22023';
    else
      memberships_reused := memberships_reused + 1;
    end if;
  end loop;

  select count(*), (array_agg(p.id order by p.id))[1]
  into matched_count, target_profile_id
  from public.profiles p
  where lower(btrim(p.full_name)) = lower('Kevin TSHEFU')
    and p.is_active is true
    and p.profile_status = 'active';

  if matched_count <> 1 then
    raise exception 'Le profil actif du head coach RF3 est absent ou ambigu.' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.team_staff_assignments tsa
    where tsa.team_id = target_team_id
      and tsa.assignment_role = 'head_coach'
      and tsa.is_active is true
      and tsa.profile_id <> target_profile_id
  ) then
    raise exception 'Un autre head coach actif est déjà affecté à RF3.' using errcode = '22023';
  end if;

  select count(*)
  into matched_count
  from public.team_staff_assignments tsa
  where tsa.team_id = target_team_id
    and tsa.profile_id = target_profile_id
    and tsa.assignment_role = 'head_coach';

  if matched_count > 1 then
    raise exception 'Affectation head coach RF3 dupliquée.' using errcode = '22023';
  elsif matched_count = 1 then
    if not exists (
      select 1 from public.team_staff_assignments tsa
      where tsa.team_id = target_team_id
        and tsa.profile_id = target_profile_id
        and tsa.assignment_role = 'head_coach'
        and tsa.is_active is true
    ) then
      raise exception 'Affectation head coach RF3 inactive.' using errcode = '22023';
    end if;
    staff_reused := 1;
  else
    staff_result := public.assign_team_staff(target_team_id, target_profile_id, 'head_coach');
    if coalesce((staff_result->>'ok')::boolean, false) is not true then
      raise exception 'Affectation head coach RF3 non confirmée.' using errcode = '22023';
    end if;
    staff_created := 1;
  end if;

  if (
    select count(*) from public.players p
    where upper(btrim(p.license_number)) in ('VT052472','VT986831','VT026946','VT054548','VT050954','VT025564','VT031276')
  ) <> 7 then
    raise exception 'Validation finale des joueuses RF3 en échec.' using errcode = '22023';
  end if;

  if (
    select count(*) from public.team_memberships tm
    where tm.team_id = target_team_id and tm.season = '2026-2027' and tm.status = 'active'
  ) <> 7 then
    raise exception 'Validation finale des memberships RF3 en échec.' using errcode = '22023';
  end if;

  return jsonb_build_object(
    'team_created', team_created,
    'team_reused', team_reused,
    'players_created', players_created,
    'players_reused', players_reused,
    'memberships_created', memberships_created,
    'memberships_reused', memberships_reused,
    'staff_created', staff_created,
    'staff_reused', staff_reused,
    'team_id', target_team_id,
    'status', case
      when team_created + players_created + memberships_created + staff_created = 0 then 'ALREADY_IMPORTED'
      else 'IMPORTED'
    end
  );
end;
$$;

alter function public.import_rf3_pilot_2026_2027() owner to postgres;
revoke all on function public.import_rf3_pilot_2026_2027() from public, anon, authenticated, service_role;
grant execute on function public.import_rf3_pilot_2026_2027() to authenticated;

comment on function public.import_rf3_pilot_2026_2027() is
  'Import fixe, atomique et idempotent du dataset pilote RF3 2026-2027 approuvé.';

commit;
