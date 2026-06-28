import {
  getExpectedRichBlockMinimum,
  getDocumentContentStandard,
  type DocumentContentStandard,
} from './documentContentStandards'
import { parseBCVBRichMarkdown } from '../features/documents/utils/parseBCVBRichMarkdown'
import { parseStructuredContent } from '../features/documents/utils/structuredContentParser'
import { resolveDocumentFamilyId } from '../features/documents/standards/documentFamilyStandards'
import { getDocumentQualityRules } from '../features/documents/quality/documentQualityRules'

export type DocumentQualityStatus =
  | 'Référence club'
  | 'Très bon niveau'
  | 'Solide mais incomplet'
  | 'Base structurée mais insuffisante'
  | 'Très incomplet'

export type DocumentQualityCheck = {
  label: string
  status: 'pass' | 'warning' | 'fail'
  detail: string
}

export type DocumentQualityReport = {
  standard: DocumentContentStandard
  status: DocumentQualityStatus
  score: number
  scoreTarget: number
  editorialStatus: 'non_exploitable' | 'base_faible' | 'bon_brouillon' | 'presque_publiable' | 'publiable'
  blockingIssues: string[]
  improvementActions: Array<{
    label: string
    priority: 'critical' | 'high' | 'medium'
    expectedGain: number
    actionType:
      | 'convert_tables'
      | 'add_situations'
      | 'add_diagrams'
      | 'strengthen_planning'
      | 'add_evaluation'
      | 'improve_layout'
      | 'rewrite_sections'
      | 'normalize_blocks'
  }>
  estimatedPotentialScore: number
  counts: {
    tables: number
    situations: number
    diagrams: number
    richBlocks: number
    expectedRichBlocks: number
    parsedBlocks: number
    tableBlocksDetected: number
    markdownTablesParsed: number
    tablesRendered: number
    tablesNotRendered: number
    situationsDetected: number
    situationsWithDiagram: number
    diagramsValid: number
    diagramsInferred: number
    rawTechnicalFieldsVisible: number
    inlineBlocksDetected: number
    genericBlocksDetected: number
  }
  scores: {
    contentScore: number
    structureScore: number
    renderScore: number
    exportScore: number
    globalScore: number
  }
  checks: DocumentQualityCheck[]
  verdict: string
}

function normalizeContent(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0
}

function countMarkdownTables(content: string) {
  return parseStructuredContent(content).filter((segment) => segment.type === 'table').length
}

function countTabTables(content: string) {
  const lines = content.split('\n')
  let count = 0
  let inTable = false

  for (const line of lines) {
    const isTableLine = line.includes('\t') && line.trim().split('\t').length >= 2
    if (isTableLine && !inTable) {
      count += 1
      inTable = true
    }
    if (!isTableLine) {
      inTable = false
    }
  }

  return count
}

function hasAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value))
}

function analyzeBlockSyntax(content: string) {
  let openTypedBlocks = 0
  const genericBlocks: Array<{ line: number; detail: string }> = []
  let insideTypedBlock = false
  let lastTypedBlock: string | null = null

  for (const [index, rawLine] of content.split('\n').entries()) {
    const line = rawLine.trim()

    const typedMatch = /^:::\s*(bcvb-[a-z0-9_-]+)/i.exec(line)
    if (typedMatch) {
      if (insideTypedBlock) {
        openTypedBlocks += 1
      }
      insideTypedBlock = true
      lastTypedBlock = typedMatch[1]
      continue
    }

    if (line === ':::') {
      if (insideTypedBlock) {
        insideTypedBlock = false
      } else {
        genericBlocks.push({
          line: index + 1,
          detail: lastTypedBlock
            ? `Fermeture de bloc isolée après ${lastTypedBlock}`
            : 'Bloc générique vide ou non typé',
        })
      }
    }
  }

  if (insideTypedBlock) {
    openTypedBlocks += 1
  }

  return { genericBlocks, unclosedTypedBlocks: openTypedBlocks }
}

function countRawDiagramFieldLeaks(content: string) {
  const withoutTypedDiagrams = content.replace(/:::bcvb-diagram[\s\S]*?:::/gi, '')
  const withoutFencedDiagrams = withoutTypedDiagrams.replace(/```bcvb-diagram[\s\S]*?```/gi, '')

  return countMatches(
    withoutFencedDiagrams,
    /^(players|arrows|notes|ball|court|intent|team|from|tox|toy)\s*:/gim
  )
}

function countRawPipeLinesOutsideTypedTables(content: string) {
  const withoutTypedTables = content
    .replace(/:::bcvb-(table|planning-table|progression|session-template|evaluation-grid|summary|cycle|microcycle)[\s\S]*?:::/gi, '')
    .replace(/```[\s\S]*?```/g, '')

  return withoutTypedTables
    .split('\n')
    .filter((line) => line.includes('|') && line.split('|').filter((cell) => cell.trim()).length >= 2)
    .length
}

function countParasiteCharacters(content: string) {
  return countMatches(content, /^\s*[éèàùç]\s*$/gim)
}

