# P12.5 — Critères de déploiement des migrations Performance en production

**Statut : bloqué / non autorisé à déployer.** Document de préparation, pas une preuve d'aptitude ni une procédure exécutée.

## État observé
- Référentiel GitHub `main` : 51 migrations SQL.
- Supabase « BCVB Référentiel » : 35 migrations enregistrées, dernière `20260903120000`.
- 16 migrations des 7–8 octobre non enregistrées.
- Les fonctions `read_player_monitoring` et `read_player_staff_book`, ainsi que `player_monitoring_entries`, sont absentes de la production observée.
- Les contrôles locaux GitHub Actions ne prouvent pas une application sûre sur la base en exploitation.

## Risque spécifique : exposition transitoire entre deux migrations

`20261007175500_player_monitoring.sql` introduit une fonction `read_player_monitoring` dont l'autorisation initiale réutilise `can_access_current_player` et `can_access_team`. Ces contrôles incluent des rôles historiques non habilités au monitoring sensible.

`20261008090000_monitoring_access_scope.sql` restreint ensuite ces accès via `can_access_player_monitoring`. Les fichiers utilisent des transactions indépendantes (`begin` / `commit`). **Le bon état final ne suffit donc pas à garantir l'absence d'accès pendant une application progressive exposée à des utilisateurs.**

La même revue doit couvrir les RPC d'évaluations et d'objectifs initiaux, puis leur durcissement `20261008110000`.

## Conditions bloquantes avant toute mise en production

1. **Périmètre et responsable** : validation du déploiement et de la fenêtre par le responsable habilité du club. La sauvegarde, l'interruption éventuelle du service et la marche arrière ont un impact opérationnel.
2. **Cohérence d'historique** : comparer registre de 35 versions, définitions du schéma réel, signatures existantes, privilèges et RLS aux prérequis exacts des 16 fichiers. Ne jamais forcer un statut de migration.
3. **Restauration prouvée** : disposer d'une sauvegarde cohérente et d'un essai documenté de restauration sur environnement isolé. Prévoir le traitement des données éventuellement écrites entre sauvegarde et incident.
4. **Simulation reproductible** : appliquer les 16 migrations sans réorganisation sur une copie isolée de schéma et données synthétiques, avec contrôle des dépendances et du temps d'exécution.
5. **Non-exposition transitoire** : bloquer l'accès effectif aux nouvelles RPC durant les étapes intermédiaires (par exemple interruption contrôlée des accès applicatifs/API, avec dispositif effectivement testé) jusqu'à l'installation **et la validation** des correctifs de sécurité. Ne pas supposer que « maintenance UI » coupe l'accès direct à l'API.
6. **Tests autorisations** : vérifier avec identités de test authentifiées admin, responsable technique, coach affecté et autre équipe, staff, parent référent, dirigeant, compte désactivé et anonyme. Vérifier lecture, écriture, vues résumées et accès brut SQL sous RLS.
7. **Vérifications métier** : garantir le fonctionnement de la recherche canonique, effectifs, présences, évaluations, objectifs, Player Books et exports. Éviter toute perte des données existantes.
8. **Go/No-Go** : accord explicite et horodaté sur la base des résultats ci-dessus ; sinon conserver le statu quo.

## Ordre opérationnel envisagé (à valider sur environnement isolé)

- Préflight catalogue : `docs/p12-production-migration-preflight.sql`, `docs/p12-historical-player-rls-audit.sql`, `docs/monitoring-production-verification.sql` (ce dernier sert surtout après déploiement).
- Vérifier backup + restauration et une voie d'accès de maintenance réellement bloquante pour les nouvelles RPC.
- Test préproduction sur environnement sans véritables identités mineures, puis interruption contrôlée de l'accès à l'API concernée.
- Exécuter exactement les versions du dépôt avec la méthode Supabase approuvée ; refuser toute erreur, divergence ou saut.
- Garder les appels utilisateurs bloqués jusqu'au succès des tests SQL/RLS et des scénarios de rôles, puis rétablir l'accès.
- Surveiller les échecs d'autorisation et les régressions ; appliquer le plan de retour arrière approuvé si les critères échouent.

**Ne pas exécuter de migrations en production depuis ce document.** Les modalités réelles d'isolation et de restauration sont **non vérifiées** à ce stade.
