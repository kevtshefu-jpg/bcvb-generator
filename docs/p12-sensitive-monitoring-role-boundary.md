# P12.3 — Frontières de permissions : roster vs monitoring sensible

## Constats vérifiés (catalogue Supabase production, 9 octobre 2026)

Les fonctions historiques `can_access_team(uuid)`, `can_access_current_player(uuid)`, `can_manage_attendance_team(uuid)` et `current_user_role()` sont `SECURITY DEFINER`, propriété `postgres`, avec `search_path` fixé à `public, pg_temp`.

- `can_access_team` admet les responsables de club (dont `dirigeant`) ou un rattachement d'équipe pour `coach`, `team_staff` et `parent_referent`. Ce prédicat exprime un **accès roster**, pas une habilitation aux données de santé.
- `can_access_current_player` passe par une appartenance active et `can_access_team` pour les rôles coach/staff/parent référent ; il ne constitue pas une autorisation de monitoring.
- `can_manage_attendance_team` limite l'écriture opérationnelle aux admin/RT et aux coachs avec affectation active `head_coach` ou `assistant_coach`.
- Les 16 migrations d'octobre sont absentes du registre de production au dernier contrôle ; les RPC de monitoring/Player Book n'y sont pas installées.

## Contrat attendu après déploiement des migrations

`can_access_player_monitoring(player,team)` (migration `20261008090000`) exige simultanément une session authentifiée, des IDs non nuls, un rôle `admin`, `responsable_technique` ou `coach`, `can_manage_player_evaluation` et `can_manage_attendance_team`.

Ni `can_access_team` seul, ni `can_access_current_player` seul, ni une appartenance au roster, ni la seule qualité de dirigeant/parent ne doivent ouvrir les observations de douleur, sommeil, fatigue ou disponibilité.

## Garde-fous de déploiement

1. Conserver les 16 versions dans leur ordre et vérifier leurs dépendances, sans réécrire les migrations historiques.
2. Tester après application sur environnement isolé avec identités **synthétiques** : admin, RT, coach assigné, coach d'une autre équipe, staff, parent référent, dirigeant, compte sans profil et joueur ; couvrir comptes désactivés et appartenance inactive.
3. Pour chaque rôle et équipe, vérifier refus/autorisations des RPC `read_player_monitoring`, `read_player_monitoring_summary` et `save_player_monitoring`, plus absence d'accès brut aux lignes sous RLS.
4. Vérifier les privilèges et `SECURITY DEFINER` avec `docs/monitoring-production-verification.sql` et les ACL/policies historiques avec `docs/p12-historical-player-rls-audit.sql`.
5. Ne pas annoncer un parcours de production opérationnel avant migration effective, tests authentifiés et validation des écrans/exports.

**Limites :** un contrôle de catalogue ne démontre pas l'absence d'exposition entre équipes. La politique de conservation, d'information et de consentement des mineurs relève d'un arbitrage distinct. Aucun accès nouveau n'est proposé par ce document.
