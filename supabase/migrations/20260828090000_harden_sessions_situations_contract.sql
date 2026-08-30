-- GO-03D.2 — contrat serveur canonique Sessions / Situations.
-- Les transitions officielles seront portées par des RPC dédiées en GO-03D.5.

begin;

-- Les valeurs ci-dessous ont plusieurs sens dans le client historique. Une
-- migration de contrat ne peut donc pas choisir leur destination sans règle
-- métier de transition dédiée.
do $$
declare
  ambiguous_value text;
begin
  select string_agg(distinct value, ', ' order by value)
  into ambiguous_value
  from (
    select visibility as value from public.sessions where visibility in ('public_technicians', 'archived')
    union all
    select visibility from public.situations where visibility in ('public_technicians', 'archived')
    union all
    select status from public.sessions where status in ('ready-court', 'ready-pdf')
    union all
    select status from public.situations where status in ('ready-court', 'ready-pdf')
  ) legacy_values;

  if ambiguous_value is not null then
    raise exception
      'Migration GO-03D.2 interrompue : valeurs historiques ambiguës détectées (%). Leur conversion exige une décision métier explicite.',
      ambiguous_value;
  end if;
end
$$;

-- Le client historique associe explicitement club_reference à la publication
-- comme référence BCVB ; sa destination canonique est donc club.
update public.sessions
set visibility = 'club'
where visibility = 'club_reference';

update public.situations
set visibility = 'club'
where visibility = 'club_reference';

do $$
declare
  invalid_values text;
begin
  select string_agg(distinct visibility, ', ' order by visibility)
  into invalid_values
  from public.sessions
  where visibility not in ('private', 'team', 'club', 'public');
  if invalid_values is not null then
    raise exception 'Visibilités sessions non prises en charge : %', invalid_values;
  end if;

  select string_agg(distinct visibility, ', ' order by visibility)
  into invalid_values
  from public.situations
  where visibility not in ('private', 'team', 'club', 'public');
  if invalid_values is not null then
    raise exception 'Visibilités situations non prises en charge : %', invalid_values;
  end if;

  select string_agg(distinct status, ', ' order by status)
  into invalid_values
  from public.sessions
  where status not in ('draft', 'to_review', 'validated', 'published', 'archived');
  if invalid_values is not null then
    raise exception 'Statuts sessions non pris en charge : %', invalid_values;
  end if;

  select string_agg(distinct status, ', ' order by status)
  into invalid_values
  from public.situations
  where status not in ('draft', 'to_review', 'validated', 'published', 'archived');
  if invalid_values is not null then
    raise exception 'Statuts situations non pris en charge : %', invalid_values;
  end if;
end
$$;

alter table public.sessions
  add column if not exists version bigint not null default 1;
alter table public.situations
  add column if not exists version bigint not null default 1;

alter table public.sessions
  drop constraint if exists sessions_visibility_check,
  add constraint sessions_visibility_check
    check (visibility in ('private', 'team', 'club', 'public')),
  drop constraint if exists sessions_status_check,
  add constraint sessions_status_check
    check (status in ('draft', 'to_review', 'validated', 'published', 'archived')),
  drop constraint if exists sessions_version_check,
  add constraint sessions_version_check check (version >= 1),
  drop constraint if exists sessions_content_without_situations_check,
  add constraint sessions_content_without_situations_check
    check (not (content_json ? 'situations')) not valid;

alter table public.situations
  drop constraint if exists situations_visibility_check,
  add constraint situations_visibility_check
    check (visibility in ('private', 'team', 'club', 'public')),
  drop constraint if exists situations_status_check,
  add constraint situations_status_check
    check (status in ('draft', 'to_review', 'validated', 'published', 'archived')),
  drop constraint if exists situations_version_check,
  add constraint situations_version_check check (version >= 1);

