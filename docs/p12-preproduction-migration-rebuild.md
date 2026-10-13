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

## Préflight SQL vérifié en lecture seule (P12.42)

Le fichier `scripts/preprod-readonly-preflight.sql` interroge **uniquement les métadonnées** : registre des migrations, définition des deux RPC, présence du verrou `FOR UPDATE`, présence des barrières de durée, droits d'exécution et statut `SECURITY DEFINER`. Il ne lit aucun profil de joueur, aucune blessure et aucune charge.

Exécuté en lecture seule sur la préproduction le 13 octobre 2026, il a confirmé :

- 51 migrations, dernière `20261008140000` ; aucune des deux migrations de durée enregistrée.
- Les deux RPC existent, sont `SECURITY DEFINER`, disposent d'un verrou de ligne et autorisent `authenticated`.
- Les rôles `anon` et `PUBLIC` ne disposent pas d'EXECUTE sur ces RPC.
- Les deux RPC ne disposent **pas encore** des nouvelles barrières de durée.

La CI contrôle statiquement que ce préflight ne contient aucune instruction SQL de mutation. Cette vérification statique ne remplace pas l'examen humain du SQL, et l'exécution en préproduction ne vaut pas dry-run de migration.

## Conditions préalables au GO de préproduction

1. **État distant récent prouvé** : 51 versions enregistrées en préproduction le 13 octobre ; confirmer de nouveau le registre et le projet cible au moment du dry-run. Ne pas exécuter de reconstruction « base vide ».
2. **Correspondance des versions** : 53 fichiers GitHub attendus, 51 déjà enregistrés en préproduction, **2 migrations additives** à prévisualiser ; aucune insertion manuelle dans le registre.
3. **Simulation** : `supabase db push --dry-run --linked` sur la seule préproduction, revue des fichiers et de l'ordre ; le script `scripts/preprod-dry-run.mjs` n'exécute **jamais** un push réel.
4. **Protection des données** : aucune donnée de licencié réel ni de mineur ; identités et équipes synthétiques seulement.
5. **Séparation des environnements** : aucune modification du projet de production et aucun pointage de l'application publique sur la préproduction.
6. **Décision explicite de déploiement** : le dry-run n'est pas une autorisation d'appliquer les migrations ; l'application effective nécessite un GO distinct et une stratégie de sauvegarde/restauration.

**Statut P12.40 : préparation et contrôles CI uniquement. Aucune migration distante exécutée.**

## Risque bloquant

L'action générique `apply_migration(name, query)` ne permet pas de transmettre explicitement le numéro de version historique du fichier. L'employer sur les fichiers pourrait produire des versions enregistrées différentes de celles attendues par la CLI Supabase, empêchant toute comparaison fiable avec GitHub.

**Ne pas** recréer artificiellement les versions par insertion directe dans `supabase_migrations.schema_migrations`, ni marquer un fichier comme exécuté sans l'avoir appliqué.

## Procédure cible actualisée : rattrapage préproduction uniquement

1. Vérifier la cible préproduction `rghbzbwmvvnoqwymqyjn`, son statut et les **51 migrations déjà enregistrées** ; vérifier les objets SQL et l'absence de données réelles à risque. Si divergence, **STOP**.
2. Vérifier le dépôt GitHub à jour, les 53 fichiers, le manifeste et les contrôles de sécurité ; utiliser une base locale jetable pour rejouer les migrations et les tests.
3. Lancer **uniquement** `scripts/preprod-dry-run.mjs` avec identifiants fournis de manière sécurisée par l'opérateur habilité ; le script vérifie la cible et exécute `supabase db push --dry-run --linked`.
4. Attendu au dry-run : **deux migrations et seulement deux**, dans l'ordre : `20261013161800_session_submit_duration_gate.sql` puis `20261013175500_session_publish_duration_gate.sql`. Toute autre proposition de modification est un **NO-GO**.
5. Revoir les droits de publication/soumission, l'absence de données sensibles, les tests de durée et la stratégie de sauvegarde/restauration. Aucun déploiement ne découle automatiquement de cette vérification.
6. L'application effective sur préproduction exige une décision **GO distincte**, une fenêtre de changement et une vérification post-déploiement des 53 versions et des parcours synthétiques.
7. **Production interdite dans cette procédure** : les 18 migrations non enregistrées et les différences potentielles de schéma exigent un plan de migration de production séparé, un audit des données et un test de restauration.

La procédure historique de **reconstruction à partir d'une préproduction vide** ne s'applique plus à l'état observé le 13 octobre 2026. Ne pas réinitialiser la base.

## Verrous

- Vérifier en parallèle le comportement des migrations transitoires exposant des RPC plus larges ; aucune donnée personnelle en préproduction.
- Ne pas pointer l'application publique vers la préproduction pendant la reconstruction.
- Un feu vert local et préproduction **ne vaut pas** autorisation de modifier la production.
- Les commandes CLI ci-dessus sont une procédure préparée ; **elles n'ont pas été exécutées** par cet audit.
