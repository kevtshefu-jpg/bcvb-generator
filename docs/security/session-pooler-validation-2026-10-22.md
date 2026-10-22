# Validation Session pooler — 22 octobre 2026

Test manuel local, projet de production `leziahqmqyuewpzjmzxf` : connexion IPv4 au Session pooler port 5432 avec vérification TLS `verify-full`, mot de passe interactif, transaction `BEGIN READ ONLY` / `COMMIT` réussie. `current_user=postgres`, `current_database=postgres`. Droits `SELECT` confirmés sur `auth.users`, `storage.objects` et `public.library_documents`.

Aucune exportation ni modification de production. Les droits sur les autres objets, la compatibilité de `pg_dump` avec le pooler, la sauvegarde des fichiers binaires Storage et la restauration restent à valider. Ne pas fusionner ni exécuter la migration RLS tant que la restauration complète n'est pas vérifiée.

## Schéma seul : test `pg_dump` réussi

L'opérateur a exécuté `pg_dump` via le Session pooler IPv4 avec `--schema-only --schema=public --schema=auth --schema=storage --format=custom` et vérification TLS. Le processus a abouti et `pg_restore --list` a lu le catalogue de l'archive ; taille locale **562 011 octets**. Aucune ligne de données exportée. Le test ne démontre pas encore la présence de tous les objets attendus dans l'archive, ni sa restaurabilité. Prochain contrôle local sans secret : inspecter le catalogue de la dernière archive `bcvb-schema-preflight.*` et compter les entrées de schémas et de tables, sans publier les définitions SQL.

La documentation Supabase distingue le dump filtré de la CLI (qui exclut `auth` et `storage`) et un `pg_dump` PostgreSQL brut ; ce dernier peut poser des difficultés de restauration sur des objets internes. Le plan de restauration isolée doit donc être validé avant de qualifier la sauvegarde de complète.

## Inventaire local du catalogue `pg_restore --list`

Contrôle manuel du 22/10/2026 : `public` = 1 schéma / 39 tables ; `auth` = 1 schéma / 27 tables ; `storage` = 1 schéma / 8 tables. Total : **74 tables**. **0 entrée `TABLE DATA`** dans l'archive `--schema-only`. La structure des trois schémas est présente et le catalogue lisible ; la restauration effective, les rôles et les objets hors de ces trois schémas ne sont pas encore validés.

**Étape suivante :** réaliser une sauvegarde des données dans le dossier local privé, sans divulguer d'identifiants, puis vérifier l'archive hors ligne ; protéger spécialement les données d'authentification et les informations concernant les mineurs. Prévoir une sauvegarde distincte des objets binaires Storage, des rôles nécessaires et une restauration isolée. Aucun changement de production RLS avant validation de l'ensemble.

## Archive des données : export local réussi

Exécution manuelle de `pg_dump --data-only --schema=public --schema=auth --schema=storage --format=custom` via Session pooler IPv4 avec mot de passe interactif et vérification TLS. Archive privée créée, `pg_restore --list` réussit ; **343 116 octets** et **74 entrées `TABLE DATA`**. Ce nombre compte les objets de table présents dans le catalogue, **pas les lignes sauvegardées**. Aucun test de restauration ni vérification intégrale des flux compressés n'a encore eu lieu. Le dump PostgreSQL ne contient pas les octets des objets Storage, les rôles globaux, ni les schémas non explicitement inclus. Étape suivante : contrôle local intégral par `pg_restore --file=/dev/null` sur les archives, puis traitement des fichiers Storage et restauration isolée. Les archives contenant des données d'authentification et de mineurs doivent rester privées et être chiffrées indépendamment avant toute copie externe.

## Lecture intégrale des archives vérifiée localement

L'opérateur a exécuté `pg_restore --file=/dev/null` sur les deux archives privées ; les deux commandes ont réussi sans erreur. Fichiers contrôlés : `bcvb-schema-preflight.AHNA6C2P` (562 011 octets), SHA-256 `35fdb41a245349718f4ff125f8f5f1e30c65db855cbfe55b80d3b517d50ca044` ; `bcvb-data-20261022-105648.dump` (343 116 octets), SHA-256 `754bdedda8ae6cca4210c2b199977c9602dffb94665334fb17c9e238eb7137af`. Les empreintes ne sont pas des preuves de restauration ni d'exhaustivité. Les exports de structure et de données sont séparés dans le temps et ne constituent pas une capture atomique. Restent à vérifier : restauration isolée, rôles et dépendances, objets binaires Storage, chiffrement indépendant et stratégie de cohérence.

## Diagnostic local du conteneur et des permissions

Le 22/10/2026, diagnostic manuel : `age` absent ; conteneur `bcvb-restore-test` actif et déclaré `healthy` (`public.ecr.aws/supabase/postgres:17.11.0.004`) ; archives de structure et de données protégées en mode `-rw-------`. Ce résultat ne prouve ni le mode réseau du conteneur ni l'état de sa base, et ne constitue pas un test de restauration. Prochaine action : inspection locale en lecture seule des paramètres réseau, de l'état PostgreSQL et des objets présents, avant toute tentative de restauration. Ne pas installer de logiciel, monter de volume sensible ou exécuter de restauration sans validation préalable du plan.

## Isolation du conteneur et inventaire local (lecture seule)

Le conteneur `bcvb-restore-test` a `HostConfig.NetworkMode=none`, `PortBindings={}` et `pg_isready` répond « accepting connections ». Inventaire de la base locale `postgres` : `public` 39 tables, `auth` 5 tables, `storage` 0 table (44 au total). Les archives distantes contiennent respectivement 39, 27 et 8 tables (74 au total). **Ne pas restaurer dans la base locale `postgres` existante** ; préparer une base distincte après inspection de l'espace, des rôles, des bases et des dépendances. Aucune restauration effectuée. Les comptes de tables ne prouvent pas que les données locales sont vides.

## Prérequis de restauration — bases, rôles et extensions

Diagnostic du conteneur `bcvb-restore-test` : bases connectables `postgres` et `template1` ; rôles `postgres`, `anon`, `authenticated`, `service_role`, `supabase_auth_admin`, `supabase_storage_admin` tous présents. Extensions locales : `pg_stat_statements 1.11`, `pgcrypto 1.3`, `plpgsql 1.0`, `supabase_vault 0.3.1`, `uuid-ossp 1.1`. Requête SELECT sur la production le 22/10/2026 : **mêmes cinq extensions et versions**, schémas `extensions` pour `pg_stat_statements`, `pgcrypto`, `uuid-ossp` ; `pg_catalog` pour `plpgsql` ; `vault` pour `supabase_vault`. La correspondance de versions n'implique pas que les schémas d'installation locaux soient identiques ni que la restauration soit possible. Préserver la base `postgres` existante et préparer une base distincte seulement après vérification de l'absence de conflit de nom et de l'espace disponible.
