do $$
begin
  execute 'alter function public.delete_profile_atomically(uuid, uuid) owner to postgres';
  execute 'revoke all on function public.delete_profile_atomically(uuid, uuid) from public, anon, service_role';
  execute 'grant execute on function public.delete_profile_atomically(uuid, uuid) to authenticated';
  execute 'comment on function public.delete_profile_atomically(uuid, uuid) is ''Suppression transactionnelle. admin_notifications sert provisoirement de journal ; ce n’est pas un audit log immuable.''';
end
$$;
