-- GO-03D.4 — création et sauvegarde transactionnelles des séances draft.
begin;

-- Les écritures parent passent désormais exclusivement par les RPC contrôlées.
revoke update on public.sessions, public.situations from authenticated;
revoke insert, update, delete on public.session_situations, public.session_tags from authenticated;
revoke insert, update, delete on public.session_visibility_logs from authenticated;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function public.assert_session_write_payload(payload jsonb)
returns void language plpgsql immutable set search_path = public, pg_temp as $$
declare forbidden text; required text;
begin
  if payload is null or jsonb_typeof(payload) <> 'object' then
    raise exception 'Payload séance invalide.' using errcode = '22023';
  end if;
  select key into forbidden from jsonb_object_keys(payload) key
  where key not in ('title','category','level','theme','sub_theme','visibility','duration_minutes','expected_players','source_type','source_file_name','source_raw_text','source_text','content_json','quality_score') limit 1;
  if forbidden is not null then raise exception 'Champ séance interdit : %.', forbidden using errcode = '22023'; end if;
  foreach required in array array['title','category','level','theme','sub_theme','visibility','source_type','source_file_name','source_raw_text','source_text'] loop
    if not payload ? required or jsonb_typeof(payload->required) <> 'string' then raise exception 'Champ séance requis ou invalide : %.', required using errcode='22023'; end if;
  end loop;
  foreach required in array array['duration_minutes','expected_players','quality_score'] loop
    if not payload ? required or jsonb_typeof(payload->required) <> 'number' or (payload->>required) !~ '^-?[0-9]+$' then raise exception 'Champ séance requis ou invalide : %.', required using errcode='22023'; end if;
  end loop;
  if not payload ? 'content_json' or jsonb_typeof(payload->'content_json') <> 'object' then raise exception 'content_json requis ou invalide.' using errcode = '22023'; end if;
  if payload->'content_json' ? 'situations' then raise exception 'content_json.situations est interdit.' using errcode = '22023'; end if;
end $$;

