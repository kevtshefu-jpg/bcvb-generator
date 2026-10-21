# BCVB — Remédiation RLS production, procédure de changement contrôlé

**État : CORRECTIF EN PR, TEST SQL COMPLET SUR COPIE ISOLÉE RÉUSSI, NON DÉPLOYÉ.** Ce document et le SQL manuel associé ne constituent pas une migration automatique. Autorisation métier donnée le 14 octobre 2026 sous réserve de vérification préalable d'une sauvegarde.

## Périmètre confirmé en lecture seule

- Production Supabase : `leziahqmqyuewpzjmzxf`, projet **BCVB Référentiel**, organisation **Free**.
- Préproduction : `rghbzbwmvvnoqwymqyjn`. Les trois tables ciblées y sont **absentes** : cette instance ne peut pas servir de clone de validation fonctionnelle.
- Production : `public.library_documents`, `public.player_content_unlocks`, `public.player_fundamental_progress` existent avec RLS désactivée et des droits SQL directs pour `anon` et `authenticated`.
- Deux tables joueur possèdent trois policies chacune, mais inopérantes tant que RLS est désactivée.
- La bibliothèque n'a aucune policy, avec 22 documents agrégés au 14/10 : 20 `uploaded` et 2 `published` (chiffres à recontrôler avant intervention). Les catégories observées sont `uploaded` et `published`, et les audiences `Interne club`, `Coachs`, `parent`, `member`.
- Le profil est déjà protégé contre la modification non autorisée des rôles par le trigger actif `protect_profile_security_fields_trigger`; sa présence a été confirmée. Ne pas qualifier l'auto-promotion de vulnérabilité démontrée.

## Blocage absolu : sauvegarde hors base vérifiable

Les outils connectés ne donnent **pas accès** à l'état des sauvegardes Supabase ni à un test de restauration. L'organisation est en offre Free : ne pas supposer l'existence d'un point de restauration géré.

Avant tout DDL en production, un opérateur autorisé doit :

1. Produire une sauvegarde **hors de la base de production**, chiffrée, du schéma et des données nécessaires (idéalement export PostgreSQL complet `pg_dump -Fc`), avec un client PostgreSQL compatible et les accès DB conservés exclusivement dans un gestionnaire de secrets.
2. Vérifier que le fichier existe, n'est pas vide, que son format est lisible par `pg_restore -l`, et qu'une restauration dans une base **isolée** est réalisable. Consigner l'heure, la taille, le hash et l'identifiant du contrôle de restauration sans publier de secrets ni de données personnelles.
3. Vérifier les fenêtres de maintenance et la disponibilité d'un administrateur BCVB. Ne jamais déposer le dump dans GitHub, ChatGPT, un bucket public ou le dépôt.
4. Relever un état initial des policies, grants, RLS, nombre de lignes par table (agrégats uniquement) et la présence du trigger protecteur des profils.

Sans confirmation du contrôle de restauration, **ne pas exécuter** `ops/manual/production-rls-hardening-2026-10-14.sql`.

## Résultats de l'audit isolé du 20–21 octobre 2026

- Trois exports SQL partiels (rôles, schéma, données publiques) ont été contrôlés par empreinte et restaurés dans un conteneur PostgreSQL isolé sans réseau ni ports publiés. **Il ne s'agit pas d'une sauvegarde complète Supabase** : les utilisateurs Auth réels, objets Storage et autres composants ne sont pas restaurés. Cela ne satisfait pas, à lui seul, le prérequis de sauvegarde restaurable pour une intervention en production.
- Le test du script d'origine avec comptes fictifs a révélé que des profils inactifs pouvaient lire leurs propres déblocages et progressions. Les politiques staff vérifiaient les rôles bruts, sans contrôler l'activation du profil.
- Un correctif candidat a passé des essais transactionnels de lecture et d'écriture : coach actif autorisé sur les écritures prévues, coach inactif et joueur refusés, propriétaire actif autorisé en lecture, propriétaire inactif refusé. La révocation des droits TRUNCATE, TRIGGER et REFERENCES a également été vérifiée. Chaque essai a été annulé par ROLLBACK et les compteurs de fixtures ont été vérifiés à zéro.
- **Validation complémentaire du script complet corrigé : RÉUSSIE (21/10/2026).** L'opérateur a exécuté sur le conteneur PostgreSQL isolé le fichier SQL GitHub identifié par son empreinte, en remplaçant exclusivement le `COMMIT` final par `ROLLBACK`. Journal observé : `BEGIN`, préflight `DO`, cinq `CREATE POLICY`, six `ALTER POLICY`, trois `REVOKE`, trois `ALTER TABLE`, deux contrôles `DO`, `NOTICE: OK : SCRIPT COMPLET ET CONTROLES`, puis `ROLLBACK`. Vérification après transaction : `rls_actives=0`, `policies_bibliotheque=0`, `policies_joueur=6`. Le script complet passe donc ses contrôles sur la copie restaurée et celle-ci retrouve son état initial. **Ce résultat ne démontre ni le fonctionnement des API PostgREST/Storage ni l'existence d'une sauvegarde de production complète restaurable.**
- La sauvegarde restaurée contient 7 fiches `players`, 6 profils, 7 appartenances d'équipe actives et une affectation staff active, mais aucune correspondance `players.id = profiles.id` et aucun `players.owner_id` renseigné. Les tables de progression référencent `profiles.id`, les appartenances référencent `players.id`. Ne pas inventer de jointure canonique ; le cloisonnement des progressions par équipe est un chantier séparé.
- Les 22 documents de bibliothèque restaurés sont tous marqués `deleted_at IS NOT NULL`. La politique actuelle de lecture staff n'exclut pas les documents supprimés logiquement ni les brouillons : **décision métier et test fonctionnel requis** avant production.

