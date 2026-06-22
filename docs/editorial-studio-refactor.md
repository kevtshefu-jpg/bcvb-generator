# Refactor Studio documentaire

## Objectif

Réduire la complexité de `src/pages/EditorialStudioPage.tsx` sans modifier les routes, Supabase, les Edge Functions ni les fonctions d'export existantes.

Le studio reste responsable du parcours BCVB : créer, transformer, scorer, corriger, prévisualiser et exporter.

## Composants créés

- `EditorialStudioHero` : en-tête du studio et actions principales.
- `EditorialStudioModeSelector` : choix clair entre création, transformation, amélioration, contrôle qualité et export.
- `EditorialStudioWorkflow` : parcours compact Intention, Contenu, Amélioration, Contrôle qualité, Export.
- `EditorialStudioForm` : source OCR / texte brut et cadrage documentaire.
- `EditorialStudioPromptPanel` : prompt initial, aides et raccourcis de consignes.
- `EditorialStudioPreview` : affichage du document final.
- `EditorialStudioExportActions` : boutons PDF, Markdown et bibliothèque.
- `EditorialStudioQualityPanel` : statut, score et sous-scores actionnables.
- `EditorialStudioFeedback` : messages utilisateur uniformisés.

## Responsabilités restantes de la page

`EditorialStudioPage.tsx` conserve volontairement :

- les états principaux ;
- l'autosave local ;
- la génération de prompts ;
- l'analyse qualité ;
- la correction contrôlée ;
- les callbacks d'export existants ;
- la composition générale du studio.

## TODO futurs

- Extraire la correction contrôlée dans un composant d'affichage pur.
- Isoler les actions rapides d'assistance dans un composant dédié.
- Remplacer l'aperçu brut par le renderer BCVB Rich Markdown si le rendu existant est stabilisé.
- Ajouter des tests UI ciblés sur les chemins prompt, preview, score et export.

## Tests à faire après modification

- Ouvrir `/admin/studio-editorial`.
- Changer de mode studio.
- Générer un prompt ChatGPT et Claude.
- Importer un fichier texte simple.
- Modifier les métadonnées.
- Analyser une réponse et vérifier le score.
- Prévisualiser le document final.
- Exporter PDF via la fonction existante.
- Télécharger la source Markdown.
- Enregistrer un brouillon bibliothèque.