create or replace function private.replace_session_draft_children(target_session_id uuid, situations_payload jsonb, tags_payload jsonb)
returns void language plpgsql set search_path = public, private, pg_temp as $$
declare item jsonb; clean_tag text; forbidden text; required text; item_id uuid; existing_session_id uuid;
begin
  if situations_payload is null or jsonb_typeof(situations_payload) <> 'array' then raise exception 'Payload situations invalide.' using errcode='22023'; end if;
  if tags_payload is null or jsonb_typeof(tags_payload) <> 'array' then raise exception 'Payload tags invalide.' using errcode='22023'; end if;
  for item in select value from jsonb_array_elements(situations_payload) loop
    if jsonb_typeof(item) <> 'object' then raise exception 'Situation de séance invalide.' using errcode='22023'; end if;
    select key into forbidden from jsonb_object_keys(item) key where key not in ('id','order_index','title','duration_minutes','theme','sub_theme','pedagogical_phase','content_json') limit 1;
    if forbidden is not null then raise exception 'Champ situation interdit : %.', forbidden using errcode='22023'; end if;
    foreach required in array array['title','theme','sub_theme','pedagogical_phase'] loop
      if not item ? required or jsonb_typeof(item->required) <> 'string' then raise exception 'Champ situation requis ou invalide : %.', required using errcode='22023'; end if;
    end loop;
    foreach required in array array['order_index','duration_minutes'] loop
      if not item ? required or jsonb_typeof(item->required) <> 'number' or (item->>required) !~ '^-?[0-9]+$' then raise exception 'Champ situation requis ou invalide : %.', required using errcode='22023'; end if;
    end loop;
    if not item ? 'content_json' or jsonb_typeof(item->'content_json') <> 'object' then raise exception 'content_json situation requis ou invalide.' using errcode='22023'; end if;
    if item ? 'id' then
      if jsonb_typeof(item->'id') <> 'string' or item->>'id' = '' then raise exception 'ID situation invalide.' using errcode='22023'; end if;
      begin item_id := (item->>'id')::uuid; exception when invalid_text_representation then raise exception 'ID situation invalide.' using errcode='22023'; end;
      select session_id into existing_session_id from public.session_situations where id=item_id;
      if existing_session_id is not null and existing_session_id<>target_session_id then raise exception 'ID situation déjà rattaché à une autre séance.' using errcode='22023'; end if;
    end if;
  end loop;
  for item in select value from jsonb_array_elements(tags_payload) loop
    if jsonb_typeof(item) <> 'string' then raise exception 'Chaque tag doit être une chaîne.' using errcode='22023'; end if;
  end loop;
  delete from public.session_situations where session_id=target_session_id;
  for item in select value from jsonb_array_elements(situations_payload) loop
    insert into public.session_situations(id,session_id,order_index,title,duration_minutes,theme,sub_theme,pedagogical_phase,content_json)
    values(coalesce(nullif(item->>'id','')::uuid,gen_random_uuid()),target_session_id,(item->>'order_index')::integer,item->>'title',(item->>'duration_minutes')::integer,
      item->>'theme',item->>'sub_theme',item->>'pedagogical_phase',item->'content_json');
  end loop;
  delete from public.session_tags where session_id=target_session_id;
  for clean_tag in select distinct trim(value #>> '{}') from jsonb_array_elements(tags_payload) where trim(value #>> '{}')<>'' loop
    insert into public.session_tags(session_id,tag) values(target_session_id,clean_tag);
  end loop;
end $$;

-- Signature explicite : identité et rattachement ne sont pas mêlés au payload mutable.
create or replace function public.create_session_draft(target_team_id uuid, target_coach_id uuid, session_payload jsonb, situations_payload jsonb default '[]'::jsonb, tags_payload jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor_role text; saved public.sessions;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  perform public.assert_session_write_payload(session_payload);
  actor_role:=public.current_user_role();
  if target_team_id is null then raise exception 'Équipe requise.' using errcode='22023'; end if;
  if actor_role='coach' then
    if target_coach_id is distinct from auth.uid() or not public.can_access_team(target_team_id) or session_payload->>'visibility' not in ('private','team') then raise exception 'Création de séance interdite.' using errcode='42501'; end if;
  elsif actor_role in ('admin','responsable_technique','technical_manager') then
    if target_coach_id is null then target_coach_id:=auth.uid(); end if;
  else raise exception 'Création de séance interdite.' using errcode='42501'; end if;
  insert into public.sessions(title,category,level,theme,sub_theme,team_id,coach_id,owner_id,visibility,status,duration_minutes,expected_players,source_type,source_file_name,source_raw_text,source_text,content_json,quality_score,version,created_at,updated_at,published_at,archived_at,deleted_at,deleted_by)
  values(session_payload->>'title',session_payload->>'category',coalesce(session_payload->>'level',''),session_payload->>'theme',session_payload->>'sub_theme',target_team_id,target_coach_id,auth.uid(),
    session_payload->>'visibility','draft',(session_payload->>'duration_minutes')::integer,(session_payload->>'expected_players')::integer,session_payload->>'source_type',
    coalesce(session_payload->>'source_file_name',''),coalesce(session_payload->>'source_raw_text',''),coalesce(session_payload->>'source_text',''),coalesce(session_payload->'content_json','{}'::jsonb),
    (session_payload->>'quality_score')::integer,1,now(),now(),null,null,null,null) returning * into saved;
  perform private.replace_session_draft_children(saved.id,situations_payload,tags_payload);
  return jsonb_build_object('id',saved.id,'version',saved.version,'updated_at',saved.updated_at);
end $$;

create or replace function public.save_session_draft(target_session_id uuid, expected_version bigint, session_payload jsonb, situations_payload jsonb, tags_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare actor_role text; current_row public.sessions; saved public.sessions;
begin
  if auth.uid() is null then raise exception 'Authentification requise.' using errcode='42501'; end if;
  if expected_version is null then raise exception 'Version attendue manquante.' using errcode='22023'; end if;
  perform public.assert_session_write_payload(session_payload);
  select * into current_row from public.sessions where id=target_session_id for update;
  if current_row.id is null then raise exception 'Séance introuvable ou inaccessible.' using errcode='42501'; end if;
  actor_role:=public.current_user_role();
  if not (actor_role in ('admin','responsable_technique','technical_manager') or (actor_role='coach' and auth.uid() in (current_row.owner_id,current_row.coach_id) and public.can_access_team(current_row.team_id))) then
    raise exception 'Sauvegarde de séance interdite.' using errcode='42501';
  end if;
  if actor_role='coach' and session_payload->>'visibility' not in ('private','team') then
    raise exception 'Visibilité de séance interdite.' using errcode='42501';
  end if;
  if current_row.deleted_at is not null or current_row.status<>'draft' then raise exception 'Seule une séance draft active peut être sauvegardée.' using errcode='42501'; end if;
  if current_row.version<>expected_version then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  update public.sessions set title=session_payload->>'title',category=session_payload->>'category',level=coalesce(session_payload->>'level',''),theme=session_payload->>'theme',sub_theme=session_payload->>'sub_theme',
    visibility=session_payload->>'visibility',duration_minutes=(session_payload->>'duration_minutes')::integer,expected_players=(session_payload->>'expected_players')::integer,
    source_type=session_payload->>'source_type',source_file_name=coalesce(session_payload->>'source_file_name',''),source_raw_text=coalesce(session_payload->>'source_raw_text',''),source_text=coalesce(session_payload->>'source_text',''),
    content_json=coalesce(session_payload->'content_json','{}'::jsonb),quality_score=(session_payload->>'quality_score')::integer,version=version+1
  where id=target_session_id and version=expected_version returning * into saved;
  if saved.id is null then raise exception 'Cette séance a été modifiée depuis votre dernier chargement.' using errcode='PT409'; end if;
  perform private.replace_session_draft_children(saved.id,situations_payload,tags_payload);
  return jsonb_build_object('id',saved.id,'version',saved.version,'updated_at',saved.updated_at);
end $$;

alter function public.assert_session_write_payload(jsonb) owner to postgres;
alter function private.replace_session_draft_children(uuid,jsonb,jsonb) owner to postgres;
alter function public.create_session_draft(uuid,uuid,jsonb,jsonb,jsonb) owner to postgres;
alter function public.save_session_draft(uuid,bigint,jsonb,jsonb,jsonb) owner to postgres;
revoke all on function public.assert_session_write_payload(jsonb) from public,anon,authenticated;
revoke all on function private.replace_session_draft_children(uuid,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.create_session_draft(uuid,uuid,jsonb,jsonb,jsonb) from public,anon;
revoke all on function public.save_session_draft(uuid,bigint,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.create_session_draft(uuid,uuid,jsonb,jsonb,jsonb) to authenticated,service_role;
grant execute on function public.save_session_draft(uuid,bigint,jsonb,jsonb,jsonb) to authenticated,service_role;

commit;
