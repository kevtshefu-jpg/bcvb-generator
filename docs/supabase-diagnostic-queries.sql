-- BCVB Referentiel - Diagnostic Supabase/Auth/RLS
-- Date: 2026-06-22
--
-- Objectif:
-- Comprendre pourquoi un compte admin peut etre affiche comme membre cote front.
--
-- Mode d'emploi:
-- 1. Lancer d'abord les sections DIAGNOSTIC en lecture seule.
-- 2. Ne lancer la section CORRECTION OPTIONNELLE que si les diagnostics montrent
--    que kevtshefu@gmail.com n'est pas admin dans public.profiles.
-- 3. Apres correction, deconnecter/reconnecter l'utilisateur et vider le cache navigateur.

-- ============================================================
-- 1. Verifier utilisateur Auth + profil public.profiles
-- ============================================================

select
  u.id as auth_user_id,
  u.email as auth_email,
  u.raw_user_meta_data,
  u.raw_app_meta_data,
  p.id as profile_id,
  p.email as profile_email,
  p.full_name,
  p.role,
  p.is_active,
  p.profile_status,
  p.category_id,
  p.created_at,
  p.updated_at
from auth.users u
left join public.profiles p on p.id = u.id
where u.email = 'kevtshefu@gmail.com';

-- ============================================================
-- 2. Verifier les doublons profiles par email
-- ============================================================

select
  email,
  count(*) as profile_count,
  array_agg(id order by created_at desc nulls last) as profile_ids,
  array_agg(role order by created_at desc nulls last) as roles
from public.profiles
where email is not null
group by email
having count(*) > 1
order by profile_count desc, email;

-- ============================================================
-- 3. Verifier toutes les lignes liees a Kevin
-- ============================================================

select *
from public.profiles
where email = 'kevtshefu@gmail.com'
   or id in (
     select id from auth.users where email = 'kevtshefu@gmail.com'
   );

-- ============================================================
-- 4. Verifier les tables critiques
-- ============================================================

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'registration_requests',
    'profile_requests',
    'admin_notifications',
    'admin_notification_preferences',
    'library_documents',
    'document_ai_results',
    'document_ai_generation_requests',
    'import_batches',
    'import_rows',
    'teams',
    'players',
    'sessions',
    'situations',
    'player_content_unlocks',
    'ai_expert_modes'
  )
order by table_name;

-- ============================================================
-- 5. Verifier les colonnes critiques
-- ============================================================

select
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'profiles',
    'registration_requests',
    'profile_requests',
    'admin_notifications',
    'admin_notification_preferences',
    'library_documents',
    'document_ai_results',
    'document_ai_generation_requests',
    'import_batches',
    'import_rows',
    'teams',
    'players',
    'sessions',
    'situations',
    'player_content_unlocks',
    'ai_expert_modes'
  )
order by table_name, ordinal_position;

-- ============================================================
-- 6. Verifier RLS
-- ============================================================

select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'registration_requests',
    'profile_requests',
    'admin_notifications',
    'admin_notification_preferences',
    'library_documents',
    'document_ai_results',
    'document_ai_generation_requests',
    'import_batches',
    'import_rows',
    'teams',
    'players',
    'sessions',
    'situations',
    'player_content_unlocks',
    'ai_expert_modes'
  )
order by tablename;

-- ============================================================
-- 7. Verifier policies
-- ============================================================

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- ============================================================
-- 8. Verifier fonctions de securite et RPC profile_requests
-- ============================================================

select
  p.proname,
  pg_get_functiondef(p.oid) as definition
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in (
    'is_current_user_admin',
    'approve_profile_request',
    'reject_profile_request',
    'set_updated_at'
  )
order by p.proname;

-- ============================================================
-- 9. Verifier migrations appliquees
-- ============================================================

select
  version,
  name
from supabase_migrations.schema_migrations
order by version desc;

-- ============================================================
-- 10. Verifier dernieres inscriptions
-- ============================================================

select *
from public.registration_requests
order by created_at desc
limit 20;

-- ============================================================
-- 11. Verifier dernieres demandes de profil
-- ============================================================

select *
from public.profile_requests
order by created_at desc
limit 20;

-- ============================================================
-- 12. Verifier dernieres notifications admin
-- ============================================================

select *
from public.admin_notifications
order by created_at desc
limit 20;

-- ============================================================
-- 13. Verifier preferences notifications
-- ============================================================

select *
from public.admin_notification_preferences
order by event_type;

-- ============================================================
-- 14. Test de lecture profiles equivalent au front
-- Remplacer l'UUID par auth_user_id de kevtshefu@gmail.com si necessaire.
-- ============================================================

select
  id,
  email,
  full_name,
  role,
  is_active,
  category_id
from public.profiles
where id = '5ed361d8-da68-4354-9e60-b2b27b624611';

-- ============================================================
-- 15. CORRECTION OPTIONNELLE - NE PAS LANCER PAR DEFAUT
-- A executer uniquement si les diagnostics montrent que Kevin n'est PAS admin.
-- ============================================================

/*
insert into public.profiles (
  id,
  email,
  full_name,
  role,
  profile_status,
  is_active,
  created_at,
  updated_at
)
select
  u.id,
  u.email,
  'Kevin Tshefu',
  'admin',
  'active',
  true,
  now(),
  now()
from auth.users u
where u.email = 'kevtshefu@gmail.com'
on conflict (id) do update
set
  email = excluded.email,
  full_name = 'Kevin Tshefu',
  role = 'admin',
  profile_status = 'active',
  is_active = true,
  updated_at = now();
*/

