import { QualityReport } from './editorialQualityEngine'
import { getEditorialStandard } from './editorialQualityEngine'

export type PromptProvider = 'chatgpt' | 'claude'
export type PublicationUpgradeMode = 'light' | 'strong' | 'rebuild'

export type PublicationPromptParams = {
  provider: PromptProvider
  familyKey: string
  category: string
  title: string
  currentDocument: string
  report: QualityReport
  sourceText?: string
  upgradeMode?: PublicationUpgradeMode
}

export function buildPublicationUpgradePrompt(params: PublicationPromptParams): string {
  const standard = getEditorialStandard(params.familyKey)
  const providerRule = getProviderRule(params.provider)
  const upgradeMode = params.upgradeMode ?? 'rebuild'
  const modeInstruction = {
    light:
      'Corrige uniquement les erreurs de syntaxe, les blocs incomplets et les tableaux bruts.',
    strong:
      'Élève fortement le document : structure, densité, titres, tableaux, situations, schémas détaillés façon tableau tactique et critères.',
    rebuild:
      'Reconstruis entièrement le document pour atteindre le standard publication club, même si cela implique de réécrire, compléter, réorganiser tout le contenu et redessiner les situations avec des diagrammes beaucoup plus lisibles.',
  }[upgradeMode]

  const criticalIssues = params.report.issues
    .map(issue => `- ${issue.label} : ${issue.message}\n  Correction attendue : ${issue.correctionInstruction}`)
    .join('\n')

  return `
${providerRule}

# MISSION

Tu es le directeur éditorial technique du BCVB.
Tu es aussi un expert mondial de la production documentaire sportive, spécialisé dans les documents basket de niveau club professionnel.

Tu ne fais PAS une correction légère.
Tu ne dois PAS gagner seulement 1 ou 2 points.
Tu dois reconstruire, enrichir et compléter le document pour atteindre directement le niveau publication club.

OBJECTIF QUALITÉ :
- Score actuel : ${params.report.score}/100
- Score cible minimum : ${params.report.targetScore}/100
- Famille documentaire : ${standard.family}
- Catégorie : ${params.category}
- Titre cible : ${params.title}

# MODE DE REHAUSSEMENT

${modeInstruction}

# CONTEXTE BCVB OBLIGATOIRE

Le document doit respecter l’identité BCVB :
- Philosophie : Défendre Fort, Courir et Partager la Balle.
- Identité prioritaire : défense Homme à Homme.
- Valeurs : intensité, agressivité maîtrisée, maîtrise, jeu, respect.
- Démarche pédagogique : je découvre / je m’exerce / je retranscris en match / je régule.
- Exigence terrain : le document doit être directement utilisable par un coach.

# STANDARD ÉDITORIAL À APPLIQUER

Famille : ${standard.family}

Règle de mise en page :
${standard.layoutRule}

Règle éditoriale :
${standard.editorialRule}

Sections obligatoires :
${standard.requiredSections.map(section => `- ${section}`).join('\n')}

Seuils minimum :
- Tableaux minimum : ${standard.minTables}
- Situations pédagogiques minimum : ${standard.minSituations}
- Schémas terrain minimum : ${standard.minDiagrams}
- Score qualité minimum : ${standard.minScore}/100

# PROBLÈMES À CORRIGER

${criticalIssues || '- Aucun problème critique détecté, mais le document doit être élevé en qualité éditoriale.'}

# RÈGLES DE RECONSTRUCTION

Tu dois produire une version complète, propre et directement intégrable au site.

Tu dois obligatoirement :
1. Renforcer la structure générale.
2. Améliorer fortement les titres, sous-titres, transitions et encarts.
3. Transformer tous les tableaux bruts en vrais blocs structurés.
4. Ajouter les sections manquantes.
5. Ajouter les situations pédagogiques manquantes.
6. Ajouter un diagramme terrain complet pour chaque situation.
7. Ajouter une planification plus riche si elle est faible.
8. Ajouter une grille d’évaluation joueur si absente.
9. Ajouter une grille d’auto-évaluation coach si absente.
10. Ajouter une synthèse opérationnelle.
11. Supprimer les traces IA, commentaires techniques, placeholders et lignes brutes.
12. Ne jamais laisser de tableau sous forme de texte séparé par des barres verticales hors bloc structuré.
13. Ne jamais produire une situation sans diagramme associé.
14. Ne jamais produire un diagramme incomplet sans players, arrows, zones utiles et notes.
15. Ne jamais sortir un document inférieur au standard demandé.

# FORMAT DE SORTIE STRICT

Tu dois produire uniquement du BCVB Rich Markdown.

Tu peux utiliser seulement ces blocs :

:::bcvb-hero
title:
subtitle:
category:
audience:
season:
:::

:::bcvb-section
title:
variant:
content:
:::

:::bcvb-table
title:
variant:
columns:
  - 
rows:
  - 
:::

:::bcvb-callout
title:
variant:
content:
:::

:::bcvb-situation
numero:
title:
finalite:
objectif:
organisation:
materiel:
deroulement:
consignes_joueurs:
points_coach:
criteres_reussite:
variables_simplification:
variables_complexification:
evolution_1:
evolution_2:
transfert_match:
erreurs_frequentes:
corrections_possibles:
:::

:::bcvb-diagram
title:
court:
intent:
players:
  - id:
    team:
    x:
    y:
    label:
ball:
  x:
  y:
arrows:
  - type:
    from:
    toX:
    toY:
    label:
zones:
  - x:
    y:
    width:
    height:
    label:
notes:
  - 
:::

:::bcvb-evaluation-grid
title:
columns:
  - 
rows:
  - 
:::

:::bcvb-conclusion
title:
content:
:::

# FORMAT DES TABLEAUX

Pour chaque tableau :
- utiliser obligatoirement :::bcvb-table ou :::bcvb-evaluation-grid ;
- définir les colonnes dans columns ;
- définir chaque ligne dans rows ;
- ne jamais utiliser de tableau Markdown brut ;
- ne jamais écrire des colonnes en texte continu.

# FORMAT DES SCHÉMAS TERRAIN

Pour chaque situation pédagogique :
- ajouter immédiatement après un bloc :::bcvb-diagram ;
- court doit être "half" ou "full" et le choix doit être intelligent ;
- les coordonnées x/y doivent rester entre 5 et 95 ;
- ne jamais placer un joueur hors terrain ;
- utiliser au minimum 5 éléments visibles pour une situation collective ;
- utiliser au minimum 3 players ou 2 players + 2 zones/plots pour une situation simple ;
- utiliser au minimum 2 arrows dès qu’il y a un déplacement réel ;
- ajouter des notes utiles pour comprendre l’exercice.

Choix obligatoire du terrain :
- utiliser court: full pour toute situation qui traverse le terrain ou implique transition, contre-attaque, repli, sortie de balle, remontée de balle, 1c1 plein terrain, 3c2, 4c3, 5c4, 3c0, course-poursuite, récupération vers attaque rapide ;
- utiliser court: half pour les situations de spacing, shell drill, tir, closeout, aide défensive placée, jeu à 2/3 joueurs ou attaque placée sur demi-terrain ;
- si l’exercice commence dans une moitié et finit dans l’autre, utiliser full même si le texte parle aussi de demi-terrain ;
- ne jamais mettre une situation de transition en demi-terrain.

Les diagrammes doivent représenter les étapes réelles de l’exercice :
- position de départ ;
- déplacement principal ;
- passe ou dribble si nécessaire ;
- cible ou zone de réussite ;
- évolution si utile.

Niveau de détail attendu façon FastDraw :
- chaque diagramme doit être immédiatement lisible sans relire toute la situation ;
- placer attaque et défense avec labels courts : 1, 2, 3, 4, 5, x1, x2 ;
- représenter les couloirs, zones de départ, zones de finition et contraintes par des zones ;
- distinguer passe, déplacement, dribble et tir avec des arrows différentes ;
- ajouter un diagramme step: 1 pour la mise en place et un diagramme step: 2 pour le déroulement quand la situation comporte une lecture ou une évolution ;
- ajouter step: 3 uniquement si une évolution change réellement le placement ou la règle ;
- éviter les schémas décoratifs : chaque joueur, flèche et zone doit expliquer une action coachable.

# EXIGENCE DE MISE EN PAGE ÉDITORIALE

La version finale doit être plus raffinée :
- titres plus courts, plus hiérarchisés, plus éditoriaux ;
- sections respirantes, avec des transitions claires ;
- encarts coach plus sobres, plus précis, jamais décoratifs ;
- tableaux moins massifs, orientés décision et usage terrain ;
- situations rédigées comme des fiches professionnelles : objectif clair, consignes courtes, observables précis ;
- éviter les longs blocs uniformes quand un tableau, une note coach ou une synthèse rend la lecture plus nette.

# EXIGENCE DE CONTENU

Le document final doit contenir au minimum :
- 1 couverture éditoriale ;
- 1 identité BCVB ;
- 1 sommaire structuré ;
- 1 finalité de catégorie ;
- 1 profil joueur ;
- 1 rôle du coach ;
- 1 planification annuelle ;
- 1 progression opérationnelle ;
- au moins ${standard.minSituations} situations pédagogiques ;
- au moins ${standard.minDiagrams} schémas terrain ;
- au moins ${standard.minTables} tableaux structurés ;
- 1 grille d’évaluation joueur ;
- 1 grille d’auto-évaluation coach ;
- 1 synthèse coach ;
- 1 conclusion.

# DOCUMENT ACTUEL À RECONSTRUIRE

${params.currentDocument}

# SOURCE ÉVENTUELLE À MOBILISER

${params.sourceText || 'Aucune source supplémentaire fournie.'}

# SORTIE ATTENDUE

Produis maintenant le document complet en BCVB Rich Markdown strict.
Ne commente pas ton travail.
Ne donne pas d’explication autour.
Ne mets pas de bloc de code.
Commence directement par :::bcvb-hero.
`.trim()
}

function getProviderRule(provider: PromptProvider): string {
  if (provider === 'claude') {
    return `
Tu réponds comme Claude : structure longue, rigoureuse, complète, sans résumé prématuré.
Tu dois privilégier la cohérence éditoriale, la précision pédagogique et la complétude.
`
  }

  return `
Tu réponds comme ChatGPT : production structurée, opérationnelle, directement exploitable, avec blocs riches strictement conformes.
`
}
