# Audit Supabase / Front / Edge Functions - BCVB Referentiel

Date: 2026-06-22  
Branche auditee: `main`  
Mode: audit sans correction applicative

## 1. Resume executif

Le compte `kevtshefu@gmail.com` est correctement configure comme administrateur dans la base Supabase distante.

Resultat de diagnostic distant:

| Point verifie | Resultat |
|---|---|
| `auth.users.email` | `kevtshefu@gmail.com` |
| `auth.users.id` | `5ed361d8-da68-4354-9e60-b2b27b624611` |
| `public.profiles.id` | `5ed361d8-da68-4354-9e60-b2b27b624611` |
| `public.profiles.email` | `kevtshefu@gmail.com` |
| `public.profiles.role` | `admin` |
| `public.profiles.is_active` | `true` |
| `public.profiles.profile_status` | `active` |
| doublons `profiles.email` | aucun |

Conclusion courte: si le front affiche encore "Membre", la base distante n'est pas la cause directe. Les causes probables sont cote runtime front: ancienne session/cache navigateur, bundle non relance, environnement Vercel different de `.env.local`, ou fallback `member` active apres erreur de chargement du profil.

## 2. Variables Supabase et client front

Fichiers audites:

| Fichier | Etat |
|---|---|
| `.env.local` | `VITE_SUPABASE_URL=https://leziahqmqyuewpzjmzxf.supabase.co`, pas de `/rest/v1/` |
| `.env.example` | contient un exemple d'URL racine `https://your-project-ref.supabase.co` |
| `src/lib/supabase.ts` | un seul client front, normalise l'URL et retire `/rest/v1` si present |
| `vite.config.ts` | pas de logique Supabase |
| `vercel.json` | uniquement rewrite SPA |

Recherche:

| Recherche | Resultat |
|---|---|
| `supabaseClient` | aucune occurrence dans `src` |
| `createClient` | uniquement `src/lib/supabase.ts` cote front, et `create-approved-user` cote Edge Function |
| `/rest/v1` | aucune occurrence active hors historique de diagnostic |

Risque restant: les variables Vercel ne sont pas lisibles depuis ce poste. Il faut verifier dans Vercel que `VITE_SUPABASE_URL` ne contient pas `/rest/v1/` et pointe sur le meme projet `leziahqmqyuewpzjmzxf`.

## 3. Requetes front Supabase

Tables et fonctions appelees par le front:

| Table / fonction | Fichiers principaux | Actions | Risque |
|---|---|---|---|
| `profiles` | `AuthContext.tsx`, `profilesService.ts`, `AdminPage.tsx`, `importValidationService.ts` | select, insert | critique pour roles; fallback `member` si erreur/no row |
| `registration_requests` | `registrationService.ts`, `publicRegistrationService.ts`, `registrationApprovalService.ts`, `registrationDiagnosticsService.ts` | insert, select, update, delete diagnostic | stable, colonnes presentes en distant |
| `profile_requests` | `profileRequestService.ts`, `publicRegistrationService.ts`, `AdminPage.tsx` | insert, select, update, rpc | stable, RPC presentes |
| `admin_notifications` | `adminNotificationService.ts`, `adminActionNotificationService.ts`, `publicRegistrationService.ts`, `AdminPage.tsx` | insert, select, update | stable, mais policies redondantes |
| `admin_notification_preferences` | `adminNotificationPreferencesService.ts`, `adminActionNotificationService.ts` | select, upsert, update | stable |
| `library_documents` | `LibraryPage`, `libraryService.ts`, `DocumentReaderPage.tsx`, `manualGeneratedDocuments.ts` | select, insert, update | table distante plus riche que migration initiale; RLS off |
| `document_ai_generation_requests` | `aiGenerationRequestService.ts` | insert/select | table distante presente; admin only via RLS |
| `document_ai_results` | `aiResultsService.ts` | select | policies public larges |
| `ai_expert_modes` | `aiExpertModesService.ts` | select | table distante presente |
| `import_batches`, `import_rows` | import services | insert, select, update | table presente mais non listee dans les migrations locales actuelles |
| `player_content_unlocks` | `unlocksService.ts` | select, upsert, delete | table presente; policies staff |
| `players`, `teams` | roster/team modules | via services dedies ou donnees locales | tables presentes |
| `sessions`, `situations` | sessions modules | schema present | RLS off |
| `notify-profile-request` | `publicRegistrationService.ts`, `registrationDiagnosticsService.ts` | `functions.invoke` | fonction absente du dossier `supabase/functions`; non bloquante dans le formulaire |
| `create-approved-user` | `registrationApprovalService.ts` | `functions.invoke` | bloquante pour validation admin; role protege |
| `generate-ai-document` | `generateAIDocument.ts` | `functions.invoke` | fonction stub OK mais pas generation reelle |

## 4. Migrations et schema distant

Migrations locales presentes:

