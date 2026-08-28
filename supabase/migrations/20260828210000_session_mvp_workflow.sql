-- GO-LIVE 01 — workflow serveur MVP des séances.
begin;

-- Les triggers restent le dernier rempart des écritures directes. En mode
-- invoker, seules les RPC possédées par postgres peuvent effectuer les
-- transitions ; un JWT authenticated ne peut pas usurper current_user.
create or replace function public.protect_session_update_contract()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user = 'postgres' or auth.role() = 'service_role' then return new; end if;
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
set search_path = public, pg_temp
as $$
begin
  if current_user = 'postgres' or auth.role() = 'service_role' then return new; end if;
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

create or replace function public.submit_session_for_review(target_session_id uuid, expected_version bigint)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare current_row public.sessions; saved public.sessions;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  if expected_version is null then raise exception 'Version attendue manquante.' using errcode='22023'; end if;
  select * into current_row from public.sessions where id=target_session_id for update;
  if current_row.id is null then raise exception 'Séance introuvable ou inaccessible.' using errcode='42501'; end if;
  if public.current_user_role()<>'coach' or (auth.uid() is distinct from current_row.owner_id and auth.uid() is distinct from current_row.coach_id) or not public.can_access_team(current_row.team_id) then raise exception 'Soumission interdite.' using errcode='42501'; end if;
  if current_row.deleted_at is not null then raise exception 'Séance supprimée.' using errcode='42501'; end if;
  if current_row.version<>expected_version then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  if current_row.status<>'draft' then raise exception 'Seul un draft peut être soumis.' using errcode='22023'; end if;
  update public.sessions set status='to_review',version=version+1 where id=target_session_id and version=expected_version returning * into saved;
  if saved.id is null then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  insert into public.session_visibility_logs(session_id,action,user_id) values(saved.id,'submitted_for_review',auth.uid());
  return jsonb_build_object('id',saved.id,'version',saved.version,'status',saved.status,'updated_at',saved.updated_at);
end $$;

create or replace function public.publish_session(target_session_id uuid, expected_version bigint)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare current_row public.sessions; saved public.sessions;
begin
  if auth.uid() is null or not public.is_current_user_admin() then raise exception 'Publication interdite.' using errcode='42501'; end if;
  if expected_version is null then raise exception 'Version attendue manquante.' using errcode='22023'; end if;
  select * into current_row from public.sessions where id=target_session_id for update;
  if current_row.id is null then raise exception 'Séance introuvable ou inaccessible.' using errcode='42501'; end if;
  if current_row.deleted_at is not null then raise exception 'Séance supprimée.' using errcode='42501'; end if;
  if current_row.version<>expected_version then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  if current_row.status<>'to_review' then raise exception 'Seule une séance à relire peut être publiée.' using errcode='22023'; end if;
  if current_row.visibility not in ('team','club') then raise exception 'Visibilité incompatible avec la publication MVP.' using errcode='22023'; end if;
  update public.sessions set status='published',published_at=now(),archived_at=null,version=version+1 where id=target_session_id and version=expected_version returning * into saved;
  if saved.id is null then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  insert into public.session_visibility_logs(session_id,action,user_id) values(saved.id,'published',auth.uid());
  return jsonb_build_object('id',saved.id,'version',saved.version,'status',saved.status,'updated_at',saved.updated_at,'published_at',saved.published_at);
end $$;

create or replace function public.archive_session(target_session_id uuid, expected_version bigint)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare current_row public.sessions; saved public.sessions;
begin
  if auth.uid() is null or not public.is_current_user_admin() then raise exception 'Archivage interdit.' using errcode='42501'; end if;
  if expected_version is null then raise exception 'Version attendue manquante.' using errcode='22023'; end if;
  select * into current_row from public.sessions where id=target_session_id for update;
  if current_row.id is null then raise exception 'Séance introuvable ou inaccessible.' using errcode='42501'; end if;
  if current_row.deleted_at is not null then raise exception 'Séance supprimée.' using errcode='42501'; end if;
  if current_row.version<>expected_version then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  if current_row.status<>'published' then raise exception 'Seule une séance publiée peut être archivée.' using errcode='22023'; end if;
  update public.sessions set status='archived',archived_at=now(),version=version+1 where id=target_session_id and version=expected_version returning * into saved;
  if saved.id is null then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  insert into public.session_visibility_logs(session_id,action,user_id) values(saved.id,'archived',auth.uid());
  return jsonb_build_object('id',saved.id,'version',saved.version,'status',saved.status,'updated_at',saved.updated_at,'archived_at',saved.archived_at);
end $$;

create or replace function public.return_session_to_draft(target_session_id uuid, expected_version bigint)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare current_row public.sessions; saved public.sessions;
begin
  if auth.uid() is null or not public.is_current_user_admin() then raise exception 'Retour en correction interdit.' using errcode='42501'; end if;
  if expected_version is null then raise exception 'Version attendue manquante.' using errcode='22023'; end if;
  select * into current_row from public.sessions where id=target_session_id for update;
  if current_row.id is null then raise exception 'Séance introuvable ou inaccessible.' using errcode='42501'; end if;
  if current_row.deleted_at is not null then raise exception 'Séance supprimée.' using errcode='42501'; end if;
  if current_row.version<>expected_version then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  if current_row.status<>'to_review' then raise exception 'Seule une séance à relire peut revenir en correction.' using errcode='22023'; end if;
  update public.sessions set status='draft',published_at=null,archived_at=null,version=version+1 where id=target_session_id and version=expected_version returning * into saved;
  if saved.id is null then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  insert into public.session_visibility_logs(session_id,action,user_id) values(saved.id,'returned_to_draft',auth.uid());
  return jsonb_build_object('id',saved.id,'version',saved.version,'status',saved.status,'updated_at',saved.updated_at);
end $$;

alter function public.submit_session_for_review(uuid,bigint) owner to postgres;
alter function public.publish_session(uuid,bigint) owner to postgres;
alter function public.archive_session(uuid,bigint) owner to postgres;
alter function public.return_session_to_draft(uuid,bigint) owner to postgres;
revoke all on function public.submit_session_for_review(uuid,bigint) from public,anon;
revoke all on function public.publish_session(uuid,bigint) from public,anon;
revoke all on function public.archive_session(uuid,bigint) from public,anon;
revoke all on function public.return_session_to_draft(uuid,bigint) from public,anon;
grant execute on function public.submit_session_for_review(uuid,bigint) to authenticated,service_role;
grant execute on function public.publish_session(uuid,bigint) to authenticated,service_role;
grant execute on function public.archive_session(uuid,bigint) to authenticated,service_role;
grant execute on function public.return_session_to_draft(uuid,bigint) to authenticated,service_role;

commit;