do $$
begin
  if exists (
    select 1 from public.session_situations
    group by session_id, order_index having count(*) > 1
  ) then
    raise exception 'Doublons session_situations(session_id, order_index) détectés.';
  end if;
  if exists (
    select 1 from public.session_tags
    group by session_id, tag having count(*) > 1
  ) then
    raise exception 'Doublons session_tags(session_id, tag) détectés.';
  end if;
  if exists (
    select 1 from public.situation_tags
    group by situation_id, tag having count(*) > 1
  ) then
    raise exception 'Doublons situation_tags(situation_id, tag) détectés.';
  end if;
end
$$;

alter table public.session_situations
  drop constraint if exists session_situations_session_order_key,
  add constraint session_situations_session_order_key unique (session_id, order_index);
alter table public.session_tags
  drop constraint if exists session_tags_session_tag_key,
  add constraint session_tags_session_tag_key unique (session_id, tag);
alter table public.situation_tags
  drop constraint if exists situation_tags_situation_tag_key,
  add constraint situation_tags_situation_tag_key unique (situation_id, tag);

create or replace function public.touch_sessions_situations_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.touch_sessions_situations_updated_at() from public, anon, authenticated;

drop trigger if exists sessions_touch_updated_at on public.sessions;
create trigger sessions_touch_updated_at
before update on public.sessions
for each row execute function public.touch_sessions_situations_updated_at();

drop trigger if exists situations_touch_updated_at on public.situations;
create trigger situations_touch_updated_at
before update on public.situations
for each row execute function public.touch_sessions_situations_updated_at();

drop trigger if exists session_situations_touch_updated_at on public.session_situations;
create trigger session_situations_touch_updated_at
before update on public.session_situations
for each row execute function public.touch_sessions_situations_updated_at();

create or replace function public.can_read_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.sessions s
    where s.id = target_session_id
      and public.current_user_role() <> 'inactive'
      and (
        public.is_current_user_admin()
        or (s.visibility = 'private' and auth.uid() in (s.owner_id, s.coach_id))
        or (s.visibility = 'team' and (auth.uid() in (s.owner_id, s.coach_id) or public.can_access_team(s.team_id)))
        or s.visibility in ('club', 'public')
      )
  ), false)
$$;

create or replace function public.can_write_session(target_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.sessions s
    where s.id = target_session_id
      and (
        public.is_current_user_admin()
        or (
          public.current_user_role() = 'coach'
          and s.status = 'draft'
          and auth.uid() in (s.owner_id, s.coach_id)
          and public.can_access_team(s.team_id)
        )
      )
  ), false)
$$;

create or replace function public.can_read_situation(target_situation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.situations s
    where s.id = target_situation_id
      and public.current_user_role() <> 'inactive'
      and (
        public.is_current_user_admin()
        or (s.visibility = 'private' and auth.uid() in (s.owner_id, s.created_by))
        or (s.visibility = 'team' and (auth.uid() in (s.owner_id, s.created_by) or public.can_access_team(s.team_id)))
        or s.visibility in ('club', 'public')
      )
  ), false)
$$;

