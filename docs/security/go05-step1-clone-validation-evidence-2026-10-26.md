# GO05 — validation transactionnelle sur clone isolé — 26 octobre 2026

## Provenance
Preuve transmise par l'opérateur depuis le Terminal local (Host-003, dépôt `bcvb-generator`). Il s'agit de la transcription communiquée, **pas** d'une exécution directe depuis GitHub Actions ou ChatGPT.

- Conteneur : `bcvb-restore-test` ; réseau déclaré par le script : `none`.
- SQL : commit `fe3e4565b0559f80baf54b170ce2a10e64bc53f3`.
- Empreinte blob Git annoncée : `da58ec7f538c4f1f09a6d529a8e51067dcb2d3ae`.
- Mode : `docker exec`, transaction terminée par `ROLLBACK` ; pas d'identifiants de production.

## Résultat du test SQL
Transcription : `BEGIN`, `DO`, cinq `CREATE POLICY`, six `ALTER POLICY`, trois `REVOKE`, trois `ALTER TABLE`, `DO`, `ROLLBACK`, puis `SUCCESS: SQL completed and ROLLBACK issued`.

**PASS — Exécution transactionnelle et contrôles SQL internes** du script ciblé sur le clone isolé.

## Vérification indépendante de l'état après rollback
L'opérateur a exécuté une requête `pg_class` / `pg_policies` et transmis :

| Table | relrowsecurity | Nombre de politiques |
| --- | --- | ---: |
| `public.library_documents` | false | 0 |
| `public.player_content_unlocks` | false | 3 |
| `public.player_fundamental_progress` | false | 3 |

Ces valeurs correspondent à l'état initial inventorié. **PASS — RLS et nombres de politiques restaurés après rollback.**

Limite de preuve : ce contrôle vérifie les trois indicateurs ci-dessus, pas l'intégralité des privilèges, objets ni contenus. Le rollback transactionnel de PostgreSQL est le mécanisme principal de non-persistance.

## CI
GitHub Actions #325, commit `fe3e4565b0559f80baf54b170ce2a10e64bc53f3` : `session-builder` et `database-contract` réussis ; TypeScript et build Vite réussis ; statuts Vercel observés : réussis.

## Décision
**Étape 1 : PASS / clôturée** (CI + SQL transactionnel sur clone + contrôle indépendant RLS/policies après rollback).

**Déploiement : NO-GO** tant que les accès Storage, les lectures réelles par rôle/JWT, les chemins privilégiés et la restauration fonctionnelle ne sont pas validés. Aucun SQL de production n'a été exécuté et aucune PR n'a été fusionnée dans le cadre de cette preuve.