function countExtractionArtifacts(content: string) {
  let count = 0
  count += countMatches(content, /\bundefined\b|\[object Object\]/g)
  count += countMatches(content, /page\s+\d+\s+sur\s+\d+/gi)
  count += countMatches(content, /^\s*\|?\s*-{3,}\s*(\|\s*-{3,}\s*)+\|?\s*$/gm)
  count += countMatches(content, /\n{5,}/g)
  count += countMatches(content, /[^\S\r\n]{8,}/g)
  return count
}

function getTypedBlockBodies(content: string, blockType: string) {
  const pattern = new RegExp(`^:::\\s*${blockType}\\b[\\s\\S]*?^:::\\s*$`, 'gim')
  return Array.from(content.matchAll(pattern)).map((match) => match[0])
}

function countSituationBlocksWithFields(content: string, fields: string[]) {
  return getTypedBlockBodies(content, 'bcvb-situation').filter((block) =>
    fields.every((field) => new RegExp(`^${field}\\s*:`, 'im').test(block))
  ).length
}

function countSituationsWithoutDiagramNearby(content: string) {
  const situationPattern = /^:::\s*bcvb-(situation|exercise-card)\b/gim
  let missing = 0
  let match: RegExpExecArray | null

  while ((match = situationPattern.exec(content)) !== null) {
    const nearby = content.slice(match.index, match.index + 1200)
    if (!/^:::\s*bcvb-diagram\b/gim.test(nearby)) missing += 1
  }

  return missing
}

function makeThresholdCheck(
  label: string,
  count: number,
  minimum: number,
  unit: string
): DocumentQualityCheck {
  if (count >= minimum) {
    return {
      label,
      status: 'pass',
      detail: `${count} ${unit} détecté${count > 1 ? 's' : ''}`,
    }
  }

  if (count >= Math.max(1, Math.floor(minimum * 0.7))) {
    return {
      label,
      status: 'warning',
      detail: `${count} ${unit} détecté${count > 1 ? 's' : ''}, objectif ${minimum}`,
    }
  }

  return {
    label,
    status: 'fail',
    detail: `${count} ${unit} détecté${count > 1 ? 's' : ''}, minimum attendu ${minimum}`,
  }
}

function makePresenceCheck(
  label: string,
  detected: boolean,
  successDetail: string,
  failDetail: string
): DocumentQualityCheck {
  return {
    label,
    status: detected ? 'pass' : 'fail',
    detail: detected ? successDetail : failDetail,
  }
}

