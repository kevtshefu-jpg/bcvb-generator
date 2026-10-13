# P12.8 / P12.40 — Préparation de préproduction : conserver les versions exactes

## État historique constaté (9 octobre 2026) — à revérifier avant toute opération

- Projet préproduction `rghbzbwmvvnoqwymqyjn` : `ACTIVE_HEALTHY`.
- Aucun historique de migrations enregistré et aucune table métier dans `public`.
- Référentiel GitHub `main` au 9 octobre : 51 fichiers `supabase/migrations/<version>_<name>.sql` (observation historique, non actuelle).
- Projet de production `leziahqmqyuewpzjmzxf` : 35 migrations enregistrées ; aucune modification de production n'est autorisée par cette procédure.


## Vérification distante en lecture seule (13 octobre 2026)

Consultation du registre des migrations via Supabase, **sans SQL ni écriture** :

| Environnement | Projet | Versions enregistrées | Dernière version |
| --- | --- | ---: | --- |
| Préproduction | `rghbzbwmvvnoqwymqyjn` | **51** | `20261008140000` |
| Production | `leziahqmqyuewpzjmzxf` | **35** | `20260903120000` |
| GitHub `main` | `supabase/migrations` | **53 fichiers** | `20261013175500` |

**Différentiel constaté :** la préproduction a désormais les 51 migrations historiques enregistrées ; **2 migrations de garde-fou** restent à examiner/appliquer. La production possède 35 versions enregistrées ; **18 migrations GitHub** ne sont pas enregistrées en production. Les listes de versions observées correspondent à des préfixes ordonnés du dépôt.

**Limites :** la présence d'une version au registre ne prouve pas que les objets SQL, les politiques RLS et les données réelles correspondent parfaitement à GitHub. Aucune simulation sur une copie fidèle de production ni test de restauration n'a été effectué ici. Ne pas déduire de cette lecture seule une autorisation de déploiement.

**Changement de procédure :** la reconstruction « préproduction vide » décrite ci-dessous est **obsolète et ne doit pas être exécutée telle quelle**. Préférer un rattrapage ciblé des deux migrations restantes, après dry-run strictement lié à la préproduction, contrôle des objets et décision GO distincte. Ne jamais réinitialiser la préproduction pour suivre la procédure historique sans nouvel audit et décision explicite.

## Actualisation GitHub (13 octobre 2026) — source locale uniquement

- Le dépôt contient **53 migrations** : 51 du socle audité au 9 octobre et deux migrations additives :
  - `20261013161800_session_submit_duration_gate.sql` (soumission),
  - `20261013175500_session_publish_duration_gate.sql` (publication).
- Les **16 migrations du 7–8 octobre** et les deux nouvelles migrations constituent **18 fichiers** postérieurs au socle antérieur à octobre. Ce décompte est celui du dépôt, **pas** une mesure de ce qui manque réellement à un projet distant.
- Le registre distant a été revérifié en lecture seule le **13 octobre** : **51 versions en préproduction et 35 en production**. L'observation de préproduction vide du 9 octobre est dépassée.
- `scripts/preprod-migration-manifest.mjs` et `scripts/check-october-migration-sequence.mjs` vérifient la séquence locale ; `scripts/check-session-duration-rpc-gates.mjs` vérifie hors ligne la présence des deux contrôles de durée, des droits et leur ordre avant mutation.
- Les tests Supabase de GitHub Actions utilisent une **base locale jetable** ; leur succès ne prouve ni la synchronisation de préproduction ni celle de production.

## Conditions préalables au GO de préproduction

1. **État distant récent prouvé** : projet ciblé et historique `supabase migration list --linked` vérifiés sur la préproduction uniquement. Si l'historique n'est plus vide, suspendre la procédure de reconstruction « base vide » et réévaluer.
2. **Correspondance des versions** : 53 fichiers GitHub attendus, 51 déjà enregistrés en préproduction, **2 migrations additives** à prévisualiser ; aucune insertion manuelle dans le registre.
3. **Simulation** : `supabase db push --dry-run --linked` sur la seule préproduction, revue des fichiers et de l'ordre ; le script `scripts/preprod-dry-run.mjs` n'exécute **jamais** un push réel.
4. **Protection des données** : aucune donnée de licencié réel ni de mineur ; identités et équipes synthétiques seulement.
5. **Séparation des environnements** : aucune modification du projet de production et aucun pointage de l'application publique sur la préproduction.
6. **Décision explicite de déploiement** : le dry-run n'est pas une autorisation d'appliquer les migrations ; l'application effective nécessite un GO distinct et une stratégie de sauvegarde/restauration.

**Statut P12.40 : préparation et contrôles CI uniquement. Aucune migration distante exécutée.**

## Risque bloquant

L'action générique `apply_migration(name, query)` ne permet pas de transmettre explicitement le numéro de version historique du fichier. L'employer sur les fichiers pourrait produire des versions enregistrées différentes de celles attendues par la CLI Supabase, empêchant toute comparaison fiable avec GitHub.

**Ne pas** recréer artificiellement les versions par insertion directe dans `supabase_migrations.schema_migrations`, ni marquer un fichier comme exécuté sans l'avoir appliqué.

## Procédure cible (à exécuter par un opérateur disposant d'un accès CLI Supabase approuvé)

1. Confirmer le projet cible : préproduction **uniquement** ; vérifier qu'il est vide et sans données à préserver.
2. Depuis le dépôt à jour, vérifier `git status`, `supabase/migrations`, les variables d'environnement, et le projet lié. Ne jamais exposer le mot de passe de la base dans les logs.
3. Tester l'historique complet dans une base locale jetable avec `supabase db reset --local` et les tests de sécurité GitHub Actions.
4. Avec la CLI Supabase et la connexion explicitement **liée à la préproduction**, comparer `supabase migration list --linked`. Attendu initial : aucune version appliquée. Si des versions apparaissent, **stopper** et investiguer.
5. Prévisualiser les changements avec `supabase db push --dry-run` contre **ce projet de préproduction**, puis examiner l'ordre attendu des 53 migrations, erreurs SQL potentielles et privilèges.
6. Appliquer les migrations avec `supabase db push` **seulement après examen du dry-run et confirmation explicite du projet cible**. Ne pas employer de réparation de registre pour contourner une erreur.
7. Contrôler `supabase migration list --linked` : les 53 versions attendues doivent correspondre exactement à celles du dépôt.
8. Sur identités et équipes **synthétiques**, exécuter les tests des droits et RLS, les parcours Player Book, monitoring, évaluations, objectifs et exports. Ne jamais injecter de données de mineurs réelles dans cet environnement.
9. Rendre un rapport de simulation : ordre, durée, erreurs, captures d'états de tests, limites, décision Go/No-Go. Ce test sur base vide ne remplace pas une simulation sur une copie structurelle fidèle de la production ni un test de restauration.

## Verrous

- Vérifier en parallèle le comportement des migrations transitoires exposant des RPC plus larges ; aucune donnée personnelle en préproduction.
- Ne pas pointer l'application publique vers la préproduction pendant la reconstruction.
- Un feu vert local et préproduction **ne vaut pas** autorisation de modifier la production.
- Les commandes CLI ci-dessus sont une procédure préparée ; **elles n'ont pas été exécutées** par cet audit.
