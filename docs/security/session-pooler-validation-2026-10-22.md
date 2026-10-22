# Validation Session pooler — 22 octobre 2026

Test manuel local, projet de production `leziahqmqyuewpzjmzxf` : connexion IPv4 au Session pooler port 5432 avec vérification TLS `verify-full`, mot de passe interactif, transaction `BEGIN READ ONLY` / `COMMIT` réussie. `current_user=postgres`, `current_database=postgres`. Droits `SELECT` confirmés sur `auth.users`, `storage.objects` et `public.library_documents`.

Aucune exportation ni modification de production. Les droits sur les autres objets, la compatibilité de `pg_dump` avec le pooler, la sauvegarde des fichiers binaires Storage et la restauration restent à valider. Ne pas fusionner ni exécuter la migration RLS tant que la restauration complète n'est pas vérifiée.

## Schéma seul : test `pg_dump` réussi

L'opérateur a exécuté `pg_dump` via le Session pooler IPv4 avec `--schema-only --schema=public --schema=auth --schema=storage --format=custom` et vérification TLS. Le processus a abouti et `pg_restore --list` a lu le catalogue de l'archive ; taille locale **562 011 octets**. Aucune ligne de données exportée. Le test ne démontre pas encore la présence de tous les objets attendus dans l'archive, ni sa restaurabilité. Prochain contrôle local sans secret : inspecter le catalogue de la dernière archive `bcvb-schema-preflight.*` et compter les entrées de schémas et de tables, sans publier les définitions SQL.

La documentation Supabase distingue le dump filtré de la CLI (qui exclut `auth` et `storage`) et un `pg_dump` PostgreSQL brut ; ce dernier peut poser des difficultés de restauration sur des objets internes. Le plan de restauration isolée doit donc être validé avant de qualifier la sauvegarde de complète.
