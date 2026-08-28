do $$
begin
  execute 'alter function public.protect_profile_security_fields() owner to postgres';
  execute 'revoke all on function public.protect_profile_security_fields() from public, anon, authenticated, service_role';
end
$$;
