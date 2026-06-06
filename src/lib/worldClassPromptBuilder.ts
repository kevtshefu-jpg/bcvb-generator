import type { EditorialScoreReport } from './editorialScoreEngine'
import { getWorldClassEditorialStandard, normalizeEditorialFamilyKey } from './editorialStandards'

export type WorldClassLevel = 'publication_club' | 'reference_bcvb' | 'edition_mondiale'
export type WorldClassProvider = 'chatgpt' | 'claude' | 'dual'

export type WorldClassPromptInput = {
  provider: WorldClassProvider
  level: WorldClassLevel
  familyKey: string
  category: string
  title: string
  currentDocument: string
  sourceText?: string
  scoreReport: EditorialScoreReport
}

const LEVEL_TARGETS: Record<WorldClassLevel, number> = {
  publication_club: 95,
  reference_bcvb: 97,
  edition_mondiale: 100,
}

function providerInstruction(provider: WorldClassProvider) {
  if (provider === 'claude') {
    return 'Tu écris avec la profondeur de Claude : rédaction longue, transitions éditoriales, cohérence humaine, mais tu respectes strictement les blocs BCVB.'
  }
  if (provider === 'dual') {
    return 'Ce prompt sert à une production double : conserve une structure stricte exploitable par ChatGPT et une profondeur rédactionnelle exploitable par Claude.'
  }
  return 'Tu écris avec la rigueur de ChatGPT : structure stricte, contraintes fortes, blocs BCVB propres, tableaux et diagrammes conformes.'
}

function formatList(items: string[]) {
  return items.length ? items.map((item) => `- ${item}`).join('\n') : '- Aucun élément transmis.'
}

function reconstructionMandate(targetScore: number) {
  return `
MODE RECONSTRUCTION ÉDITEUR MONDIAL — NON NÉGOCIABLE :
Tu ne dois pas améliorer légèrement ce document.
Tu dois le reconstruire comme une version finale de référence club, avec un objectif de ${targetScore}/100.

Tu dois impérativement :
- compléter toutes les sections manquantes ;
- transformer tous les tableaux bruts en blocs structurés ;
- créer une vraie hiérarchie éditoriale ;
- ajouter des titres puissants, modernes et lisibles ;
- ajouter des encarts coach ;
- ajouter des synthèses terrain ;
- ajouter une planification riche ;
- ajouter les situations pédagogiques manquantes ;
- associer chaque situation à un schéma terrain exploitable ;
- ajouter une grille d’évaluation joueur ;
- ajouter une grille d’auto-évaluation coach ;
- ajouter une conclusion opérationnelle ;
- supprimer toute trace de syntaxe brute ou générique.

Exigence finale :
- Chaque situation doit être directement utilisable sur le terrain.
- Chaque tableau doit être structuré.
- Chaque diagramme doit être complet.
- Le document doit avoir le niveau d’un éditeur sportif professionnel.
`.trim()
}

