# BCVB Generator — V2 premium membres

Cette version part de la base actuelle `bcvb-generator` et ajoute :

- une **page publique** plus propre
- une **connexion membre**
- un **espace protégé**
- une **navigation premium** pour le référentiel, le générateur, les séances, la bibliothèque et le club
- une **zone administration** réservée aux profils admin / dirigeant

## Comptes de démonstration intégrés

- `kevin@bcvb.local` / `BCVB2026!` → admin
- `coach@bcvb.local` / `CoachBCVB!` → coach
- `dirigeant@bcvb.local` / `DirigeantBCVB!` → dirigeant

## Important

Cette V2 utilise une **authentification locale de démonstration** pour te permettre de tester immédiatement l’interface.

Pour une vraie mise en production membres, la suite logique est de brancher :

- **Supabase Auth** ou **Firebase Auth**
- une table de profils / rôles
- une vraie protection des données côté backend

## Lancer le projet

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Déploiement Vercel

Le fichier `vercel.json` gère la réécriture SPA.

Tu peux déployer directement sur Vercel.

## Basename

Par défaut, l’application tourne sur `/`.

Si tu veux la servir depuis un sous-dossier, copie `.env.example` vers `.env` et adapte :

```bash
VITE_APP_BASENAME=/tools/generator/
```
