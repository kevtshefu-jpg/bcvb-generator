# P12.8 — Reconstruction de préproduction : conserver les versions exactes

## État constaté (9 octobre 2026)

- Projet préproduction `rghbzbwmvvnoqwymqyjn` : `ACTIVE_HEALTHY`.
- Aucun historique de migrations enregistré et aucune table métier dans `public`.
- Référentiel GitHub `main` : 51 fichiers `supabase/migrations/<version>_<name>.sql`.
- Projet de production `leziahqmqyuewpzjmzxf` : 35 migrations enregistrées ; aucune modification de production n'est autorisée par cette procédure.

## Risque bloquant

L'action générique `apply_migration(name, query)` ne permet pas de transmettre explicitement le numéro de version historique du fichier. L'employer sur 51 fichiers pourrait produire des versions enregistrées différentes de celles attendues par la CLI Supabase, empêchant toute comparaison fiable avec GitHub.

**Ne pas** recréer artificiellement les versions par insertion directe dans `supabase_migrations.schema_migrations`, ni marquer un fichier comme exécuté sans l'avoir appliqué.

## Procédure cible (à exécuter par un opérateur disposant d'un accès CLI Supabase approuvé)

1. Confirmer le projet cible : préproduction **uniquement** ; vérifier qu'il est vide et sans données à préserver.
2. Depuis le dépôt à jour, vérifier `git status`, `supabase/migrations`, les variables d'environnement, et le projet lié. Ne jamais exposer le mot de passe de la base dans les logs.
3. Tester l'historique complet dans une base locale jetable avec `supabase db reset --local` et les tests de sécurité GitHub Actions.
4. Avec la CLI Supabase et la connexion explicitement **liée à la préproduction**, comparer `supabase migration list --linked`. Attendu initial : aucune version appliquée. Si des versions apparaissent, **stopper** et investiguer.
5. Prévisualiser les changements avec `supabase db push --dry-run` contre **ce projet de préproduction**, puis examiner l'ordre attendu des 51 migrations, erreurs SQL potentielles et privilèges.
6. Appliquer les migrations avec `supabase db push` **seulement après examen du dry-run et confirmation explicite du projet cible**. Ne pas employer de réparation de registre pour contourner une erreur.
7. Contrôler `supabase migration list --linked` : les 51 versions historiques attendues doivent correspondre exactement à celles du dépôt.
8. Sur identités et équipes **synthétiques**, exécuter les tests des droits et RLS, les parcours Player Book, monitoring, évaluations, objectifs et exports. Ne jamais injecter de données de mineurs réelles dans cet environnement.
9. Rendre un rapport de simulation : ordre, durée, erreurs, captures d'états de tests, limites, décision Go/No-Go. Ce test sur base vide ne remplace pas une simulation sur une copie structurelle fidèle de la production ni un test de restauration.

## Verrous

- Vérifier en parallèle le comportement des migrations transitoires exposant des RPC plus larges ; aucune donnée personnelle en préproduction.
- Ne pas pointer l'application publique vers la préproduction pendant la reconstruction.
- Un feu vert local et préproduction **ne vaut pas** autorisation de modifier la production.
- Les commandes CLI ci-dessus sont une procédure préparée ; **elles n'ont pas été exécutées** par cet audit.
