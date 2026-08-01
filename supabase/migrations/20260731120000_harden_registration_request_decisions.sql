begin;

-- Réservation atomique utilisée exclusivement par create-approved-user.
-- Une seule transaction peut faire passer pending (ou approved/email failed
-- lors d'une reprise explicite) à processing. Le contrôle service_role évite
-- qu'un client authentifié contourne la frontière Edge.
create or replace function public.claim_registration_request_approval(
  request_id uuid,
  approved_by_value uuid,
  retry_activation boolean default false
)
returns public.registration_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  claimed_row public.registration_requests;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Appel réservé au service d’approbation.' using errcode = '42501';
  end if;

  update public.registration_requests
  set status = 'processing',
      approved_by = approved_by_value,
      updated_at = now()
  where id = request_id
    and (
      (retry_activation is false and status = 'pending')
      or (
        retry_activation is true
        and status = 'approved'
        and activation_email_status = 'failed'
      )
    )
  returning * into claimed_row;

  if claimed_row is null then
    if exists (select 1 from public.registration_requests where id = request_id) then
      raise sqlstate 'PT409' using message = 'Demande déjà traitée ou en cours.';
    end if;
    raise sqlstate 'PT404' using message = 'Demande introuvable.';
  end if;

  return claimed_row;
end;
$$;

alter function public.claim_registration_request_approval(uuid, uuid, boolean) owner to postgres;
revoke all on function public.claim_registration_request_approval(uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.claim_registration_request_approval(uuid, uuid, boolean) to service_role;

-- Les décisions d'inscription ne doivent jamais dépendre d'un UPDATE émis par
-- le navigateur. Cette RPC effectue le contrôle de rôle et la transition dans
-- une seule instruction, ce qui rend un second refus impossible.
create or replace function public.reject_registration_request(
  request_id uuid,
  admin_note_value text default null
)
returns public.registration_requests
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  updated_row public.registration_requests;
begin
  if not public.is_current_user_admin() then
    raise exception 'Accès administrateur requis.' using errcode = '42501';
  end if;

  update public.registration_requests
  set status = 'rejected',
      rejected_by = auth.uid(),
      rejected_at = now(),
      admin_note = nullif(trim(admin_note_value), ''),
      updated_at = now()
  where id = request_id and status = 'pending'
  returning * into updated_row;

  if updated_row is null then
    if exists (select 1 from public.registration_requests where id = request_id) then
      raise sqlstate 'PT409' using message = 'Demande déjà traitée.';
    end if;
    raise sqlstate 'PT404' using message = 'Demande introuvable.';
  end if;

  return updated_row;
end;
$$;

alter function public.reject_registration_request(uuid, text) owner to postgres;
revoke all on function public.reject_registration_request(uuid, text) from public, anon;
grant execute on function public.reject_registration_request(uuid, text) to authenticated;

-- Même un administrateur ne modifie plus directement les demandes : les RPC
-- et la fonction Edge (service_role) sont les seules frontières d'écriture.
drop policy if exists registration_requests_admin_update on public.registration_requests;
drop policy if exists profile_requests_admin_update on public.profile_requests;

commit;
