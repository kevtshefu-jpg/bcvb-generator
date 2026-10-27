-- BCVB GO05: diagnostic du catalogue et des policies (lecture seule).
-- LABORATOIRE LOCAL ISOLÉ UNIQUEMENT ; jamais production / préproduction.
-- Aucune donnée de joueur, contenu documentaire ou chemin Storage n'est extrait.
-- Vérifier le projet cible et la connexion AVANT exécution.
BEGIN TRANSACTION READ ONLY;

-- Colonnes / contraintes : schéma documentaire.
SELECT column_name, data_type, udt_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'library_documents'
ORDER BY ordinal_position;

SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = to_regclass('public.library_documents')
ORDER BY conname;

-- RLS effectives sur le catalogue et les objets Storage.
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE (schemaname = 'public' AND tablename = 'library_documents')
   OR (schemaname = 'storage' AND tablename = 'objects')
ORDER BY schemaname, tablename, policyname;

SELECT n.nspname AS schema_name, c.relname AS table_name,
       c.relrowsecurity AS rls_enabled, c.relforcerowsecurity AS force_rls
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname = 'public' AND c.relname = 'library_documents')
   OR (n.nspname = 'storage' AND c.relname = 'objects');

-- Privilèges et RPC (métadonnées uniquement).
SELECT grantee, privilege_type, is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public' AND table_name = 'library_documents'
ORDER BY grantee, privilege_type;

SELECT n.nspname AS schema_name, p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS args,
       p.prosecdef AS security_definer, p.proconfig AS configuration,
       pg_get_userbyid(p.proowner) AS owner
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND (p.proname ILIKE '%library%' OR p.proname ILIKE '%document%')
ORDER BY p.proname, args;

-- Triggers / index documentaires.
SELECT tgname, pg_get_triggerdef(oid) AS definition
FROM pg_trigger
WHERE tgrelid = to_regclass('public.library_documents') AND NOT tgisinternal
ORDER BY tgname;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'library_documents'
ORDER BY indexname;

-- Présence de schémas de contrôle Storage, sans lire les objets.
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'storage_access'
ORDER BY table_name;

ROLLBACK;
