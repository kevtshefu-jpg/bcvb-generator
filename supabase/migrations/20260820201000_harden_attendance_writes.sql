begin;

drop policy if exists attendance_sessions_insert
  on public.attendance_sessions;

create policy attendance_sessions_insert
on public.attendance_sessions
for insert
to authenticated
with check (
  created_by = auth.uid()
  and (
    public.is_current_user_club_leader()
    or (
      public.current_user_role() = 'coach'
      and public.can_access_team(team_id)
    )
  )
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
    public.current_user_role() = 'coach'
    and public.can_access_team(team_id)
  )
)
with check (
  public.is_current_user_club_leader()
  or (
    public.current_user_role() = 'coach'
    and public.can_access_team(team_id)
  )
);

drop policy if exists attendance_records_insert
  on public.attendance_records;

create policy attendance_records_insert
on public.attendance_records
for insert
to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1
    from public.attendance_sessions s
    where s.id = attendance_records.session_id
      and (
        public.is_current_user_club_leader()
        or (
          public.current_user_role() = 'coach'
          and public.can_access_team(s.team_id)
        )
      )
  )
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
          public.current_user_role() = 'coach'
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
          public.current_user_role() = 'coach'
          and public.can_access_team(s.team_id)
        )
      )
  )
);

commit;
