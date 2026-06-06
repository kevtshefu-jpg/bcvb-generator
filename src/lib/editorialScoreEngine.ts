import { analyzeDocumentQuality } from '../utils/documentQuality'
import { countIncompleteDiagrams } from './diagramValidator'
import { getWorldClassEditorialStandard, normalizeEditorialFamilyKey } from './editorialStandards'
import { detectSituationsWithoutDiagram } from './editorialAutoFixActions'

export type EditorialPublicationLevel =
  | 'non_publiable_reference'
  | 'publiable_apres_relecture'
  | 'reference_club'

export type EditorialScoreReport = {
  score: number
  targetScore: number
  publicationLevel: EditorialPublicationLevel
  criticalIssues: string[]
  majorIssues: string[]
  minorIssues: string[]
  tablesDetected: number
  rawTables: number
  situationsDetected: number
  situationsWithoutDiagram: string[]
  incompleteDiagrams: number
  bcvbBlocksDetected: number
  missingSections: string[]
  recommendations: string[]
  blockersFor95: string[]
  blockersFor100: string[]
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function hasSection(document: string, section: string) {
  return normalizeText(document).includes(normalizeText(section))
}

function levelForScore(score: number): EditorialPublicationLevel {
  if (score < 95) return 'non_publiable_reference'
  if (score < 98) return 'publiable_apres_relecture'
  return 'reference_club'
}

export function buildEditorialScoreReport(params: {
  document: string
  familyKey: string
  category: string
  targetScore?: number
}): EditorialScoreReport {
  const family = normalizeEditorialFamilyKey(params.familyKey)
  const standard = getWorldClassEditorialStandard(family)
  const targetScore = params.targetScore ?? standard.targetScore
  const baseReport = analyzeDocumentQuality({
    content: params.document,
    documentType: standard.label,
    generationType: family,
    category: params.category,
  })

  const rawTables = baseReport.counts.tablesNotRendered + (/\|---|---\|/.test(params.document) ? 1 : 0)
  const situationsWithoutDiagram = detectSituationsWithoutDiagram(params.document)
  const incompleteDiagrams = countIncompleteDiagrams(params.document)
  const missingSections = standard.requiredSections.filter((section) => !hasSection(params.document, section))
  const criticalIssues: string[] = []
  const majorIssues: string[] = []
  const minorIssues: string[] = []

  if (rawTables > 0) criticalIssues.push('Tableaux bruts non convertis.')
  if (situationsWithoutDiagram.length > 0) criticalIssues.push('Situation pédagogique sans diagramme associé.')
  if (incompleteDiagrams > 0) criticalIssues.push('Diagrammes incomplets ou non exploitables.')
  if (baseReport.counts.situations < standard.minSituations) {
    criticalIssues.push(`Situations insuffisantes : ${baseReport.counts.situations}/${standard.minSituations}.`)
  }
  if (baseReport.counts.diagrams < standard.minDiagrams) {
    criticalIssues.push(`Schémas insuffisants : ${baseReport.counts.diagrams}/${standard.minDiagrams}.`)
  }
  if (baseReport.counts.tables < standard.minTables) {
    majorIssues.push(`Tableaux insuffisants : ${baseReport.counts.tables}/${standard.minTables}.`)
  }
  if (baseReport.counts.richBlocks < standard.minBcvbBlocks) {
    majorIssues.push(`Blocs BCVB insuffisants : ${baseReport.counts.richBlocks}/${standard.minBcvbBlocks}.`)
  }
  if (missingSections.length > 0) {
    majorIssues.push(`Sections obligatoires absentes : ${missingSections.join(', ')}.`)
  }
  if (/title:|content:|players:|arrows:/i.test(params.document.replace(/:::bcvb-[\s\S]*?:::/g, ''))) {
    criticalIssues.push('Champs techniques visibles hors bloc BCVB.')
  }
  if (baseReport.score < targetScore) {
    minorIssues.push(`Score à élever directement vers ${targetScore}/100.`)
  }

  const penalty = criticalIssues.length * 6 + majorIssues.length * 3 + minorIssues.length
  const score = Math.max(0, Math.min(100, baseReport.score - penalty))
  const blockersFor95 = [...criticalIssues, ...majorIssues].filter(Boolean)
  const blockersFor100 = [
    ...blockersFor95,
    ...missingSections.map((section) => `Section à enrichir pour niveau 100 : ${section}.`),
    'Finition éditoriale mondiale : transitions, matrices, synthèses, diagrammes multi-étapes.',
  ]

  return {
    score,
    targetScore,
    publicationLevel: levelForScore(score),
    criticalIssues,
    majorIssues,
    minorIssues,
    tablesDetected: baseReport.counts.tables,
    rawTables,
    situationsDetected: baseReport.counts.situations,
    situationsWithoutDiagram,
    incompleteDiagrams,
    bcvbBlocksDetected: baseReport.counts.richBlocks,
    missingSections,
    recommendations: [
      rawTables > 0 ? 'Convertir immédiatement les tableaux bruts.' : '',
      situationsWithoutDiagram.length > 0 ? 'Ajouter un diagramme après chaque situation.' : '',
      incompleteDiagrams > 0 ? 'Régénérer les schémas incomplets avec players, arrows, zones, notes.' : '',
      missingSections.length > 0 ? 'Créer les sections obligatoires absentes.' : '',
      baseReport.score < targetScore ? `Reconstruire vers ${targetScore}/100 sans micro-correction.` : '',
    ].filter(Boolean),
    blockersFor95,
    blockersFor100,
  }
}
