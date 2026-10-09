# P12.10 — Prévisualisation de préproduction

La préproduction `rghbzbwmvvnoqwymqyjn` est la **seule** cible autorisée pour le dry-run. Le registre y est vide au dernier contrôle.

## Commandes à exécuter par un opérateur autorisé

Depuis la copie locale du dépôt, avec la CLI Supabase configurée et sans afficher de secrets :

```bash
node scripts/preprod-migration-manifest.mjs
node scripts/check-october-migration-sequence.mjs
supabase link --project-ref rghbzbwmvvnoqwymqyjn
supabase migration list --linked
supabase db push --dry-run --linked
```

Avant toute opération, confirmer dans la sortie CLI que la cible est `rghbzbwmvvnoqwymqyjn`. **Ne pas exécuter `supabase db push` sans `--dry-run`** pendant cette phase. Si une version distante est présente ou si le manifeste diverge, arrêter et examiner les différences. Conserver uniquement les diagnostics techniques, sans secrets ni données de joueur.

Un dry-run positif ne prouve ni l'application des 51 migrations ni la sécurité effective des accès. L'étape suivante devra être autorisée séparément après examen des résultats.
