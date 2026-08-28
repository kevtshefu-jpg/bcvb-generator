# Tests de sécurité et de non-régression BCVB

## Suites locales

`npm test` exécute Vitest :

- composants et hooks React ;
- matrice des rôles front ;
- contrats de la migration RLS ;
- contrats d'authentification des Edge Functions ;
- idempotence et absence de secret embarqué dans le seed.

`npm run test:e2e` lance Playwright sur Chromium desktop et mobile :

- mode Découverte et mode Expert ;
- persistance des préférences ;
- texte agrandi ;
- navigation clavier ;
- absence de débordement horizontal ;
- violations d'accessibilité critiques ;
- redirection des routes protégées ;
- contraintes du formulaire de connexion.

Installation initiale du navigateur :

```bash
npx playwright install chromium
```

## Suites Supabase de préproduction

Ces suites nécessitent la migration et les Edge Functions déjà appliquées par
l'opérateur sur une préproduction isolée. Les scripts de test ne déploient rien
et ne lancent aucune migration.

Configurer la cible explicitement dans le terminal (ne pas commiter ces valeurs) :

```bash
export SUPABASE_URL="https://<PREPROD_PROJECT_REF>.supabase.co"
export SUPABASE_ANON_KEY="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
export RLS_TEST_ENVIRONMENT="preproduction"
export RLS_TEST_PROJECT_NAME="bcvb-preproduction"
export RLS_TEST_PROJECT_REF="<PREPROD_PROJECT_REF>"
export RLS_TEST_CONFIRM_PROJECT_REF="<PREPROD_PROJECT_REF>"
export RLS_TEST_PRODUCTION_PROJECT_REF="<PRODUCTION_PROJECT_REF>"

npm run test:preprod:check
npm run test:integration
```

Le project ref est extrait de l'URL et doit correspondre deux fois à la valeur
attendue. Une cible déclarée comme production est refusée. La confirmation forte
`RLS_TEST_ALLOW_PRODUCTION=I_UNDERSTAND_THIS_WILL_MUTATE_PRODUCTION` existe comme
dernier verrou technique, mais ne fait pas partie du protocole de recette.

Pour Supabase local :

```bash
export SUPABASE_URL="http://127.0.0.1:54321"
export SUPABASE_ANON_KEY="..."
export SUPABASE_SERVICE_ROLE_KEY="..."
export RLS_TEST_ENVIRONMENT="local"
export RLS_TEST_PROJECT_NAME="bcvb-local"
export RLS_TEST_PROJECT_REF="local"
export RLS_TEST_CONFIRM_PROJECT_REF="local"
```

La commande enchaîne :

1. `seed:rls` : comptes et fixtures idempotents ;
2. `test:rls` : isolation réelle via six JWT ;
3. `test:edge` : JWT absent/valide, rôle insuffisant, profil inactif, payload
   invalide et actions autorisées/interdites ;
4. parcours d'intégration : inscription publique, notification admin, validation,
   création Auth/profil, affectation et lecture isolée par équipe.

Le parcours d'intégration ne déclenche aucun fournisseur IA et n'envoie aucun
email. Il utilise les UUID réservés `7000…0001` et `8000…0001`, ainsi que
`rls.integration@bcvb.test`. Il nettoie uniquement ces lignes avant de les recréer.

Le test Edge n'envoie aucun email, ne lance aucun fournisseur IA payant et ne
supprime aucun compte. Il utilise les modes diagnostics ou des requêtes refusées.

## Commandes

```bash
npm run test
npm run test:react
npm run test:security
npm run test:e2e
npm run test:e2e:headed
npm run test:preprod:check
npm run seed:rls
npm run test:rls
npm run test:edge
npm run test:integration
npm run test:all:local
```

## Critères de CI

- `npm run build` doit réussir ;
- `npm run test` doit réussir sans test ignoré ;
- les deux projets Playwright doivent réussir ;
- la préproduction doit réussir `test:integration` avant toute mise en production ;
- le fichier `.rls-test-fixtures.json` doit indiquer le même project ref que la cible ;
- les rapports `playwright-report`, `test-results` et `coverage` ne sont pas commités.
