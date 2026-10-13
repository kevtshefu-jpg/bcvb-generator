-- P12.36: legacy to_review sessions must pass the same duration check before publication.
begin;
create or replace function public.publish_session(
  target_session_id uuid,
  expected_version bigint,
  target_visibility text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  current_row public.sessions;
  saved public.sessions;
  planned_minutes bigint;
  block_count bigint;
  invalid_blocks bigint;
begin
  if auth.uid() is null or not public.is_current_user_admin() then
    raise exception 'Publication interdite.' using errcode = '42501';
  end if;
  if expected_version is null then
    raise exception 'Version attendue manquante.' using errcode = '22023';
  end if;
  if target_visibility is null or target_visibility not in ('team', 'club') then
    raise exception 'Visibilité de publication invalide.' using errcode = '22023';
  end if;

  select * into current_row
  from public.sessions
  where id = target_session_id
  for update;

  if current_row.id is null then
    raise exception 'Séance introuvable ou inaccessible.' using errcode = '42501';
  end if;
  if current_row.deleted_at is not null then
    raise exception 'Séance supprimée.' using errcode = '42501';
  end if;
  if current_row.version <> expected_version then
    raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode = 'PT409';
  end if;
  if current_row.status <> 'to_review' then
    raise exception 'Seule une séance à relire peut être publiée.' using errcode = '22023';
  end if;

  select coalesce(sum(duration_minutes), 0), count(*),
    count(*) filter (where duration_minutes is null or duration_minutes <= 0)
    into planned_minutes, block_count, invalid_blocks
    from public.session_situations where session_id = target_session_id;
  if current_row.duration_minutes is null or current_row.duration_minutes <= 0
    or block_count = 0 or invalid_blocks > 0 or planned_minutes <> current_row.duration_minutes then
    raise exception 'Durée de séance incohérente : vérifier les blocs avant publication.' using errcode = '22023';
  end if;

  update public.sessions
  set visibility = target_visibility,
      status = 'published',
      published_at = now(),
      archived_at = null,
      version = version + 1
  where id = target_session_id
    and version = expected_version
  returning * into saved;

  if saved.id is null then
    raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode = 'PT409';
  end if;

  insert into public.session_visibility_logs(session_id, action, user_id)
  values (saved.id, 'published', auth.uid());

  return jsonb_build_object(
    'id', saved.id,
    'version', saved.version,
    'status', saved.status,
    'visibility', saved.visibility,
    'updated_at', saved.updated_at,
    'published_at', saved.published_at
  );
end;
$$
alter function public.publish_session(uuid,bigint,text) owner to postgres;
revoke all on function public.publish_session(uuid,bigint,text) from public,anon;
grant execute on function public.publish_session(uuid,bigint,text) to authenticated,service_role;
commit;
