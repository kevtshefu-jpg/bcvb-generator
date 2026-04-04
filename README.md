# BCVB Generator — V2 premium membres

Cette version part de la base actuelle `bcvb-generator` et ajoute :

- une **page publique** plus propre
- une **connexion membre**
- un **espace protégé**
- une **navigation premium** pour le référentiel, le générateur, les séances, la bibliothèque et le club
- une **zone administration** réservée aux profils admin / dirigeant

## Authentification

Cette version utilise une authentification **Supabase** avec gestion des rôles :

- `admin`
- `dirigeant`
- `coach`
- `member`

## Important

Cette V2 est branchée sur une **authentification Supabase**.

Pour fonctionner correctement, vérifie :

- la configuration des variables d’environnement Supabase
- la table `profiles` avec les rôles utilisateur
- les politiques RLS côté Supabase

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
