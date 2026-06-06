import { normalizeBCVBRichMarkdown } from '../features/documents/utils/normalizeBCVBRichMarkdown'
import { normalizeBcvbBlocks } from '../features/documents/utils/normalizeBcvbBlocks'
import { normalizeRawMarkdownTables } from '../features/documents/utils/normalizeRawMarkdownTables'

export function convertRawTablesToBcvbTables(document: string) {
  return normalizeRawMarkdownTables(document)
}

export function cleanBrokenBcvbBlocks(document: string) {
  return normalizeBcvbBlocks(document).content
}

export function normalizeBcvbRichMarkdown(document: string) {
  return normalizeBCVBRichMarkdown(cleanBrokenBcvbBlocks(convertRawTablesToBcvbTables(document))).content
}

export function detectSituationsWithoutDiagram(document: string) {
  const blocks = Array.from(document.matchAll(/:::bcvb-(situation|diagram)[\s\S]*?:::/g))
  const missing: string[] = []

  blocks.forEach((match, index) => {
    if (match[1] !== 'situation') return
    const next = blocks[index + 1]?.[0] ?? ''
    if (!/^:::bcvb-diagram/i.test(next)) {
      const title = /title\s*:\s*(.+)/i.exec(match[0])?.[1]?.trim()
      const numero = /numero\s*:\s*(.+)/i.exec(match[0])?.[1]?.trim()
      missing.push([numero, title].filter(Boolean).join(' — ') || `Situation ${index + 1}`)
    }
  })

  return missing
}

export function buildMissingDiagramPrompt(situation: string) {
  return `
Produis uniquement un bloc :::bcvb-diagram pour la situation suivante.
Le diagramme doit être complet : court half/full choisi intelligemment, players, ball si besoin, arrows, zones si utile, notes.
Utilise court: full pour transition, repli, contre-attaque, 1c1 plein terrain, 3c2, 5c4.
Utilise court: half pour tir, spacing, shell drill, closeout, aide placée.

SITUATION :
${situation}
`.trim()
}

export function addMissingEvaluationGrid(document: string, family: string, category: string) {
  if (/bcvb-evaluation-grid|grille d[’']?évaluation/i.test(document)) return document

  return `${document.trim()}

:::bcvb-evaluation-grid
title: Grille d’évaluation ${category} — ${family}
columns:
  - Domaine
  - Observable terrain
  - Critère de réussite
  - Régulation coach
rows:
  - "Défendre fort", "Pression homme à homme, communication, aide", "Comportement visible sur 80 % des possessions", "Rappeler appuis, distance, voix"
  - "Courir", "Transition immédiate après récupération", "Départ dans les 2 secondes", "Valoriser première passe et couloirs"
  - "Partager", "Ballon vivant, tirs ouverts, coéquipiers servis", "Pas de gel de balle", "Limiter dribbles inutiles"
:::`.trim()
}

export function addMissingCoachChecklist(document: string, family: string, category: string) {
  if (/check-list coach|checklist coach|bcvb-checklist/i.test(document)) return document

  return `${document.trim()}

:::bcvb-checklist
title: Check-list coach ${category} — ${family}
items:
  - Objectif de séance formulé en une phrase.
  - Identité BCVB visible : défendre fort, courir, partager.
  - Situation principale liée au cycle.
  - Diagramme terrain vérifié avant séance.
  - Critère de réussite annoncé aux joueurs.
  - Régulation prévue en fin de séance.
:::`.trim()
}

export function addMissingConclusion(document: string, family: string, category: string) {
  if (/:::bcvb-conclusion/i.test(document)) return document

  return `${document.trim()}

:::bcvb-conclusion
title: Synthèse opérationnelle ${category}
content: Ce document ${family} sert une exigence simple : aider le coach à faire vivre l’identité BCVB dans chaque séance et chaque match. La qualité attendue ne se limite pas à la forme ; elle se mesure à la capacité du coach à défendre fort, faire courir, partager la balle et réguler les apprentissages avec clarté.
:::`.trim()
}
