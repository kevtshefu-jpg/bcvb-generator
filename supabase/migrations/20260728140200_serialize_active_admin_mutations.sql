create or replace function public.protect_profile_security_fields()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  active_admin_count bigint;
  removes_active_admin boolean;
begin
  if auth.uid() is not null
     and not public.is_current_user_admin()
     and (
       new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.profile_status is distinct from old.profile_status
       or new.category_id is distinct from old.category_id
     ) then
    raise exception 'Modification des droits du profil interdite.' using errcode = '42501';
  end if;

  removes_active_admin :=
    old.is_active is true
    and old.profile_status = 'active'
    and lower(coalesce(old.role, '')) = 'admin'
    and not (
      new.is_active is true
      and new.profile_status = 'active'
      and lower(coalesce(new.role, '')) = 'admin'
    );

  if removes_active_admin then
    perform pg_advisory_xact_lock(
      hashtextextended('bcvb:active-admin-mutation', 0)
    );

    select count(*) into active_admin_count
    from public.profiles
    where is_active is true
      and profile_status = 'active'
      and lower(coalesce(role, '')) = 'admin';

    if active_admin_count <= 1 then
      raise sqlstate 'PT409'
      using message = 'Le dernier administrateur actif ne peut pas être modifié.';
    end if;
  end if;

  return new;
end;
$$;
