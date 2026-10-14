# BCVB — Remédiation RLS production, procédure de changement contrôlé

**État : PRÉPARÉE, NON EXÉCUTÉE.** Ce document et le SQL manuel associé ne constituent pas une migration automatique. Autorisation métier donnée le 14 octobre 2026 sous réserve de vérification préalable d'une sauvegarde.

## Périmètre confirmé en lecture seule

- Production Supabase : `leziahqmqyuewpzjmzxf`, projet **BCVB Référentiel**, organisation **Free**.
- Préproduction : `rghbzbwmvvnoqwymqyjn`. Les trois tables ciblées y sont **absentes** : cette instance ne peut pas servir de clone de validation fonctionnelle.
- Production : `public.library_documents`, `public.player_content_unlocks`, `public.player_fundamental_progress` existent avec RLS désactivée et des droits SQL directs pour `anon` et `authenticated`.
- Deux tables joueur possèdent trois policies chacune, mais inopérantes tant que RLS est désactivée.
- La bibliothèque n'a aucune policy, avec 22 documents agrégés au 14/10 : 19 `uploaded` et 3 autres? **Ne pas utiliser ce chiffre sans recontrôle**. Les catégories observées sont `uploaded` et `published`, et les audiences `Interne club`, `Coachs`, `parent`, `member`.
- Le profil est déjà protégé contre la modification non autorisée des rôles par le trigger actif `protect_profile_security_fields_trigger`; sa présence a été confirmée. Ne pas qualifier l'auto-promotion de vulnérabilité démontrée.

## Blocage absolu : sauvegarde hors base vérifiable

Les outils connectés ne donnent **pas accès** à l'état des sauvegardes Supabase ni à un test de restauration. L'organisation est en offre Free : ne pas supposer l'existence d'un point de restauration géré.

Avant tout DDL en production, un opérateur autorisé doit :

1. Produire une sauvegarde **hors de la base de production**, chiffrée, du schéma et des données nécessaires (idéalement export PostgreSQL complet `pg_dump -Fc`), avec un client PostgreSQL compatible et les accès DB conservés exclusivement dans un gestionnaire de secrets.
2. Vérifier que le fichier existe, n'est pas vide, que son format est lisible par `pg_restore -l`, et qu'une restauration dans une base **isolée** est réalisable. Consigner l'heure, la taille, le hash et l'identifiant du contrôle de restauration sans publier de secrets ni de données personnelles.
3. Vérifier les fenêtres de maintenance et la disponibilité d'un administrateur BCVB. Ne jamais déposer le dump dans GitHub, ChatGPT, un bucket public ou le dépôt.
4. Relever un état initial des policies, grants, RLS, nombre de lignes par table (agrégats uniquement) et la présence du trigger protecteur des profils.

Sans confirmation du contrôle de restauration, **ne pas exécuter** `ops/manual/production-rls-hardening-2026-10-14.sql`.

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
- Conserve les policies existantes des tables joueur et les données en place.
- Inclut des contrôles de dérive et une validation finale dans une seule transaction.

**Attention :** les rôles `coach`, `dirigeant`, `responsable_technique`, `admin` ne doivent pas être élargis sans audit. Les policies de lecture joueur existantes donnent une visibilité large au staff, non limitée par équipe; un chantier distinct est nécessaire pour une isolation stricte par équipe. La bibliothèque n'a pas de colonne de visibilité fine dans le schéma actuel : ne pas inventer de permissions individuelles.

## Retour arrière et décision de sécurité

La migration ne supprime ni ne transforme aucune ligne. Une erreur SQL doit annuler automatiquement toute la transaction. Si l'application dysfonctionne après commit, privilégier une **correction ciblée des policies** plutôt qu'une désactivation générale de RLS qui réexposerait les données. En cas d'incident majeur, un responsable habilité décide d'une restauration depuis la sauvegarde vérifiée ou d'un changement ciblé, après mesure de l'impact.

**Conditions de livraison :** sauvegarde restaurable confirmée, essais sur copie isolée, contrôles d'accès validés, journal d'exécution, vérification mobile/ordinateur, linter Supabase sans les trois erreurs RLS initiales. Aucun de ces critères n'est réputé atteint par le seul merge d'une PR.
