begin;

-- Expose le cas métier "demande absente ou déjà traitée" à la frontière
-- PostgREST sans modifier les contrôles d'autorisation des RPC.
create or replace function public.approve_profile_request(
  request_id uuid,
  final_role text,
  final_category_id text default null,
  admin_note_value text default null
)
returns public.profile_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_row public.profile_requests;
begin
  if not public.is_current_user_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;
  if lower(coalesce(final_role, '')) not in (
    'admin', 'responsable_technique', 'dirigeant', 'coach', 'team_staff',
    'parent_referent', 'joueur', 'parent', 'benevole', 'arbitre', 'otm', 'member'
  ) then
    raise exception 'Rôle final invalide.' using errcode = '22023';
  end if;
  if lower(final_role) in ('admin', 'responsable_technique')
     and public.current_user_role() <> 'admin' then
    raise exception 'Seul un administrateur peut attribuer un rôle élevé.' using errcode = '42501';
  end if;

  update public.profile_requests
  set requested_role = lower(final_role), requested_category_id = coalesce(final_category_id, requested_category_id),
      admin_note = admin_note_value, status = 'approved', decided_by = auth.uid(),
      decided_at = now(), updated_at = now()
  where id = request_id and status = 'pending'
  returning * into updated_row;

  if updated_row is null then
    raise sqlstate 'PT404'
    using
      message = 'Demande introuvable ou déjà traitée.',
      detail = 'Aucune demande en attente ne correspond à cet identifiant.';
  end if;
  return updated_row;
end;
$$;
alter function public.approve_profile_request(uuid, text, text, text) owner to postgres;

create or replace function public.reject_profile_request(request_id uuid, admin_note_value text default null)
returns public.profile_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_row public.profile_requests;
begin
  if not public.is_current_user_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;
  update public.profile_requests
  set admin_note = admin_note_value, status = 'rejected', decided_by = auth.uid(),
      decided_at = now(), updated_at = now()
  where id = request_id and status = 'pending'
  returning * into updated_row;
  if updated_row is null then
    raise sqlstate 'PT404'
    using
      message = 'Demande introuvable ou déjà traitée.',
      detail = 'Aucune demande en attente ne correspond à cet identifiant.';
  end if;
  return updated_row;
end;
$$;
alter function public.reject_profile_request(uuid, text) owner to postgres;

revoke all on function public.approve_profile_request(uuid, text, text, text) from public, anon;
revoke all on function public.reject_profile_request(uuid, text) from public, anon;
grant execute on function public.approve_profile_request(uuid, text, text, text) to authenticated, service_role;
grant execute on function public.reject_profile_request(uuid, text) to authenticated, service_role;

commit;