| Migration | Couverture |
|---|---|
| `20260604072700_sessions_studio.sql` | `sessions`, `session_situations`, `session_tags`, `session_files`, `session_visibility_logs` |
| `20260604083000_session_situation_imports.sql` | colonnes supplementaires `sessions`, `situations`, `situation_tags`, `session_imports` |
| `20260605090000_roster_management.sql` | `players`, `teams`, `team_memberships`, `player_contacts`, `roster_import_batches`, `player_duplicate_candidates`, `player_passports` |
| `20260621151847_registration_profiles_notifications.sql` | `registration_requests`, `profile_requests`, `admin_notifications`, `admin_notification_preferences`, `profiles`, RPC profile requests |

Tables critiques presentes en distant:

`profiles`, `registration_requests`, `profile_requests`, `admin_notifications`, `admin_notification_preferences`, `library_documents`, `document_ai_results`, `document_ai_generation_requests`, `ai_expert_modes`, `players`, `teams`, `sessions`, `situations`, `player_content_unlocks`.

Points importants:

- La migration `20260621151847_registration_profiles_notifications.sql` est appliquee en distant.
- Les RPC `approve_profile_request` et `reject_profile_request` existent.
- La fonction SQL `is_current_user_admin()` existe et considere `admin` et `responsable_technique` comme roles eleves.
- `library_documents` existe en distant avec `delete_reason`, `deleted_at`, `archived_at`; la migration documentaire historique ne couvre pas tout ce schema.
- `import_batches` et `import_rows` existent en distant mais ne sont pas couverts par les migrations locales visibles dans ce repo.

## 5. RLS / policies

RLS distant:

| Table | RLS |
|---|---|
| `profiles` | active |
| `registration_requests` | active |
| `profile_requests` | active |
| `admin_notifications` | active |
| `admin_notification_preferences` | active |
| `document_ai_generation_requests` | active |
| `document_ai_results` | active |
| `ai_expert_modes` | active |
| `library_documents` | inactive |
| `players`, `teams`, `sessions`, `situations` | inactive |

Policies notables:

- `profiles`: lecture authenticated permissive `true`, donc Kevin doit pouvoir lire son profil.
- `profiles`: plusieurs policies coexistent (`Authenticated can read profiles`, `debug_all_profiles`, `profiles_select_own`, `profiles_select_staff`). C'est redondant mais pas bloquant.
- `profiles`: update authenticated permissive `true` + update staff admin. Risque de securite a durcir plus tard.
- `admin_notifications`: policies admin via `is_current_user_admin()` et policies permissives authenticated. Redondant.
- `registration_requests`: policies publiques et staff coexistent. Redondant mais fonctionnel.

Conclusion RLS: les policies ne semblent pas expliquer l'affichage "Membre"; `profiles` est lisible pour authenticated.

## 6. Audit special Auth / roles

Fichiers audites:

| Fichier | Observation |
|---|---|
| `src/features/auth/context/AuthContext.tsx` | charge `profiles` par `id = currentUser.id`; si erreur ou absence de profil, construit un fallback |
| `src/features/auth/components/RequireAuth.tsx` | compare les roles normalises |
| `src/components/auth/RequireRole.tsx` | utilise `normalizeRole` |
| `src/config/roles.ts` | normalise `membre` en `member` et `technical_manager` en `responsable_technique` |
| `src/components/navigation/TopBar.tsx` | affiche `formatRole(profile?.role)` |
| `src/components/navigation/PrimaryNavigation.tsx` | check admin sans normalisation locale, mais role `admin` fonctionne |
| `src/components/navigation/Sidebar.tsx` | filtre via `siteCategories.canAccessCategory` |

Causes possibles du role "Membre":

1. Fallback `member` dans `AuthContext`
   - Si la requete `profiles` echoue, timeout, ou renvoie `null`, `buildFallbackProfile()` peut produire `member`.
   - Pour Kevin, `auth.users.raw_user_meta_data` et `raw_app_meta_data` ne contiennent pas `role = admin`; donc le fallback ne peut pas reconstruire admin depuis Auth metadata.

2. Cache/session navigateur
   - Une ancienne session Supabase ou un ancien bundle Vite peut conserver un etat membre jusqu'a deconnexion/reconnexion et refresh fort.

3. Environnement de production/Vercel
   - `.env.local` est correct, mais Vercel peut encore avoir une ancienne valeur `VITE_SUPABASE_URL` avec `/rest/v1/`, un autre project ref, ou une ancienne build.

4. UI lue avant rechargement profil
   - `TopBar` affiche directement `profile?.role`. Si `profile` vaut fallback `member`, toute la navigation admin disparait.

5. Trace debug persistante
   - `AuthContext.tsx` contient un `console.log('[AuthContext] user/profile', ...)` aux lignes 158-165. Utile temporairement pour diagnostiquer, mais a retirer ensuite.

Cause la plus probable a ce stade: le profil distant est bon, donc l'interface affiche "Membre" parce que le chargement `profiles` cote navigateur tombe en fallback `member` ou parce que l'app execute encore une ancienne build/session.

## 7. Edge Functions

Fonctions presentes localement:

| Fonction | Etat |
|---|---|
| `create-approved-user` | utilise `SUPABASE_SERVICE_ROLE_KEY`, lit `registration_requests`, cree/retrouve Auth user, upsert `profiles`, update statuses; ne fait pas d'OpenAI |
| `generate-ai-document` | stub simple `success: true` |
| `ai-openai` | appelle OpenAI, pas lie aux roles |
| `ai-anthropic` | appelle Anthropic, pas lie aux roles |
| `notify-profile-request` | appelee par le front mais absente localement |

Audit `create-approved-user`:

- Verifie l'appelant via `profiles.role` et `is_active`.
- Autorise `admin` et `responsable_technique`.
- Protege les roles existants `admin` et `responsable_technique` avant upsert.
- Retourne des erreurs JSON lisibles.

Risque: il faut redeployer l'Edge Function si le code local a change mais pas la fonction distante.

## 8. Colonnes utilisees mais a surveiller

| Table | Colonnes front a surveiller | Etat distant |
|---|---|---|
| `profiles` | `id`, `email`, `full_name`, `role`, `is_active`, `category_id`, `profile_status` | presentes |
| `registration_requests` | `requested_team`, `requested_role`, `requested_category`, `approved_by`, `approved_at` | presentes |
| `profile_requests` | `requested_team`, `requested_category_id`, `admin_note`, `decided_by`, `decided_at` | presentes |
| `admin_notifications` | `recipient_role`, `metadata`, `read_at` | presentes |
| `library_documents` | nombreux champs typage front (`quality_score`, `allowed_roles`, `source_path`, etc.) | certains sont optionnels dans TS; diagnostic SQL necessaire si erreur schema |
| `document_ai_generation_requests` | `document_id`, `requested_by`, `generation_type`, `target_audience`, `options_json`, `status` | presentes |

## 9. SQL de diagnostic cree

Fichier cree:

`docs/supabase-diagnostic-queries.sql`

Il contient:

- verification `auth.users` + `profiles`;
- detection des doublons;
- verification tables critiques;
- verification colonnes;
- verification RLS;
- verification policies;
- verification fonctions SQL;
- verification migrations appliquees;
- dernieres inscriptions / profile requests / notifications;
- correction admin optionnelle commentee.

## 10. Build

Commande executee:

`npm run build`

Resultat:

OK. `tsc && vite build` passent. Warning Vite habituel sur chunks volumineux.

## 11. Corrections recommandees, non appliquees automatiquement

### Priorite 1 - Diagnostic navigateur

Objectif: prouver si le front charge le bon profil ou tombe en fallback.

Actions:

1. Ouvrir la console navigateur.
2. Recharger apres deconnexion/reconnexion.
3. Lire le log `AuthContext user/profile`.
4. Verifier:
   - `userId` = `5ed361d8-da68-4354-9e60-b2b27b624611`
   - `userEmail` = `kevtshefu@gmail.com`
   - `profileId` = `5ed361d8-da68-4354-9e60-b2b27b624611`
   - `role` = `admin`

Si `profileId` est vide ou `role = member`, la requete `profiles` echoue ou renvoie fallback.

### Priorite 2 - Verifier Vercel/env

Objectif: s'assurer que la production pointe vers le bon projet.

Verifier dans Vercel:

- `VITE_SUPABASE_URL=https://leziahqmqyuewpzjmzxf.supabase.co`
- pas de `/rest/v1/`;
- pas d'autre project ref;
- redeployer apres changement.

### Priorite 3 - Nettoyage AuthContext

Objectif: eviter que le fallback masque les erreurs.

Correction front proposee:

- remplacer le fallback silencieux `member` par un etat "profil indisponible" pour les routes admin;
- conserver une erreur lisible si `profiles` ne charge pas;
- retirer le `console.log` permanent apres diagnostic;
- eventuellement ajouter un bouton `refreshProfile`.

### Priorite 4 - Metadata Auth admin optionnelle

Objectif: offrir un secours si `profiles` ne charge pas.

Correction SQL/console Supabase proposee:

- ajouter `role: admin` dans `raw_user_meta_data` ou `raw_app_meta_data` de Kevin si souhaitable.
- Ce n'est pas indispensable si `profiles` charge correctement.

### Priorite 5 - Redepolyer Edge Function

Objectif: garantir que `create-approved-user` distant conserve les roles eleves.

Commande:

`supabase functions deploy create-approved-user`

### Priorite 6 - Durcir RLS plus tard

Objectif: securite.

Les policies actuelles sont volontairement permissives sur plusieurs tables. A durcir apres stabilisation:

- `profiles update`;
- `admin_notifications`;
- tables avec RLS off (`library_documents`, `sessions`, `situations`, `players`, `teams`).

## 12. Conclusion

Le compte admin existe bien en base distante et les policies `profiles` permettent sa lecture. Le probleme restant est donc tres probablement cote client: session/cache, environnement Vercel, ancienne build, ou fallback `AuthContext` vers `member` apres erreur de chargement.

Le prochain correctif utile n'est pas SQL en premier. Il faut d'abord observer le log `AuthContext` dans le navigateur avec une session fraiche, puis corriger le fallback ou l'environnement selon le resultat.