create or replace function public.can_write_situation(target_situation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(exists (
    select 1
    from public.situations s
    where s.id = target_situation_id
      and (
        public.is_current_user_admin()
        or (
          public.current_user_role() = 'coach'
          and s.status = 'draft'
          and auth.uid() in (s.owner_id, s.created_by)
          and public.can_access_team(s.team_id)
        )
      )
  ), false)
$$;

alter function public.can_read_session(uuid) owner to postgres;
alter function public.can_write_session(uuid) owner to postgres;
alter function public.can_read_situation(uuid) owner to postgres;
alter function public.can_write_situation(uuid) owner to postgres;
revoke all on function public.can_read_session(uuid) from public, anon;
revoke all on function public.can_write_session(uuid) from public, anon;
revoke all on function public.can_read_situation(uuid) from public, anon;
revoke all on function public.can_write_situation(uuid) from public, anon;
grant execute on function public.can_read_session(uuid) to authenticated, service_role;
grant execute on function public.can_write_session(uuid) to authenticated, service_role;
grant execute on function public.can_read_situation(uuid) to authenticated, service_role;
grant execute on function public.can_write_situation(uuid) to authenticated, service_role;

create or replace function public.protect_session_update_contract()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() = 'service_role'
     or public.is_current_user_admin() then
    return new;
  end if;
  if public.current_user_role() <> 'coach'
     or old.status <> 'draft'
     or new.status <> 'draft'
     or old.owner_id is distinct from new.owner_id
     or old.coach_id is distinct from new.coach_id
     or old.team_id is distinct from new.team_id then
    raise exception 'Modification directe de la séance interdite.' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function public.protect_situation_update_contract()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.role() = 'service_role'
     or public.is_current_user_admin() then
    return new;
  end if;
  if public.current_user_role() <> 'coach'
     or old.status <> 'draft'
     or new.status <> 'draft'
     or old.owner_id is distinct from new.owner_id
     or old.created_by is distinct from new.created_by
     or old.team_id is distinct from new.team_id then
    raise exception 'Modification directe de la situation interdite.' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function public.protect_session_update_contract() from public, anon, authenticated;
revoke all on function public.protect_situation_update_contract() from public, anon, authenticated;

drop trigger if exists protect_session_update_contract_trigger on public.sessions;
create trigger protect_session_update_contract_trigger
before update on public.sessions
for each row execute function public.protect_session_update_contract();

drop trigger if exists protect_situation_update_contract_trigger on public.situations;
create trigger protect_situation_update_contract_trigger
before update on public.situations
for each row execute function public.protect_situation_update_contract();

do $$
declare
  secured_table text;
  existing_policy record;
begin
  foreach secured_table in array array[
    'sessions', 'session_situations', 'session_tags', 'session_files',
    'session_visibility_logs', 'situations', 'situation_tags', 'session_imports'
  ] loop
    for existing_policy in
      select policyname from pg_policies
      where schemaname = 'public' and tablename = secured_table
    loop
      execute format('drop policy if exists %I on public.%I', existing_policy.policyname, secured_table);
    end loop;
    execute format('alter table public.%I enable row level security', secured_table);
    execute format('alter table public.%I force row level security', secured_table);
  end loop;
end
$$;

create policy sessions_select on public.sessions
for select to authenticated using (public.can_read_session(id));
create policy sessions_insert on public.sessions
for insert to authenticated with check (
  public.is_current_user_admin()
  or (
    public.current_user_role() = 'coach'
    and status = 'draft'
    and visibility in ('private', 'team')
    and owner_id = auth.uid()
    and coach_id = auth.uid()
    and team_id is not null
    and public.can_access_team(team_id)
  )
);
create policy sessions_update on public.sessions
for update to authenticated
using (public.can_write_session(id))
with check (public.is_current_user_admin() or (
  public.current_user_role() = 'coach'
  and status = 'draft'
  and owner_id = auth.uid()
  and coach_id = auth.uid()
  and team_id is not null
  and public.can_access_team(team_id)
));
create policy sessions_delete on public.sessions
for delete to authenticated using (public.is_current_user_admin());

create policy situations_select on public.situations
for select to authenticated using (public.can_read_situation(id));
create policy situations_insert on public.situations
for insert to authenticated with check (
  public.is_current_user_admin()
  or (
    public.current_user_role() = 'coach'
    and status = 'draft'
    and visibility in ('private', 'team')
    and owner_id = auth.uid()
    and created_by = auth.uid()
    and team_id is not null
    and public.can_access_team(team_id)
  )
);
create policy situations_update on public.situations
for update to authenticated
using (public.can_write_situation(id))
with check (public.is_current_user_admin() or (
  public.current_user_role() = 'coach'
  and status = 'draft'
  and owner_id = auth.uid()
  and created_by = auth.uid()
  and team_id is not null
  and public.can_access_team(team_id)
));
create policy situations_delete on public.situations
for delete to authenticated using (public.is_current_user_admin());

create policy session_situations_select on public.session_situations
for select to authenticated using (public.can_read_session(session_id));
create policy session_situations_write on public.session_situations
for all to authenticated
using (public.can_write_session(session_id))
with check (public.can_write_session(session_id));

create policy session_tags_select on public.session_tags
for select to authenticated using (public.can_read_session(session_id));
create policy session_tags_write on public.session_tags
for all to authenticated
using (public.can_write_session(session_id))
with check (public.can_write_session(session_id));

create policy session_files_select on public.session_files
for select to authenticated using (public.can_read_session(session_id));
create policy session_files_write on public.session_files
for all to authenticated
using (public.can_write_session(session_id))
with check (public.can_write_session(session_id));

create policy situation_tags_select on public.situation_tags
for select to authenticated using (public.can_read_situation(situation_id));
create policy situation_tags_write on public.situation_tags
for all to authenticated
using (public.can_write_situation(situation_id))
with check (public.can_write_situation(situation_id));

create policy session_imports_select on public.session_imports
for select to authenticated using (
  public.is_current_user_admin()
  or (
    created_by = auth.uid()
    and (session_id is null or public.can_read_session(session_id))
    and (situation_id is null or public.can_read_situation(situation_id))
  )
);
create policy session_imports_insert on public.session_imports
for insert to authenticated with check (
  public.is_current_user_admin()
  or (
    public.current_user_role() = 'coach'
    and created_by = auth.uid()
    and (session_id is null or public.can_write_session(session_id))
    and (situation_id is null or public.can_write_situation(situation_id))
  )
);
create policy session_imports_update on public.session_imports
for update to authenticated
using (public.is_current_user_admin() or created_by = auth.uid())
with check (
  public.is_current_user_admin()
  or (
    public.current_user_role() = 'coach'
    and created_by = auth.uid()
    and (session_id is null or public.can_write_session(session_id))
    and (situation_id is null or public.can_write_situation(situation_id))
  )
);
create policy session_imports_delete on public.session_imports
for delete to authenticated using (public.is_current_user_admin() or (
  public.current_user_role() = 'coach'
  and created_by = auth.uid()
  and (session_id is null or public.can_write_session(session_id))
  and (situation_id is null or public.can_write_situation(situation_id))
));

create policy session_visibility_logs_select on public.session_visibility_logs
for select to authenticated using (public.can_read_session(session_id));
create policy session_visibility_logs_insert on public.session_visibility_logs
for insert to authenticated with check (
  user_id = auth.uid() and public.can_write_session(session_id)
);

revoke all on public.sessions, public.situations, public.session_situations,
  public.session_tags, public.situation_tags, public.session_files,
  public.session_imports, public.session_visibility_logs from anon;
revoke all on public.sessions, public.situations, public.session_situations,
  public.session_tags, public.situation_tags, public.session_files,
  public.session_imports, public.session_visibility_logs from authenticated;

grant select, insert, update, delete on public.sessions, public.situations,
  public.session_situations, public.session_tags, public.situation_tags,
  public.session_files, public.session_imports to authenticated;
grant select, insert on public.session_visibility_logs to authenticated;

grant all on public.sessions, public.situations, public.session_situations,
  public.session_tags, public.situation_tags, public.session_files,
  public.session_imports, public.session_visibility_logs to service_role;

comment on column public.sessions.version is
  'Version de concurrence. Son incrément contrôlé est réservé à la future RPC transactionnelle GO-03D.4.';
comment on column public.situations.version is
  'Version de concurrence. Son incrément contrôlé est réservé à la future RPC transactionnelle GO-03D.4.';
comment on constraint sessions_content_without_situations_check on public.sessions is
  'Les situations embarquées sont canoniques dans session_situations, pas dans sessions.content_json.';

commit;