## Blocages applicatifs et Storage détectés le 21 octobre 2026

- **[Issue #111 — Déblocages joueur](https://github.com/kevtshefu-jpg/bcvb-generator/issues/111)** : l'ancien client exécutait un `upsert` avec `ON CONFLICT DO UPDATE` sur `player_content_unlocks`, sans politique RLS `UPDATE`. Un correctif applicatif inclus dans cette PR utilise désormais `INSERT` puis, exclusivement en cas de conflit unique `23505`, une lecture ciblée de la ligne existante. Quatre tests Vitest de service sont ajoutés et exécutés par CI. **Validation PostgREST réelle sur copie isolée encore requise** ; ne pas élargir les permissions sans décision et test.
- **[Issue #112 — Storage bibliothèque](https://github.com/kevtshefu-jpg/bcvb-generator/issues/112)** : le bucket réel `Bcvb-library` est privé (8 objets), mais une policy `storage.objects` permet à tout `authenticated` de lire les objets du bucket sans contrôle de profil actif, de propriétaire ou d'audience. RLS sur les métadonnées `library_documents` ne protège donc pas à lui seul les fichiers. Les 22 fiches `library_documents` utilisent toutes `bucket_name = 'bcvb-library'`, tandis que le bucket réel est `Bcvb-library` : décalage de casse systématique confirmé, sans test d'accès aux fichiers. Deux policies visent aussi la casse différente, et `manualGeneratedDocuments.ts` l'utilise dans ses écritures. Aucune lecture de fichier réel n'a été effectuée.
- **[Issue #113 — Suppression logique](https://github.com/kevtshefu-jpg/bcvb-generator/issues/113)** : en production, les 22 fiches ont `deleted_at IS NOT NULL` **et** `is_active = true` ; deux conservent `status = 'published'`. `fetchLibraryDocuments()` filtre uniquement `is_active`, tandis que la lecture staff de la PR ne filtre pas `deleted_at`. Clarifier les droits de lecture de la corbeille et la politique de restauration ; ne pas réactiver ni supprimer les fiches sans décision.
- **Corrélation Storage (agrégats seulement)** : 8 objets dans `Bcvb-library`, 1 seul lié à une fiche par chemin et comparaison de bucket insensible à la casse, aucun lié à une fiche non supprimée. Les 8 objets ont `owner_id IS NULL` et `owner IS NULL`. **21 fiches** ont un `content` texte non vide sans objet Storage correspondant ; **1 fiche** sans contenu texte correspond au seul objet rattaché ; **7 objets** restent sans fiche correspondante. `saveManualGeneratedDocument()` stocke le texte directement en base tout en enregistrant un chemin Storage fictif, sans téléversement. Ne pas traiter ces 21 chemins comme des fichiers à créer automatiquement, ni restreindre les objets seulement par propriétaire ou par document actif sans décision métier.
- **Décision** : ces trois sujets sont des contrôles bloquants pour le **déploiement**, à traiter sans modifications de production ni élargissement improvisé des droits. Le correctif SQL de la PR #110 reste limité aux trois tables publiques.

## Contrôle réexécutable sans mutation

- Fichier : `ops/manual/production-rls-storage-readonly-audit-2026-10-21.sql`.
- Ce script est **uniquement en lecture** et retourne des agrégats de RLS, de privilèges, de cycle de vie des documents et de liaison Storage. Aucun nom de document, chemin d'objet, UUID d'utilisateur ou contenu n'est retourné.
- Un test de contrat dédié `tests/security/production-rls-storage-readonly-audit-contract.test.ts` vérifie qu'il ne comporte que quatre requêtes `SELECT`. Ce contrôle statique ne remplace pas un audit SQL manuel ni des tests d'autorisation.
- L'exécution sur production est réservée à un opérateur autorisé ; **ne pas lancer** le script de remédiation manuelle tant que tous les blocages ne sont pas levés.

## Protection des traces navigateur

- L'ancien `saveManualGeneratedDocument()` journalisait le **payload complet** de la fiche, y compris `content`, dans la console du navigateur. Ce comportement est supprimé sur la branche de PR, sans modifier la logique d'enregistrement ni les données existantes.
- Un test `tests/security/library-document-privacy-contract.test.ts` vérifie l'absence de `console.log/debug/info` dans ce service ; le workflow CI exécute ce contrôle.
- Ce correctif **n'efface pas d'éventuels journaux historiques** et ne constitue pas un audit exhaustif de toutes les traces de l'application.

## Séquence technique

1. Confirmer les schémas, politiques et grants en lecture seule, ainsi que les dépendances UI/API et stockage.
2. Tester les scénarios avec **comptes de test dédiés** sur une copie isolée du schéma et de données factices : anonyme, joueur, parent, coach, dirigeant, admin, utilisateur désactivé.
3. Valider les comportements : aucun accès anonyme aux données joueur; joueur limité à son propre profil; staff actif limité aux droits prévus; bibliothèque publiée et documents internes filtrés; publication et archivage réservés aux rôles habilités.
4. Exécuter le script manuel en transaction sur la production pendant la fenêtre validée. Toute exception annule le changement.
5. Relever l'état après changement et exécuter des tests **non destructifs** de lecture sous JWT de test; tester les écritures uniquement sur des fixtures de test, jamais sur des données réelles.
6. Vérifier la bibliothèque, l'espace joueur et le suivi des fondamentaux depuis un navigateur mobile et un ordinateur, puis examiner les logs et le linter de sécurité.

## SQL manuel

Fichier : `ops/manual/production-rls-hardening-2026-10-14.sql`.

- Active RLS sur les trois tables.
- Applique cinq policies de bibliothèque : lecture anonyme strictement publique et publiée, lecture membre selon audience, lecture staff et propriétaire, écriture staff, suppression admin.
- Révoque les écritures anonymes sur la bibliothèque et tous les privilèges anonymes sur les deux tables joueur.
- Renforce les **six policies existantes** des tables joueur sans élargir les rôles staff : le propriétaire et le staff inactifs sont bloqués. Aucune ligne de données n'est modifiée.
- Révoque `TRUNCATE`, `TRIGGER` et `REFERENCES` sur les trois tables pour `anon` et `authenticated`, avec vérification finale explicite.
- Refuse l'exécution si les six politiques joueur attendues ne correspondent plus au préflight audité.
- Inclut des contrôles de dérive et une validation finale dans une seule transaction.

**Attention :** les rôles `coach`, `dirigeant`, `responsable_technique`, `admin` ne doivent pas être élargis sans audit. Les policies de lecture joueur existantes donnent une visibilité large au staff, non limitée par équipe; un chantier distinct est nécessaire pour une isolation stricte par équipe. La bibliothèque n'a pas de colonne de visibilité fine dans le schéma actuel : ne pas inventer de permissions individuelles.

## Retour arrière et décision de sécurité

La migration ne supprime ni ne transforme aucune ligne. Une erreur SQL doit annuler automatiquement toute la transaction. Si l'application dysfonctionne après commit, privilégier une **correction ciblée des policies** plutôt qu'une désactivation générale de RLS qui réexposerait les données. En cas d'incident majeur, un responsable habilité décide d'une restauration depuis la sauvegarde vérifiée ou d'un changement ciblé, après mesure de l'impact.

**Statut de la PR :** le correctif GitHub ne vaut ni déploiement ni autorisation de fusion. Les droits `responsable_technique` sur les tables de progression restent à confirmer métier : le patch conserve strictement les rôles préexistants `admin`, `coach`, `dirigeant` sans en ajouter.

**Conditions de livraison :** sauvegarde restaurable confirmée, essais sur copie isolée, contrôles d'accès validés, journal d'exécution, vérification mobile/ordinateur, linter Supabase sans les trois erreurs RLS initiales. Aucun de ces critères n'est réputé atteint par le seul merge d'une PR.
