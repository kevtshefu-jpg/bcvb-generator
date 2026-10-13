-- P12.35: enforce exact minute accounting on the trusted server transition.
-- Draft saves remain allowed; do not apply to production until deployment gates are cleared.
begin;
create or replace function public.submit_session_for_review(target_session_id uuid, expected_version bigint)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare current_row public.sessions; saved public.sessions;
  planned_minutes bigint; block_count bigint; invalid_blocks bigint;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  if expected_version is null then raise exception 'Version attendue manquante.' using errcode='22023'; end if;
  select * into current_row from public.sessions where id=target_session_id for update;
  if current_row.id is null then raise exception 'Séance introuvable ou inaccessible.' using errcode='42501'; end if;
  if public.current_user_role()<>'coach' or (auth.uid() is distinct from current_row.owner_id and auth.uid() is distinct from current_row.coach_id) or not public.can_access_team(current_row.team_id) then raise exception 'Soumission interdite.' using errcode='42501'; end if;
  if current_row.deleted_at is not null then raise exception 'Séance supprimée.' using errcode='42501'; end if;
  if current_row.version<>expected_version then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  if current_row.status<>'draft' then raise exception 'Seul un draft peut être soumis.' using errcode='22023'; end if;
  select coalesce(sum(duration_minutes), 0), count(*),
    count(*) filter (where duration_minutes is null or duration_minutes <= 0)
    into planned_minutes, block_count, invalid_blocks
    from public.session_situations where session_id=target_session_id;
  if current_row.duration_minutes is null or current_row.duration_minutes <= 0
    or block_count=0 or invalid_blocks>0 or planned_minutes<>current_row.duration_minutes then
    raise exception 'Durée de séance incohérente : vérifier les blocs avant soumission.' using errcode='22023';
  end if;
  update public.sessions set status='to_review',version=version+1 where id=target_session_id and version=expected_version returning * into saved;
  if saved.id is null then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  insert into public.session_visibility_logs(session_id,action,user_id) values(saved.id,'submitted_for_review',auth.uid());
  return jsonb_build_object('id',saved.id,'version',saved.version,'status',saved.status,'updated_at',saved.updated_at);
end $$;

alter function public.submit_session_for_review(uuid,bigint) owner to postgres;
revoke all on function public.submit_session_for_review(uuid,bigint) from public,anon;
grant execute on function public.submit_session_for_review(uuid,bigint) to authenticated,service_role;
commit;