export function analyzeDocumentQuality(input: {
  content: string
  documentType?: string
  generationType?: string
  title?: string
  category?: string
  subcategory?: string
  userInstruction?: string
}): DocumentQualityReport {
  const scoreTarget = 92
  const content = input.content.trim()
  const standard = getDocumentContentStandard({
    ...input,
    content,
  })
  const family = resolveDocumentFamilyId(
    [
      input.documentType,
      input.generationType,
      input.title,
      input.category,
      content.slice(0, 500),
    ]
      .filter(Boolean)
      .join(' ')
  )
  const familyRules = getDocumentQualityRules(family)
  const normalized = normalizeContent(content)

  const tables = countMarkdownTables(content) + countTabTables(content)
  const situations = countMatches(content, /^:::\s*bcvb-situation\b/gim)
  const exerciseCards = countMatches(content, /^:::\s*bcvb-exercise-card\b/gim)
  const countedSituations = situations + exerciseCards
  const diagrams = countMatches(content, /^:::\s*bcvb-diagram\b/gim)
  const richBlocks = countMatches(content, /^:::\s*bcvb-/gim)
  const expectedRichBlocks = getExpectedRichBlockMinimum(standard)
  const parsedBlocks = parseBCVBRichMarkdown(content)
  const parsedRenderableBlocks = parsedBlocks.filter((block) => block.type !== 'bcvb-markdown').length
  const parsedTables = Math.max(
    parseStructuredContent(content).filter((segment) => segment.type === 'table').length,
    parsedBlocks.reduce((total, block) => total + block.tables.length, 0)
  )
  const tableBlocksDetected = parsedBlocks.filter((block) =>
    [
      'bcvb-planning-table',
      'bcvb-table',
      'bcvb-progression',
      'bcvb-session-template',
      'bcvb-evaluation-grid',
      'bcvb-cycle',
      'bcvb-microcycle',
    ].includes(block.type)
  ).length
  const inlineBlocks = countMatches(content, /^:::\s*bcvb-[a-z0-9_-]+\s+.+\s+:::\s*$/gim)
  const annexes = countMatches(content, /:::bcvb-annex\b/gi) + countMatches(normalized, /\bannexe\b/g)
  const microcycles = countMatches(content, /:::bcvb-microcycle\b/gi) + countMatches(normalized, /\bmicrocycle\b/g)
  const blockSyntax = analyzeBlockSyntax(content)
  const genericBlockIssues = blockSyntax.genericBlocks
  const untypedBlocks = genericBlockIssues.length
  const unclosedTypedBlocks = blockSyntax.unclosedTypedBlocks
  const rawDiagramFieldLeaks = countRawDiagramFieldLeaks(content)
  const rawPipeLinesOutsideTypedTables = countRawPipeLinesOutsideTypedTables(content)
  const parasiteCharacters = countParasiteCharacters(content)
  const extractionArtifacts = countExtractionArtifacts(content)

  const hasTitle =
    /^#\s+.+/m.test(content) ||
    /:::bcvb-hero[\s\S]*?(^|\n)(title|titre)\s*:\s*.+/i.test(content)
  const hasSubtitle =
    /(subtitle|sous-titre|sous_titre)\s*:/i.test(content) ||
    /^.{12,120}$/m.test(content)
  const hasPlanning = hasAny(normalized, [
    /bcvb-planning/,
    /bcvb-planning-table/,
    /planification annuelle/,
    /planification par periode/,
  ])
  const hasProgression = hasAny(normalized, [
    /bcvb-progression/,
    /progression par periode/,
    /progression par domaine/,
    /progression operationnelle/,
  ])
  const hasCycle = hasAny(normalized, [/cycle de 6 semaines/, /cycle type/, /bcvb-cycle/, /bcvb-microcycle/])
  const hasSession = hasAny(normalized, [/seance type/, /seance complete/, /bcvb-session/, /bcvb-session-template/])
  const hasSynthesis = hasAny(normalized, [/synthese/, /bcvb-synthesis/, /bcvb-conclusion/, /bcvb-poster/, /a retenir/])
  const hasToc = hasAny(normalized, [/sommaire/, /bcvb-summary/])
  const hasCriteria = hasAny(normalized, [/critere de reussite/, /criteres de reussite/, /bcvb-criteria/, /bcvb-evaluation-grid/])
  const hasVigilance = hasAny(normalized, [/point de vigilance/, /points de vigilance/, /vigilance/, /bcvb-vigilance/])
  const hasRoleCoach = hasAny(normalized, [/role du coach/, /posture coach/, /posture attendue/])
  const hasInstitutionalIndicators = hasAny(normalized, [/indicateur/, /tableau de bord/, /matrice competence/, /parcours joueur/])
  const hasChronologicalFlow = hasAny(normalized, [/deroule chronologique/, /temps\s*\|/, /duree/, /minute par minute/])
  const hasDefinition = hasAny(normalized, [/definition/, /pourquoi c est important/])
  const completeSessions = countMatches(normalized, /seance complete|exemple de seance complete/g)
  const hasPlayerEvaluation = hasAny(normalized, [
    /evaluation joueur/,
    /grille d observation joueur/,
    /reperes d observation/,
  ])
  const hasCoachSelfEvaluation = hasAny(normalized, [
    /auto-evaluation coach/,
    /auto evaluation coach/,
    /auto-evaluation du coach/,
  ])
  const hasParentsCommunication = hasAny(normalized, [
    /parents/,
    /communication whatsapp/,
    /familles/,
  ])
  const hasPlateauOrganization = hasAny(normalized, [
    /plateau u7/,
    /organisation des plateaux/,
    /organisation d un plateau/,
  ])
  const hasNextCategoryPrep = hasAny(normalized, [
    /preparation au u9/,
    /passage en u9/,
    /entrer en u9/,
    /avant d entrer en u9/,
  ])
  const hasMetaTrace = hasAny(normalized, [
    /chatgpt/,
    /intelligence artificielle/,
    /\bia\b/,
    /assistant ia/,
    /recommandations? de mise en page/,
    /mise en page premium/,
    /voici une proposition/,
    /ce document pourrait/,
  ])
  const contentTooShort = normalized.replace(/\s+/g, ' ').trim().length < 1200
  const situationsMissingEvolution = Math.max(
    0,
    situations - countSituationBlocksWithFields(content, ['evolution_1', 'evolution_2'])
  )
  const situationsMissingTransfer = Math.max(
    0,
    situations - countSituationBlocksWithFields(content, ['transfert_match'])
  )
  const situationsWithoutNearbyDiagram = countSituationsWithoutDiagramNearby(content)
  const diagramsValid = parsedBlocks.filter(
    (block) =>
      block.type === 'bcvb-diagram' &&
      /players\s*:/i.test(block.raw) &&
      /arrows\s*:/i.test(block.raw) &&
      /^\s*-\s+/m.test(block.raw)
  ).length
  const incompleteDiagrams = Math.max(0, diagrams - diagramsValid)
  const diagramsInferred = Math.max(0, countedSituations - diagramsValid)
  const unrenderedTables = Math.max(0, tables - parsedTables)
  const markdownOnlyBlocks = parsedBlocks.filter((block) => block.type === 'bcvb-markdown').length
  const tooMuchTextWithoutBlocks = richBlocks > 0 && markdownOnlyBlocks > richBlocks
  const planningRichDetected = parsedBlocks.some((block) => {
    if (block.type !== 'bcvb-planning-table') return false
    const joinedHeaders = block.tables
      .flatMap((table) => table.headers)
      .join(' ')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')

    return (
      /periode/.test(joinedHeaders) &&
      /theme/.test(joinedHeaders) &&
      /objectif/.test(joinedHeaders) &&
      /(contenu|situation)/.test(joinedHeaders) &&
      /(critere|vigilance|match|plateau)/.test(joinedHeaders)
    )
  })

  const checks: DocumentQualityCheck[] = [
    makePresenceCheck('Titre', hasTitle, 'Titre ou hero détecté', 'Aucun titre principal évident'),
    makePresenceCheck('Sous-titre', hasSubtitle, 'Sous-titre probable détecté', 'Sous-titre non détecté'),
    makeThresholdCheck('Tableaux', tables, standard.minimumTables, 'tableau'),
    makeThresholdCheck('Situations pédagogiques', countedSituations, standard.minimumSituations, 'situation'),
    makeThresholdCheck('Diagrammes terrain', diagrams, standard.minimumDiagrams, 'diagramme'),
  ]

  if (standard.requiresPlanning) {
    checks.push(
      makePresenceCheck(
        'Planification',
        hasPlanning,
        'Planification détectée',
        'Planification annuelle ou par période absente'
      )
    )
  }

  if (standard.requiresProgression) {
    checks.push(
      makePresenceCheck(
        'Progression',
        hasProgression,
        'Progression détectée',
        'Progression par période ou domaine absente'
      )
    )
  }

  if (standard.requiresCycle) {
    checks.push(
      makePresenceCheck('Cycle type', hasCycle, 'Cycle détecté', 'Cycle type non détecté')
    )
  }

  if (standard.requiresSession) {
    checks.push(
      makePresenceCheck(
        'Séance type',
        hasSession,
        'Séance type détectée',
        'Séance type ou séance complète absente'
      )
    )
  }

  if (standard.requiresSynthesis) {
    checks.push(
      makePresenceCheck('Synthèse', hasSynthesis, 'Synthèse détectée', 'Synthèse finale absente')
    )
  }

  if (standard.requiresToc) {
    checks.push(
      makePresenceCheck('Sommaire', hasToc, 'Sommaire détecté', 'Sommaire détaillé absent')
    )
  }

  if ((standard.minimumAnnexes ?? 0) > 0) {
    checks.push(
      makeThresholdCheck('Annexes', annexes, standard.minimumAnnexes ?? 0, 'annexe')
    )
  }

  if (standard.requiresEvaluation) {
    checks.push(
      makePresenceCheck(
        'Évaluation',
        hasPlayerEvaluation,
        'Évaluation joueur détectée',
        'Grille de progression ou suivi joueur absent'
      )
    )
  }

  if (standard.requiresFamiliesCommunication) {
    checks.push(
      makePresenceCheck(
        'Familles / communication',
        hasParentsCommunication,
        'Familles ou communication détectées',
        'Bloc familles / communication absent'
      )
    )
  }

  if (standard.requiresNextCategoryBridge) {
    checks.push(
      makePresenceCheck(
        'Passerelle catégorie suivante',
        hasNextCategoryPrep,
        'Passerelle catégorie suivante détectée',
        'Passerelle vers la catégorie suivante absente'
      )
    )
  }

  if (standard.requiresMicrocycles) {
    checks.push(
      makeThresholdCheck('Microcycles', microcycles, standard.minimumMicrocycles ?? 0, 'microcycle')
    )
  }

  if (standard.key === 'categoryTechnicalBook') {
    checks.push(
      makePresenceCheck(
        'Deux séances complètes',
        completeSessions >= 2,
        `${completeSessions} exemples de séances complètes détectés`,
        `${completeSessions} exemple de séance complète détecté, objectif 2`
      ),
      makePresenceCheck(
        'Évaluation joueur',
        hasPlayerEvaluation,
        'Grille ou repères joueur détectés',
        'Évaluation joueur ou grille d’observation absente'
      ),
      makePresenceCheck(
        'Auto-évaluation coach',
        hasCoachSelfEvaluation,
        'Auto-évaluation coach détectée',
        'Auto-évaluation coach absente'
      ),
      makePresenceCheck(
        'Parents / communication',
        hasParentsCommunication,
        'Bloc parents ou communication détecté',
        'Bloc parents / communication absent'
      ),
      makePresenceCheck(
        'Organisation des plateaux',
        hasPlateauOrganization,
        'Organisation des plateaux détectée',
        'Organisation des plateaux absente'
      ),
      makePresenceCheck(
        'Préparation catégorie suivante',
        hasNextCategoryPrep,
        'Préparation à la catégorie suivante détectée',
        'Lien avec la préparation au U9 ou à la catégorie suivante absent'
      )
    )
  }

  if (standard.key === 'coachGuide') {
    checks.push(
      makePresenceCheck(
        'Planification guide coach',
        hasPlanning,
        'Planification détectée',
        'Planification absente pour un guide coach'
      ),
      makePresenceCheck(
        'Progression opérationnelle',
        hasProgression,
        'Progression détectée',
        'Progression opérationnelle absente'
      ),
      makePresenceCheck(
        'Séance type',
        hasSession,
        'Séance type détectée',
        'Séance type absente'
      ),
      makePresenceCheck(
        'Grille d’évaluation',
        hasPlayerEvaluation,
        'Évaluation joueur détectée',
        'Grille d’évaluation joueur absente'
      )
    )
  }

  checks.push(
    makeThresholdCheck(
      `Famille ${familyRules.family} · tableaux`,
      tables,
      familyRules.minimumTables,
      'tableau'
    ),
    makeThresholdCheck(
      `Famille ${familyRules.family} · situations`,
      countedSituations,
      familyRules.minimumSituations,
      'situation'
    ),
    makeThresholdCheck(
      `Famille ${familyRules.family} · diagrammes`,
      diagrams,
      familyRules.minimumDiagrams,
      'diagramme'
    )
  )

  if (family === 'coach-guide') {
    checks.push(
      makePresenceCheck('Standard guide · rôle du coach', hasRoleCoach, 'Rôle ou posture coach détecté', 'Rôle ou posture coach absent'),
      makePresenceCheck('Standard guide · relation familles', hasParentsCommunication, 'Relation familles détectée', 'Relation familles absente')
    )
  }

  if (family === 'training-plan') {
    checks.push(
      makePresenceCheck('Standard plan · indicateurs', hasInstitutionalIndicators, 'Indicateurs ou matrice détectés', 'Indicateurs, matrice ou parcours joueur absents')
    )
  }

  if (family === 'practice-session') {
    checks.push(
      makePresenceCheck('Standard séance · déroulé', hasChronologicalFlow, 'Déroulé chronologique détecté', 'Déroulé chronologique absent')
    )
  }

  if (family === 'theme-sheet') {
    checks.push(
      makePresenceCheck('Standard fiche · définition', hasDefinition, 'Définition ou importance détectée', 'Définition du thème absente')
    )
  }

  checks.push(
    makePresenceCheck(
      'Critères de réussite',
      hasCriteria,
      'Critères de réussite détectés',
      'Critères de réussite absents'
    ),
    makePresenceCheck(
      'Points de vigilance',
      hasVigilance,
      'Points de vigilance détectés',
      'Points de vigilance absents'
    ),
    {
      label: 'Traces méta',
      status: hasMetaTrace ? 'fail' : 'pass',
      detail: hasMetaTrace
        ? 'Formulations méta détectées'
        : 'Aucune trace méta évidente détectée',
    },
    {
      label: 'Blocs BCVB typés',
      status:
        richBlocks >= expectedRichBlocks
          ? 'pass'
          : richBlocks > 0
            ? 'warning'
            : 'fail',
      detail: `${richBlocks} bloc${richBlocks > 1 ? 's' : ''} BCVB typé${richBlocks > 1 ? 's' : ''} détecté${richBlocks > 1 ? 's' : ''} / ${expectedRichBlocks} recommandés`,
    },
    {
      label: 'Blocs génériques',
      status: untypedBlocks === 0 ? 'pass' : 'fail',
      detail:
        untypedBlocks === 0
          ? 'Aucun bloc ::: générique détecté'
          : `${untypedBlocks} fermeture isolée ou bloc ::: non typé détecté${untypedBlocks > 1 ? 's' : ''}. ${genericBlockIssues
              .slice(0, 3)
              .map((issue) => `Ligne ${issue.line}: ${issue.detail}`)
              .join(' · ')}. Supprimer les balises ::: isolées ou non typées.`,
    },
    {
      label: 'Syntaxe des blocs',
      status: unclosedTypedBlocks === 0 ? 'pass' : 'fail',
      detail:
        unclosedTypedBlocks === 0
          ? 'Blocs typés correctement fermés'
          : `${unclosedTypedBlocks} bloc${unclosedTypedBlocks > 1 ? 's' : ''} typé${unclosedTypedBlocks > 1 ? 's' : ''} possiblement non fermé${unclosedTypedBlocks > 1 ? 's' : ''}`,
    },
    {
      label: 'Champs diagramme bruts',
      status: rawDiagramFieldLeaks === 0 ? 'pass' : 'fail',
      detail:
        rawDiagramFieldLeaks === 0
          ? 'Aucun champ technique brut détecté hors bloc'
          : `${rawDiagramFieldLeaks} champ${rawDiagramFieldLeaks > 1 ? 's' : ''} technique${rawDiagramFieldLeaks > 1 ? 's' : ''} possiblement visible${rawDiagramFieldLeaks > 1 ? 's' : ''}`,
    },
    {
      label: 'Caractères parasites',
      status: parasiteCharacters === 0 ? 'pass' : 'warning',
      detail:
        parasiteCharacters === 0
          ? 'Aucun caractère parasite isolé détecté'
          : `${parasiteCharacters} caractère${parasiteCharacters > 1 ? 's' : ''} parasite${parasiteCharacters > 1 ? 's' : ''} isolé${parasiteCharacters > 1 ? 's' : ''} détecté${parasiteCharacters > 1 ? 's' : ''}`,
    },
    {
      label: 'Artefacts d’extraction',
      status: extractionArtifacts === 0 ? 'pass' : 'warning',
      detail:
        extractionArtifacts === 0
          ? 'Aucun artefact évident de fichier importé'
          : `${extractionArtifacts} artefact${extractionArtifacts > 1 ? 's' : ''} potentiel${extractionArtifacts > 1 ? 's' : ''} détecté${extractionArtifacts > 1 ? 's' : ''} : lignes vides excessives, séparateurs de tableau bruts, undefined, [object Object] ou pagination répétée`,
    },
    {
      label: 'Volume documentaire',
      status: contentTooShort ? 'warning' : 'pass',
      detail: contentTooShort
        ? 'Texte final très court : vérifier que l’OCR ou la transformation n’a pas perdu le contenu source'
        : 'Volume documentaire exploitable',
    },
    {
      label: 'Évolutions des situations',
      status: situationsMissingEvolution === 0 ? 'pass' : 'warning',
      detail:
        situationsMissingEvolution === 0
          ? 'Évolutions détectées pour les situations'
          : `${situationsMissingEvolution} situation${situationsMissingEvolution > 1 ? 's' : ''} possiblement sans évolution`,
    },
    {
      label: 'Transfert match',
      status: situationsMissingTransfer === 0 ? 'pass' : 'warning',
      detail:
        situationsMissingTransfer === 0
          ? 'Transferts match détectés'
          : `${situationsMissingTransfer} situation${situationsMissingTransfer > 1 ? 's' : ''} possiblement sans transfert match`,
    },
    {
      label: 'Blocs inline',
      status: inlineBlocks === 0 ? 'pass' : 'fail',
      detail:
        inlineBlocks === 0
          ? 'Aucun bloc BCVB écrit sur une seule ligne'
          : `${inlineBlocks} bloc${inlineBlocks > 1 ? 's' : ''} inline détecté${inlineBlocks > 1 ? 's' : ''}. Chaque champ doit être sur sa propre ligne.`,
    },
    {
      label: 'Tables reconnues',
      status: parsedTables > 0 || tables === 0 ? 'pass' : 'warning',
      detail:
        parsedTables > 0
          ? `${parsedTables} table${parsedTables > 1 ? 's' : ''} prête${parsedTables > 1 ? 's' : ''} pour le rendu HTML`
          : tables > 0
            ? 'Tables détectées, mais rendu structuré à vérifier'
            : 'Aucune table à rendre',
    },
    {
      label: 'Tableaux non convertis',
      status: unrenderedTables === 0 && rawPipeLinesOutsideTypedTables === 0 ? 'pass' : 'warning',
      detail:
        unrenderedTables === 0 && rawPipeLinesOutsideTypedTables === 0
          ? 'Tous les tableaux détectés sont prêts pour le rendu'
          : `${unrenderedTables} tableau${unrenderedTables > 1 ? 'x' : ''} non parsé${unrenderedTables > 1 ? 's' : ''}, ${rawPipeLinesOutsideTypedTables} ligne${rawPipeLinesOutsideTypedTables > 1 ? 's' : ''} avec pipes hors bloc tableau typé`,
    },
    {
      label: 'Planification riche',
      status: planningRichDetected ? 'pass' : hasPlanning ? 'warning' : 'fail',
      detail: planningRichDetected
        ? 'Planification riche et actionnable détectée'
        : hasPlanning
          ? 'Planification détectée, mais colonnes terrain/critères/vigilance à renforcer'
          : 'Planification riche absente',
    },
    {
      label: 'Situations avec schéma',
      status: situationsWithoutNearbyDiagram === 0 ? 'pass' : 'warning',
      detail:
        situationsWithoutNearbyDiagram === 0
          ? 'Volume de diagrammes cohérent avec les situations'
          : `${situationsWithoutNearbyDiagram} situation${situationsWithoutNearbyDiagram > 1 ? 's' : ''} sans diagramme associé probable`,
    },
    {
      label: 'Situation sans diagramme associé',
      status: situationsWithoutNearbyDiagram === 0 ? 'pass' : 'fail',
      detail:
        situationsWithoutNearbyDiagram === 0
          ? 'Chaque situation possède un diagramme proche'
          : `${situationsWithoutNearbyDiagram} situation${situationsWithoutNearbyDiagram > 1 ? 's' : ''} sans diagramme dans les 1200 caractères suivants`,
    },
    {
      label: 'Diagrammes complets',
      status: incompleteDiagrams === 0 ? 'pass' : 'warning',
      detail:
        incompleteDiagrams === 0
          ? 'Diagrammes typés avec players/arrows exploitables'
          : `${incompleteDiagrams} diagramme${incompleteDiagrams > 1 ? 's' : ''} incomplet${incompleteDiagrams > 1 ? 's' : ''} : vérifier players, arrows, zones ou ball`,
    },
    {
      label: 'Densité de blocs',
      status: tooMuchTextWithoutBlocks ? 'warning' : 'pass',
      detail: tooMuchTextWithoutBlocks
        ? 'Trop de texte reste hors blocs BCVB typés'
        : 'Structure majoritairement portée par des blocs BCVB',
    },
    {
      label: 'Blocs affichables en rendu premium',
      status:
        parsedRenderableBlocks >= Math.min(expectedRichBlocks, richBlocks)
          ? 'pass'
          : parsedRenderableBlocks > 0
            ? 'warning'
            : 'fail',
      detail: `${parsedRenderableBlocks} bloc${parsedRenderableBlocks > 1 ? 's' : ''} correctement parsé${parsedRenderableBlocks > 1 ? 's' : ''} pour le rendu éditorial`,
    }
  )

  const total = checks.length
  const passed = checks.filter((check) => check.status === 'pass').length
  const warned = checks.filter((check) => check.status === 'warning').length
  let score = Math.round(((passed + warned * 0.45) / total) * 100)

  if (tables === 0 && countedSituations === 0 && diagrams === 0) {
    score = Math.min(score, 49)
  }

  if (standard.key === 'categoryTechnicalBook') {
    if (!hasTitle) {
      score = Math.min(score, 79)
    }

    if (richBlocks === 0) {
      score = Math.min(score, 59)
    }

    if (diagrams === 0) {
      score = Math.min(score, 69)
    }

    if (tables < standard.minimumTables) {
      score = Math.min(score, 79)
    }

    if (countedSituations < standard.minimumSituations) {
      score = Math.min(score, 74)
    }

    if (tables < 10 || countedSituations < 12 || diagrams < 8) {
      score = Math.min(score, 69)
    }

    if (tables < standard.minimumTables || countedSituations < standard.minimumSituations || diagrams < standard.minimumDiagrams) {
      score = Math.min(score, 84)
    }
  }

  if (standard.key === 'technicalBookU7U11' || standard.key === 'technicalBookU13U15') {
    if (richBlocks === 0) score = Math.min(score, 59)
    if (diagrams === 0) score = Math.min(score, 69)
    if (diagrams < 8) score = Math.min(score, 59)
    if (diagrams < standard.minimumDiagrams) score = Math.min(score, 74)
    if (tables < 10) score = Math.min(score, 69)
    if (tables < standard.minimumTables) score = Math.min(score, 79)
    if (countedSituations < 8) score = Math.min(score, 59)
    if (countedSituations < standard.minimumSituations) score = Math.min(score, 74)
    if (standard.requiresMicrocycles && microcycles < (standard.minimumMicrocycles ?? 0)) {
      score = Math.min(score, 82)
    }
    if (standard.requiresEvaluation && !hasPlayerEvaluation) score = Math.min(score, 82)
    if (standard.requiresPlanning && !hasPlanning) score = Math.min(score, 78)
  }

  if (standard.key === 'coachGuide') {
    if (diagrams < 2) score = Math.min(score, 74)
    if (!hasPlanning) score = Math.min(score, 82)
    if (!hasProgression) score = Math.min(score, 82)
    if (!hasSession) score = Math.min(score, 84)
    if (!hasPlayerEvaluation) score = Math.min(score, 84)
  }

  if (tables < familyRules.minimumTables) {
    score = Math.min(score, family === 'pedagogical-ribbon' ? 74 : 79)
  }
  if (countedSituations < familyRules.minimumSituations) {
    score = Math.min(score, familyRules.minimumSituations >= 6 ? 74 : 82)
  }
  if (diagrams < familyRules.minimumDiagrams) {
    score = Math.min(score, familyRules.minimumDiagrams >= 6 ? 74 : 82)
  }
  if (family === 'technical-book' && countedSituations > diagrams) score = Math.min(score, 74)
  if (family === 'coach-guide' && (!hasRoleCoach || !hasParentsCommunication || !hasSession)) {
    score = Math.min(score, 82)
  }
  if (family === 'training-plan' && !hasInstitutionalIndicators) score = Math.min(score, 78)
  if (family === 'practice-session' && (!hasChronologicalFlow || diagrams === 0)) {
    score = Math.min(score, 76)
  }
  if (family === 'theme-sheet' && (!hasDefinition || countedSituations === 0)) {
    score = Math.min(score, 78)
  }

  if (untypedBlocks > 0) {
    score = Math.max(0, score - Math.min(12, untypedBlocks * 2))
  }
  if (rawDiagramFieldLeaks > 0) {
    score = Math.max(0, score - Math.min(12, rawDiagramFieldLeaks * 2))
  }
  if (rawPipeLinesOutsideTypedTables > 0) {
    score = Math.max(0, score - Math.min(10, rawPipeLinesOutsideTypedTables))
  }
  if (inlineBlocks > 0) {
    score = Math.max(0, score - Math.min(10, inlineBlocks * 3))
  }
  if (extractionArtifacts > 0) {
    score = Math.max(0, score - Math.min(12, extractionArtifacts * 2))
  }
  if (incompleteDiagrams > 0) {
    score = Math.max(0, score - Math.min(12, incompleteDiagrams * 3))
  }
  if (tooMuchTextWithoutBlocks) {
    score = Math.max(0, score - 8)
  }
  if (contentTooShort) score = Math.min(score, 72)

  const contentScore = score
  const structureScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        ((richBlocks / Math.max(1, expectedRichBlocks)) * 55 +
          (parsedRenderableBlocks / Math.max(1, expectedRichBlocks)) * 45)
      )
    ) - Math.min(20, untypedBlocks * 4 + inlineBlocks * 4)
  )
  const renderScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (parsedRenderableBlocks > 0 ? 35 : 0) +
          (parsedTables > 0 ? 20 : tables > 0 ? 10 : 0) +
          (diagrams > 0 ? 20 : 0) +
          (countedSituations > 0 ? 20 : 0) +
          (rawDiagramFieldLeaks === 0 && rawPipeLinesOutsideTypedTables === 0 ? 5 : 0)
      )
    ) - Math.min(25, rawDiagramFieldLeaks * 2 + rawPipeLinesOutsideTypedTables)
  )
  const exportScore = Math.max(
    0,
    Math.min(
      100,
      Math.round((renderScore * 0.7 + structureScore * 0.3) - Math.min(15, unclosedTypedBlocks * 5))
    )
  )
  const globalScore = Math.round(
    contentScore * 0.45 + structureScore * 0.2 + renderScore * 0.2 + exportScore * 0.15
  )
  score = globalScore

  const status: DocumentQualityStatus =
    score >= 90
      ? 'Référence club'
      : score >= 75
        ? 'Très bon niveau'
        : score >= 60
          ? 'Solide mais incomplet'
          : score >= 40
            ? 'Base structurée mais insuffisante'
            : 'Très incomplet'

  const verdict =
    score >= 90
      ? `Document conforme au ${standard.label}. Il peut servir de référence BCVB après relecture finale.`
      : score >= 75
        ? `Document de bon niveau, mais certains écarts restent à corriger avant d’en faire une référence BCVB complète.`
        : score >= 60
          ? `Document solide mais incomplet au regard du ${standard.label}. Les volumes ou outils attendus restent partiellement insuffisants.`
          : score >= 40
            ? `Le document est bien structuré par endroits, mais il reste insuffisant pour publication comme référentiel club : compléter les tableaux, situations, schémas et annexes attendus.`
            : `Document très incomplet au regard du ${standard.label}. Reprendre la génération ou demander un enrichissement substantiel avant publication.`

  const blockingIssues = checks
    .filter((check) => check.status === 'fail')
    .map((check) => `${check.label}: ${check.detail}`)

  const improvementActions: DocumentQualityReport['improvementActions'] = []
  if (rawPipeLinesOutsideTypedTables > 0 || unrenderedTables > 0) {
    improvementActions.push({
      label: 'Convertir les tableaux bruts',
      priority: 'critical',
      expectedGain: 6,
      actionType: 'convert_tables',
    })
  }
  if (countedSituations < standard.minimumSituations) {
    improvementActions.push({
      label: 'Ajouter des situations pédagogiques',
      priority: 'critical',
      expectedGain: 10,
      actionType: 'add_situations',
    })
  }
  if (diagrams < standard.minimumDiagrams || situationsWithoutNearbyDiagram > 0) {
    improvementActions.push({
      label: 'Ajouter les diagrammes terrain manquants',
      priority: 'critical',
      expectedGain: 8,
      actionType: 'add_diagrams',
    })
  }
  if (!hasPlanning || !planningRichDetected) {
    improvementActions.push({
      label: 'Renforcer la planification',
      priority: 'high',
      expectedGain: 7,
      actionType: 'strengthen_planning',
    })
  }
  if (standard.requiresEvaluation && !hasPlayerEvaluation) {
    improvementActions.push({
      label: 'Ajouter les grilles d’évaluation',
      priority: 'high',
      expectedGain: 5,
      actionType: 'add_evaluation',
    })
  }
  if (richBlocks < expectedRichBlocks || untypedBlocks > 0 || rawDiagramFieldLeaks > 0) {
    improvementActions.push({
      label: 'Normaliser les blocs BCVB',
      priority: 'critical',
      expectedGain: 8,
      actionType: 'normalize_blocks',
    })
  }
  if (score < 90) {
    improvementActions.push({
      label: 'Réécrire les sections faibles',
      priority: score < 80 ? 'critical' : 'medium',
      expectedGain: score < 80 ? 12 : 5,
      actionType: 'rewrite_sections',
    })
  }

  const estimatedPotentialScore = Math.min(
    100,
    score + improvementActions.reduce((total, action) => total + action.expectedGain, 0)
  )
  const editorialStatus: DocumentQualityReport['editorialStatus'] =
    score < 40
      ? 'non_exploitable'
      : score < 60
        ? 'base_faible'
        : score < 80
          ? 'bon_brouillon'
          : score < 90
            ? 'presque_publiable'
            : 'publiable'

  return {
    standard,
    status,
    score,
    scoreTarget,
    editorialStatus,
    blockingIssues,
    improvementActions,
    estimatedPotentialScore,
    counts: {
      tables,
      situations: countedSituations,
      diagrams,
      richBlocks,
      expectedRichBlocks,
      parsedBlocks: parsedRenderableBlocks,
      tableBlocksDetected,
      markdownTablesParsed: parsedTables,
      tablesRendered: parsedTables,
      tablesNotRendered: unrenderedTables,
      situationsDetected: countedSituations,
      situationsWithDiagram: Math.min(countedSituations, diagramsValid),
      diagramsValid,
      diagramsInferred,
      rawTechnicalFieldsVisible: rawDiagramFieldLeaks,
      inlineBlocksDetected: inlineBlocks,
      genericBlocksDetected: untypedBlocks,
    },
    scores: {
      contentScore,
      structureScore,
      renderScore,
      exportScore,
      globalScore,
    },
    checks,
    verdict,
  }
}
