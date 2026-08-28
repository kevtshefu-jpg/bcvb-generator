-- Remplace les policies historiques permissives avant l'exécution du contrôle
-- global de 20260719090000_harden_role_and_team_rls.sql.
-- Les tables concernées proviennent d'un schéma historique distant et peuvent
-- être absentes d'une base locale neuve : chaque opération est conditionnelle.

begin;

do $$
declare
  target_table text;
  existing_policy record;
  direct_owner_column text;
  document_owner_column text;
  owner_predicate text;
  admin_predicate constant text := $predicate$
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.is_active is true
        and coalesce(p.profile_status, 'active') = 'active'
        and lower(coalesce(p.role, 'member')) in ('admin', 'responsable_technique', 'technical_manager')
    )
  $predicate$;
begin
  foreach target_table in array array['ai_expert_modes', 'document_ai_results', 'email_events'] loop
    if to_regclass(format('public.%I', target_table)) is null then
      raise notice 'Table public.% absente : aucune policy historique à remplacer.', target_table;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', target_table);
    execute format('alter table public.%I force row level security', target_table);

    -- Supprime toutes les policies de ces tables, pas seulement les quatre noms
    -- connus, afin qu'une autre policy permissive ne se combine pas aux nouvelles.
    for existing_policy in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = target_table
    loop
      execute format('drop policy if exists %I on public.%I', existing_policy.policyname, target_table);
    end loop;

    if target_table = 'ai_expert_modes' then
      execute format(
        'create policy ai_expert_modes_admin_read on public.ai_expert_modes for select to authenticated using (%s)',
        admin_predicate
      );
    elsif target_table = 'email_events' then
      execute format(
        'create policy email_events_admin_read on public.email_events for select to authenticated using (%s)',
        admin_predicate
      );
      -- Aucune policy INSERT/UPDATE/DELETE authenticated : les Edge Functions
      -- écrivent avec service_role, qui possède BYPASSRLS.
    else
      direct_owner_column := null;
      document_owner_column := null;
      owner_predicate := null;

      select c.column_name into direct_owner_column
      from information_schema.columns c
      where c.table_schema = 'public'
        and c.table_name = 'document_ai_results'
        and c.column_name in ('owner_id', 'user_id', 'created_by', 'requested_by')
        and c.udt_name = 'uuid'
      order by array_position(array['owner_id', 'user_id', 'created_by', 'requested_by'], c.column_name)
      limit 1;

      if direct_owner_column is not null then
        owner_predicate := format('%I = auth.uid()', direct_owner_column);
      elsif exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'document_ai_results' and column_name = 'document_id'
      ) and to_regclass('public.library_documents') is not null then
        select c.column_name into document_owner_column
        from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = 'library_documents'
          and c.column_name in ('owner_id', 'user_id', 'created_by', 'author_id')
          and c.udt_name = 'uuid'
        order by array_position(array['owner_id', 'user_id', 'created_by', 'author_id'], c.column_name)
        limit 1;

        if document_owner_column is not null then
          owner_predicate := format(
            'exists (select 1 from public.library_documents d where d.id = document_ai_results.document_id and d.%I = auth.uid())',
            document_owner_column
          );
        end if;
      end if;

      if owner_predicate is null then
        raise notice 'document_ai_results sans propriétaire UUID exploitable : lecture admin uniquement.';
        execute format(
          'create policy document_ai_results_admin_read on public.document_ai_results for select to authenticated using (%s)',
          admin_predicate
        );
      else
        execute format(
          'create policy document_ai_results_owner_or_admin_read on public.document_ai_results for select to authenticated using ((%s) or (%s))',
          admin_predicate,
          owner_predicate
        );
      end if;
      -- Aucune écriture authenticated. Les résultats sont produits côté serveur.
    end if;
  end loop;
end
$$;

commit;