export function buildWorldClassPrompt(input: WorldClassPromptInput) {
  const familyKey = normalizeEditorialFamilyKey(input.familyKey)
  const standard = getWorldClassEditorialStandard(familyKey)
  const targetScore = Math.max(LEVEL_TARGETS[input.level], standard.targetScore)

  return `
${providerInstruction(input.provider)}

Tu es le directeur éditorial technique du BCVB, expert mondial de la production documentaire sportive, inspiré par les meilleurs standards FFBB, FIBA, formation européenne, NCAA/USA Basketball, Canada Basketball, LTAD/DLTA et clubs professionnels.

MISSION :
Tu ne fais pas une correction. Tu reconstruis une version publiable.
Le score actuel est ${input.scoreReport.score}/100.
Le score cible est ${targetScore}/100.
Tu dois combler directement l’écart, pas gagner 1 point.

${reconstructionMandate(targetScore)}

CONTEXTE BCVB :
- Club : Basket Club Villefranche Beaujolais.
- Philosophie : Défendre Fort, Courir et Partager la Balle.
- Identité prioritaire : défense Homme à Homme.
- Valeurs : intensité, agressivité maîtrisée, maîtrise, jeu, respect.
- Démarche pédagogique : je découvre / je m’exerce / je retranscris en match / je régule.
- Le document doit être directement utilisable par un coach, un responsable technique ou un dirigeant.

STANDARD DOCUMENTAIRE :
- Famille : ${standard.label}
- Format : ${standard.format}
- Volume attendu : ${standard.expectedVolume}
- Public cible : ${standard.targetAudience}
- Style éditorial : ${standard.editorialStyle}
- Mise en page attendue : ${standard.layout}

STRUCTURE OBLIGATOIRE :
${formatList(standard.requiredStructure)}

QUOTAS OBLIGATOIRES :
- Minimum ${standard.minTables} tableaux structurés.
- Minimum ${standard.minSituations} situations pédagogiques.
- Minimum ${standard.minDiagrams} schémas terrain.
- Minimum ${standard.minBcvbBlocks} blocs BCVB.
- Minimum une grille joueur.
- Minimum une grille coach.
- Minimum une synthèse coach.
- Minimum une conclusion opérationnelle.

ÉCARTS QUALITÉ DÉTECTÉS :
Critiques :
${formatList(input.scoreReport.criticalIssues)}

Majeurs :
${formatList(input.scoreReport.majorIssues)}

Sections absentes :
${formatList(input.scoreReport.missingSections)}

RÈGLES DE SORTIE STRICTES :
- Commencer directement par :::bcvb-hero.
- Produire uniquement du BCVB Rich Markdown.
- Ne jamais expliquer.
- Ne jamais ajouter de commentaire hors document.
- Ne jamais utiliser de tableau Markdown brut.
- Ne jamais laisser de texte brut de type title:, table:, content:, players:, arrows: hors bloc correctement ouvert et fermé.
- Utiliser uniquement des blocs typés.

BLOCS AUTORISÉS :
:::bcvb-hero
:::bcvb-section
:::bcvb-table
:::bcvb-callout
:::bcvb-situation
:::bcvb-diagram
:::bcvb-evaluation-grid
:::bcvb-timeline
:::bcvb-matrix
:::bcvb-checklist
:::bcvb-conclusion

RÈGLE TABLEAUX :
- Aucun tableau Markdown brut.
- Chaque tableau doit être converti en bloc :::bcvb-table avec columns et rows.
- Les tableaux doivent être utiles : planification, progression, critères, erreurs, régulations, check-lists, matrices.

RÈGLE SITUATIONS :
Chaque situation doit contenir : numero, title, finalite, objectif, organisation, materiel, deroulement, consignes_joueurs, points_coach, criteres_reussite, variables_simplification, variables_complexification, evolution_1, evolution_2, transfert_match, erreurs_frequentes, corrections_possibles.

RÈGLE DIAGRAMMES :
- Chaque situation doit avoir immédiatement après un bloc :::bcvb-diagram.
- court: half ou full doit être choisi intelligemment.
- court: full obligatoire pour transition, contre-attaque, repli, sortie/remontée de balle, 1c1 plein terrain, 3c2, 4c3, 5c4, 3c0.
- court: half pour tir, spacing, shell drill, closeout, aide défensive placée, attaque placée.
- players avec coordonnées x/y entre 5 et 95.
- ball si ballon nécessaire.
- arrows obligatoires.
- zones si elles clarifient couloirs, départs, espaces, contraintes.
- notes obligatoires.
- aucune coordonnée hors terrain.
- représenter la mise en place ET l’action principale ; ajouter step: 1 et step: 2 si nécessaire.

RÈGLE STYLE :
- Titres modernes et hiérarchisés.
- Transitions éditoriales.
- Encarts de synthèse.
- Phrases coach prêtes à dire.
- Critères terrain.
- Points de vigilance.
- Erreurs fréquentes.
- Régulations.
- Transfert match.
- Lien constant avec l’identité BCVB.

DOCUMENT ACTUEL À RECONSTRUIRE :
---
${input.currentDocument}
---

SOURCE À MOBILISER SI UTILE :
---
${input.sourceText || 'Aucune source complémentaire.'}
---
`.trim()
}

export function buildWorldClassPromptSet(input: Omit<WorldClassPromptInput, 'provider'>) {
  return {
    chatgptPrompt: buildWorldClassPrompt({ ...input, provider: 'chatgpt' }),
    claudePrompt: buildWorldClassPrompt({ ...input, provider: 'claude' }),
  }
}
