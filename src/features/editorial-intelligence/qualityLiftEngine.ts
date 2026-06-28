import { AI_PROVIDER_PROFILES, type EditorialAiProvider } from '../ai-provider/providerProfiles'
import type { DocumentFamily } from './documentIntentEngine'
import type { EditorialPlan } from './editorialPlanBuilder'
import { getEditorialStandard } from './editorialStandards'
import { getFamilySpecificCorrections } from './familySpecificCorrections'

export type QualityLiftInput = {
  currentDocument: string
  currentScore: number
  targetScore: number
  family: DocumentFamily
  plan: EditorialPlan
  qualityIssues: string[]
  selectedProvider: EditorialAiProvider
}

function liftMode(score: number) {
  if (score < 80) return 'reconstruction éditoriale ciblée'
  if (score < 90) return 'finition publication club'
  return 'contrôle final éditeur'
}

export function buildStrongQualityLiftPrompt(input: QualityLiftInput): string {
  const standard = getEditorialStandard(input.family)
  const provider = AI_PROVIDER_PROFILES[input.selectedProvider]
  const corrections = getFamilySpecificCorrections(input.family, input.qualityIssues)
  const planSummary = [
    `Titre : ${input.plan.title}`,
    `Format : ${input.plan.format}`,
    `Production : ${input.plan.productionLevel}`,
    `Objectifs globaux : ${input.plan.globalTargets.tables} tableaux, ${input.plan.globalTargets.situations} situations, ${input.plan.globalTargets.diagrams} diagrammes, ${input.plan.globalTargets.bcvbBlocks} blocs BCVB.`,
    'Chapitres :',
    ...input.plan.chapters.map((chapter, index) => (
      `${index + 1}. ${chapter.title} — ${chapter.intent} | blocs : ${chapter.expectedBlocks.join(', ')} | priorité : ${chapter.priority}`
    )),
  ].join('\n')
  const standardSummary = [
    `Famille : ${standard.label}`,
    `But : ${standard.purpose}`,
    `Format : ${standard.format}`,
    `Mise en page : ${standard.layout}`,
    `Signature visuelle : ${standard.visualSignature}`,
    `Sections obligatoires : ${standard.requiredSections.join(', ')}`,
    `Quotas : ${standard.minimumTargets.tables} tableaux, ${standard.minimumTargets.situations} situations, ${standard.minimumTargets.diagrams} schémas, ${standard.minimumTargets.bcvbBlocks} blocs BCVB.`,
    `Règles qualité : ${standard.qualityRules.join(' ')}`,
  ].join('\n')
  const issueSummary = corrections.length > 0
    ? corrections.map((correction) => `- ${correction}`).join('\n')
    : '- Aucun problème détaillé transmis : contrôler tout de même la structure, les tableaux, les situations, les diagrammes et la finition éditoriale.'

  return `
Tu es directeur éditorial technique du BCVB, spécialisé dans la production de documents sportifs de niveau publication club professionnel.

Tu ne dois pas faire une correction légère.
Tu dois produire une amélioration forte du document.

OBJECTIF
Faire progresser réellement le document vers un niveau publiable.
Le document actuel est à ${input.currentScore}/100.
L’objectif est d’atteindre au minimum ${input.targetScore}/100.

PROFIL CIBLE : ${provider.label}
- Forces à exploiter : ${provider.strengths.join(', ')}

MODE
${liftMode(input.currentScore)}

FAMILLE DOCUMENTAIRE
${standard.label}

STANDARD À RESPECTER
${standardSummary}

PLAN ÉDITORIAL VALIDÉ
${planSummary}

PROBLÈMES À CORRIGER
${issueSummary}

MISSION
Tu dois réaliser une reconstruction éditoriale ciblée.

Tu dois :
1. Conserver les éléments utiles.
2. Supprimer les répétitions faibles.
3. Réorganiser selon la meilleure architecture documentaire.
4. Renforcer la hiérarchie des titres.
5. Améliorer la lisibilité.
6. Convertir tous les tableaux bruts en blocs typés.
7. Recréer les tableaux faibles.
8. Ajouter les sections manquantes.
9. Ajouter les situations pédagogiques manquantes.
10. Ajouter les diagrammes associés.
11. Renforcer la planification.
12. Ajouter les critères de réussite et les régulations.
13. Adapter le contenu à la catégorie.
14. Intégrer l’identité BCVB.
15. Donner au document une valeur terrain immédiate.
16. Raffiner la mise en page attendue : titres plus sobres, encarts utiles, tableaux orientés décision, situations en fiches professionnelles.

RÈGLES DE QUALITÉ
Le document final doit être :
- structuré,
- dense mais lisible,
- humain,
- exploitable par un coach,
- cohérent avec le BCVB,
- compatible avec le parseur,
- proche d’une publication club professionnelle.

RÈGLES BCVB NON NÉGOCIABLES
- Intégrer la philosophie : Défendre Fort, Courir et Partager la Balle.
- Intégrer l’identité prioritaire : défense Homme à Homme.
- Respecter les valeurs : intensité, agressivité maîtrisée, maîtrise, jeu, respect.
- Utiliser la démarche pédagogique : je découvre / je m’exerce / je retranscris en match / je régule.
- Chaque situation doit être autonome, numérotée et directement coachable.
- Chaque situation doit contenir finalité, objectif, organisation, matériel, déroulement, consignes joueurs, points coach, critères de réussite, variables, évolutions, transfert match, erreurs fréquentes et corrections possibles.
- Chaque situation doit avoir un diagramme associé.
- Les diagrammes doivent être lisibles, cohérents, non coupés, détaillés et adaptés au terrain.
- Utiliser court: full pour transition, contre-attaque, repli, sortie ou remontée de balle, 1c1 plein terrain, 3c2, 4c3, 5c4, 3c0, récupération vers attaque rapide.
- Utiliser court: half pour spacing, shell drill, tir, closeout, aide défensive placée, jeu à 2 ou 3 joueurs et attaque placée.
- Chaque diagramme doit comporter au minimum 5 éléments visibles pour une situation collective, au moins 2 flèches si l’action évolue, des zones si elles aident la lecture, et des notes coachables.
- Pour une grande situation, produire si nécessaire step: 1 mise en place et step: 2 déroulement afin d’obtenir un rendu proche d’un diagramme FastDraw.
- Les planifications doivent être exploitables sur une saison ou un cycle.

SORTIE STRICTE
Retourne uniquement le document final en BCVB Rich Markdown.
Aucun commentaire.
Aucune explication.
Aucun tableau brut.
Aucun champ diagramme hors bloc.
Aucun bloc générique non typé.
Aucun bloc vide.
Aucune balise cassée.
Utiliser uniquement des blocs BCVB typés : :::bcvb-hero, :::bcvb-identity, :::bcvb-section, :::bcvb-table, :::bcvb-planning-table, :::bcvb-progression, :::bcvb-situation, :::bcvb-diagram, :::bcvb-evaluation-grid, :::bcvb-coach-note, :::bcvb-summary, :::bcvb-conclusion.

DOCUMENT ACTUEL :
---
${input.currentDocument}
---
`.trim()
}
