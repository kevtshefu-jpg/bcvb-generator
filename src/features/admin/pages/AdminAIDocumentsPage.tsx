import { useEffect, useMemo, useState } from 'react'
import { fetchLibraryDocuments, type LibraryDocumentRow } from '../../library/services/libraryService'
import { saveManualGeneratedDocument } from '../../../services/manualGeneratedDocuments'
import { analyzeDocumentQuality, type DocumentQualityReport } from '../../../utils/documentQuality'
import { DOCTRINE_PROFILES, type DoctrineId } from '../../document-intelligence'
import {
  getDocumentStandard,
  type DocumentFamilyId,
} from '../../documents/standards/documentFamilyStandards'
import { normalizeBCVBRichMarkdown } from '../../documents/utils/normalizeBCVBRichMarkdown'
import { normalizeRawMarkdownTables } from '../../documents/utils/normalizeRawMarkdownTables'
import { normalizeBcvbBlocks } from '../../documents/utils/normalizeBcvbBlocks'
import { ProductionStepper } from '../../ai-document/components/ProductionStepper'
import {
  DocumentFramingPanel,
  type DocumentProductionSettings,
} from '../../ai-document/components/DocumentFramingPanel'
import {
  DocumentSourcePanel,
  type DocumentSourcePayload,
} from '../../ai-document/components/DocumentSourcePanel'
import { EditorialStandardCard } from '../../ai-document/components/EditorialStandardCard'
import {
  EditorialPlanPanel,
  type EditorialPlan,
} from '../../ai-document/components/EditorialPlanPanel'
import { ProductionPanel } from '../../ai-document/components/ProductionPanel'
import { QualityActionPanel } from '../../ai-document/components/QualityActionPanel'
import { DocumentPreviewExportPanel } from '../../ai-document/components/DocumentPreviewExportPanel'
import { QualityBoostPanel } from '../../ai-document/components/QualityBoostPanel'
import {
  buildQualityBoostPrompt,
  type QualityIssue,
} from '../../ai-document/quality/buildQualityBoostPrompt'
import {
  buildEditorialElevationPrompt,
  type ImprovementMode,
} from '../../ai-document/editorial/elevateDocumentQuality'
import { selectImprovementMode } from '../../ai-document/editorial/selectImprovementMode'
import { getQualityTarget } from '../../ai-document/editorial/documentQualityTargets'
import { buildStrongQualityLiftPrompt } from '../../editorial-intelligence/qualityLiftEngine'
import { analyzeDocumentIntent } from '../../editorial-intelligence/documentIntentEngine'
import { buildEditorialPlan as buildIntelligentEditorialPlan } from '../../editorial-intelligence/editorialPlanBuilder'
import { useEditorialAutosave } from '../../../hooks/useEditorialAutosave'
import { useScrollRestoration } from '../../../hooks/useScrollRestoration'
import {
  hasEditorialDraft,
  loadEditorialDraft,
  type EditorialDraftState,
  type EditorialProvider,
  type EditorialStudioStep,
} from '../../../utils/editorialDraftStorage'
import { PRESENTATION_LABELS, PRESENTATION_MODE } from '../../../config/presentationMode'
import {
  buildQualityReport,
  getEditorialStandard as getPublicationStandard,
  getNextTargetScore,
} from '../../../lib/editorialQualityEngine'
import {
  buildPublicationUpgradePrompt,
  type PublicationUpgradeMode,
} from '../../../lib/publicationPromptBuilder'
import {
  buildEditorialScoreReport,
  type EditorialScoreReport,
} from '../../../lib/editorialScoreEngine'
import {
  buildWorldClassPrompt,
  buildWorldClassPromptSet,
  type WorldClassLevel,
  type WorldClassProvider,
} from '../../../lib/worldClassPromptBuilder'
import { buildFusionWorldClassPrompt } from '../../../lib/fusionWorldClassPrompt'
import {
  addMissingCoachChecklist,
  addMissingConclusion,
  addMissingEvaluationGrid,
  convertRawTablesToBcvbTables,
  normalizeBcvbRichMarkdown,
} from '../../../lib/editorialAutoFixActions'

const STEPS = ['Cadrage', 'Sources', 'Plan éditorial', 'Production', 'Contrôle & export']
const STEP_IDS: EditorialStudioStep[] = ['cadre', 'sources', 'plan', 'production', 'quality']
const upgradeModes: Array<{
  id: PublicationUpgradeMode
  label: string
  description: string
}> = [
  {
    id: 'light',
    label: 'Correction légère',
    description: 'Corrige syntaxe, blocs et petites erreurs.',
  },
  {
    id: 'strong',
    label: 'Élévation éditoriale',
    description: 'Renforce structure, contenu, tableaux et situations.',
  },
  {
    id: 'rebuild',
    label: 'Reconstruction publication club',
    description: 'Reconstruit le document pour atteindre directement le standard éditeur.',
  },
]
const worldClassLevels: Array<{ id: WorldClassLevel; label: string; target: number }> = [
  { id: 'publication_club', label: 'Publication club', target: 95 },
  { id: 'reference_bcvb', label: 'Référence BCVB', target: 97 },
  { id: 'edition_mondiale', label: 'Édition mondiale', target: 100 },
]

const DEFAULT_SETTINGS: DocumentProductionSettings = {
  family: 'coach-guide',
  productionLevel: 'Référence club',
  category: 'U7',
  audience: 'Coachs',
  season: 'Générique / intemporel',
  targetTitle: 'Guide complet du coach U7 BCVB',
  selectedReferentials: ['bcvb', 'ffbb', 'canada', 'usa'] as DoctrineId[],
}

const DEFAULT_SOURCE: DocumentSourcePayload = {
  mode: 'text',
  text: '',
  status: 'idle',
}

const FAMILY_OPTIONS: Array<{ value: DocumentFamilyId; label: string }> = [
  { value: 'technical-book', label: 'Cahier technique' },
  { value: 'coach-guide', label: 'Guide du coach' },
  { value: 'training-plan', label: 'Plan de formation' },
  { value: 'pedagogical-ribbon', label: 'Ruban pédagogique' },
  { value: 'practice-session', label: 'Séance d’entraînement' },
  { value: 'theme-sheet', label: 'Fiche à thème' },
]

const REFERENTIAL_OPTIONS = Object.values(DOCTRINE_PROFILES).map((profile) => ({
  value: profile.id,
  label: profile.label,
  description: profile.description,
}))

function extractTitle(content: string, fallback: string) {
  const heroTitle = /:::bcvb-hero[\s\S]*?^title\s*:\s*(.+)$/im.exec(content)?.[1]
  const markdownTitle = /^#\s+(.+)$/m.exec(content)?.[1]
  return (heroTitle || markdownTitle || fallback).trim()
}

function normalizeStudioContent(content: string) {
  const withTables = normalizeRawMarkdownTables(content)
  const withBlocks = normalizeBcvbBlocks(withTables)
  return normalizeBCVBRichMarkdown(withBlocks.content).content
}

function draftSourceModeToStudio(mode: EditorialDraftState['sourceMode']): DocumentSourcePayload['mode'] {
  if (mode === 'paste') return 'text'
  if (mode === 'upload') return 'attachment'
  return mode
}

function studioSourceModeToDraft(mode: DocumentSourcePayload['mode']): EditorialDraftState['sourceMode'] {
  if (mode === 'text') return 'paste'
  if (mode === 'attachment') return 'upload'
  return mode
}

function stepToIndex(step?: EditorialStudioStep | null) {
  const index = STEP_IDS.indexOf(step || 'cadre')
  return index >= 0 ? index : 0
}

function mapFamilyToQualityEngine(family?: string): string {
  if (family === 'technical-book') return 'cahier_technique'
  if (family === 'coach-guide') return 'guide_coach'
  if (family === 'training-plan') return 'plan_formation'
  if (family === 'pedagogical-ribbon') return 'ruban_pedagogique'
  if (family === 'practice-session') return 'seance'
  if (family === 'theme-sheet') return 'fiche_theme'
  return family || 'guide_coach'
}

function resolvePromptProvider(provider?: EditorialProvider): 'chatgpt' | 'claude' {
  return provider === 'claude' ? 'claude' : 'chatgpt'
}

function extractDetectedSections(content: string, report: DocumentQualityReport | null) {
  const markdownSections = Array.from(content.matchAll(/^#{1,3}\s+(.+)$/gm)).map((match) => match[1].trim())
  const blockTitles = Array.from(content.matchAll(/^title\s*:\s*(.+)$/gim)).map((match) => match[1].trim())
  const passedChecks = report?.checks
    .filter((check) => check.status === 'pass')
    .map((check) => check.label) ?? []

  return Array.from(new Set([...markdownSections, ...blockTitles, ...passedChecks])).filter(Boolean)
}

function computeCurrentStep({
  settings,
  source,
  plan,
  planValidated,
  responseContent,
  qualityReport,
}: {
  settings: DocumentProductionSettings
  source: DocumentSourcePayload
  plan: EditorialPlan | null
  planValidated: boolean
  responseContent: string
  qualityReport: DocumentQualityReport | null
}) {
  if (!settings.family || !settings.targetTitle.trim()) return 0
  if (!source.text.trim()) return 1
  if (!plan || !planValidated) return 2
  if (!responseContent.trim()) return 3
  if (!qualityReport) return 4
  return 4
}

function buildQualityIssues(
  report: DocumentQualityReport | null,
  standard: ReturnType<typeof getDocumentStandard> | null
): QualityIssue[] {
  if (!report || !standard) return []

  const issues: QualityIssue[] = []

  if (report.counts.situations < standard.minSituations) {
    issues.push({
      key: 'situations_missing',
      label: 'Situations pédagogiques insuffisantes',
      severity: 'critical',
      current: report.counts.situations,
      expected: standard.minSituations,
      message: `${report.counts.situations} situation(s) détectée(s), objectif ${standard.minSituations}.`,
    })
  }

  if (report.counts.diagrams < standard.minDiagrams) {
    issues.push({
      key: 'diagrams_missing',
      label: 'Schémas terrain insuffisants',
      severity: 'critical',
      current: report.counts.diagrams,
      expected: standard.minDiagrams,
      message: `${report.counts.diagrams} schéma(s) détecté(s), objectif ${standard.minDiagrams}.`,
    })
  }

  if (report.counts.tables < standard.minTables) {
    issues.push({
      key: 'raw_tables',
      label: 'Tableaux à renforcer ou convertir',
      severity: 'warning',
      current: report.counts.tables,
      expected: standard.minTables,
      message: `${report.counts.tables} tableau(x) détecté(s), objectif ${standard.minTables}. Convertir et enrichir les tableaux utiles.`,
    })
  }

  if (report.counts.tablesNotRendered > 0 || report.counts.rawTechnicalFieldsVisible > 0 || report.counts.genericBlocksDetected > 0) {
    issues.push({
      key: 'raw_blocks',
      label: 'Syntaxe technique visible',
      severity: 'critical',
      message: 'Des tableaux, champs techniques ou blocs génériques risquent de rester visibles.',
    })
  }

  const planningWeak = report.checks.some(
    (check) =>
      /planification|progression|seance type|cycle/i.test(check.label) &&
      check.status !== 'pass'
  )
  if (planningWeak) {
    issues.push({
      key: 'planning_weak',
      label: 'Planification trop faible',
      severity: 'warning',
      message: 'Planification, progression, cycle ou séance type doivent être renforcés.',
    })
  }

  const evaluationMissing = report.checks.some(
    (check) => /evaluation|évaluation|grille/i.test(check.label) && check.status !== 'pass'
  )
  if (evaluationMissing) {
    issues.push({
      key: 'evaluation_missing',
      label: 'Évaluation à compléter',
      severity: 'warning',
      message: 'Ajouter une grille d’évaluation joueur et une auto-évaluation coach.',
    })
  }

  const bridgeMissing = report.checks.some(
    (check) => /passerelle|categorie suivante|catégorie suivante/i.test(check.label) && check.status !== 'pass'
  )
  if (bridgeMissing) {
    issues.push({
      key: 'next_category_missing',
      label: 'Passerelle catégorie suivante absente',
      severity: 'warning',
      message: 'Ajouter une passerelle claire vers la catégorie suivante.',
    })
  }

  if (report.score < 92) {
    issues.push({
      key: 'editorial_style_weak',
      label: 'Style éditorial à élever',
      severity: report.score < 85 ? 'critical' : 'minor',
      current: report.score,
      expected: 92,
      message: 'Améliorer titres, transitions, encarts, synthèses et densité éditoriale.',
    })
  }

  return issues
}

export default function AdminAIDocumentsPage() {
  const hadDraftAtBoot = useMemo(() => hasEditorialDraft(), [])
  const savedDraft = useMemo(() => loadEditorialDraft(), [])
  const {
    draft,
    updateDraft,
    forceSave,
    resetDraft,
  } = useEditorialAutosave({
    activeStep: savedDraft?.activeStep ?? 'cadre',
    documentFamily: savedDraft?.documentFamily ?? DEFAULT_SETTINGS.family,
    productionLevel: savedDraft?.productionLevel ?? DEFAULT_SETTINGS.productionLevel,
    category: savedDraft?.category ?? DEFAULT_SETTINGS.category,
    audience: savedDraft?.audience ?? DEFAULT_SETTINGS.audience,
    season: savedDraft?.season ?? DEFAULT_SETTINGS.season,
    targetTitle: savedDraft?.targetTitle ?? DEFAULT_SETTINGS.targetTitle,
    selectedReferentials: savedDraft?.selectedReferentials ?? DEFAULT_SETTINGS.selectedReferentials,
    sourceMode: savedDraft?.sourceMode ?? 'paste',
    sourceText: savedDraft?.sourceText ?? '',
    masterPrompt: savedDraft?.masterPrompt ?? '',
    provider: savedDraft?.provider ?? 'chatgpt',
    generatedAnswer: savedDraft?.generatedAnswer ?? '',
    normalizedMarkdown: savedDraft?.normalizedMarkdown ?? '',
    qualityScore: savedDraft?.qualityScore ?? null,
    qualityReport: savedDraft?.qualityReport ?? null,
  })
  useScrollRestoration('editorial-studio')

  const [documents, setDocuments] = useState<LibraryDocumentRow[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [activeStep, setActiveStepState] = useState<EditorialStudioStep>(
    savedDraft?.activeStep ?? 'cadre'
  )
  const [settings, setSettings] = useState<DocumentProductionSettings>({
    ...DEFAULT_SETTINGS,
    family: (savedDraft?.documentFamily as DocumentProductionSettings['family']) || DEFAULT_SETTINGS.family,
    productionLevel: savedDraft?.productionLevel || DEFAULT_SETTINGS.productionLevel,
    category: savedDraft?.category || DEFAULT_SETTINGS.category,
    audience: savedDraft?.audience || DEFAULT_SETTINGS.audience,
    season: savedDraft?.season || DEFAULT_SETTINGS.season,
    targetTitle: savedDraft?.targetTitle || DEFAULT_SETTINGS.targetTitle,
    selectedReferentials: (savedDraft?.selectedReferentials as DoctrineId[] | undefined) || DEFAULT_SETTINGS.selectedReferentials,
  })
  const [source, setSource] = useState<DocumentSourcePayload>({
    ...DEFAULT_SOURCE,
    mode: savedDraft?.sourceMode ? draftSourceModeToStudio(savedDraft.sourceMode) : DEFAULT_SOURCE.mode,
    text: savedDraft?.sourceText || savedDraft?.extractedText || '',
    fileName: savedDraft?.uploadedFileName,
    fileType: savedDraft?.uploadedFileType,
    status: savedDraft?.sourceText || savedDraft?.extractedText ? 'extracted' : 'idle',
  })
  const [editorialPlan, setEditorialPlan] = useState<EditorialPlan | null>(
    savedDraft?.editorialPlan ?? null
  )
  const [planValidated, setPlanValidated] = useState(Boolean(savedDraft?.editorialPlan))
  const [prompt, setPrompt] = useState(savedDraft?.masterPrompt ?? '')
  const [responseContent, setResponseContent] = useState(
    savedDraft?.normalizedMarkdown || savedDraft?.generatedAnswer || ''
  )
  const [qualityReport, setQualityReport] = useState<DocumentQualityReport | null>(
    savedDraft?.qualityReport ?? null
  )
  const [qualityBoostPrompt, setQualityBoostPrompt] = useState(savedDraft?.masterPrompt ?? '')
  const [selectedImprovementMode, setSelectedImprovementMode] =
    useState<ImprovementMode>('editorial_elevation')
  const [upgradeMode, setUpgradeMode] = useState<PublicationUpgradeMode>('rebuild')
  const [worldClassLevel, setWorldClassLevel] = useState<WorldClassLevel>('reference_bcvb')
  const [worldClassProvider, setWorldClassProvider] = useState<WorldClassProvider>('chatgpt')
  const [worldClassReport, setWorldClassReport] = useState<EditorialScoreReport | null>(null)
  const [worldChatGptResponse, setWorldChatGptResponse] = useState('')
  const [worldClaudeResponse, setWorldClaudeResponse] = useState('')
  const [worldFusionPrompt, setWorldFusionPrompt] = useState('')
  const [lastElevationGain, setLastElevationGain] = useState<{
    previousScore: number
    newScore: number
    addedBlocks: number
    convertedTables: number
    addedSituations: number
    addedDiagrams: number
    reinforcedSections: number
  } | null>(null)

  const standard = useMemo(
    () => (settings.family ? getDocumentStandard(settings.family) : null),
    [settings.family]
  )
  const computedStep = computeCurrentStep({
    settings,
    source,
    plan: editorialPlan,
    planValidated,
    responseContent,
    qualityReport,
  })
  const currentStep = hadDraftAtBoot || draft ? stepToIndex(activeStep) : computedStep
  const qualityIssues = useMemo(
    () => buildQualityIssues(qualityReport, standard),
    [qualityReport, standard]
  )
  const publicationTargetScore = useMemo(() => {
    const familyKey = mapFamilyToQualityEngine(settings.family || standard?.id)
    const familyTarget = getPublicationStandard(familyKey).minScore
    const qualityScore = qualityReport?.score ?? 0

    return getNextTargetScore(qualityScore, familyTarget)
  }, [qualityReport?.score, settings.family, standard?.id])

  function setActiveStep(step: EditorialStudioStep) {
    setActiveStepState(step)
    updateDraft({ activeStep: step })
  }

  function resetStudioDraft() {
    resetDraft()
    setActiveStepState('cadre')
    setSettings(DEFAULT_SETTINGS)
    setSource(DEFAULT_SOURCE)
    setEditorialPlan(null)
    setPlanValidated(false)
    setPrompt('')
    setResponseContent('')
    setQualityReport(null)
    setQualityBoostPrompt('')
    setUpgradeMode('rebuild')
    setWorldClassLevel('reference_bcvb')
    setWorldClassProvider('chatgpt')
    setWorldClassReport(null)
    setWorldChatGptResponse('')
    setWorldClaudeResponse('')
    setWorldFusionPrompt('')
    setLastElevationGain(null)
    setMessage('Nouveau document prêt.')
  }

  useEffect(() => {
    updateDraft({
      activeStep,
      targetTitle: settings.targetTitle,
      documentFamily: settings.family,
      productionLevel: settings.productionLevel,
      category: settings.category,
      audience: settings.audience,
      season: settings.season,
      selectedReferentials: settings.selectedReferentials,
      sourceMode: studioSourceModeToDraft(source.mode),
      sourceText: source.text,
      uploadedFileName: source.fileName,
      uploadedFileType: source.fileType,
      extractedText: source.mode === 'attachment' || source.mode === 'ocr' ? source.text : '',
      editorialPlan,
      masterPrompt: prompt,
      generatedAnswer: responseContent,
      normalizedMarkdown: responseContent,
      qualityScore: qualityReport?.score ?? null,
      qualityReport,
    })
  }, [
    activeStep,
    settings,
    source,
    editorialPlan,
    prompt,
    responseContent,
    qualityReport,
    updateDraft,
  ])

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!responseContent.trim() && !prompt.trim()) return

      forceSave()
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handler)

    return () => {
      window.removeEventListener('beforeunload', handler)
    }
  }, [forceSave, prompt, responseContent])

  async function loadData() {
    const docsData = await fetchLibraryDocuments()
    setDocuments(docsData)
  }

  useEffect(() => {
    loadData().catch((error) => {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Erreur lors du chargement du studio documentaire.'
      )
    })
  }, [])

  function runQualityCheck(content = responseContent) {
    const normalized = normalizeStudioContent(content)
    setResponseContent(normalized)
    const report = analyzeDocumentQuality({
      content: normalized,
      documentType: standard?.label,
      generationType: settings.family || undefined,
      title: settings.targetTitle,
      category: settings.category,
      subcategory: settings.productionLevel,
    })
    setQualityReport(report)
    setLastElevationGain((currentGain) =>
      currentGain
        ? {
            ...currentGain,
            newScore: report.score,
          }
        : currentGain
    )
    setMessage(`Contrôle qualité relancé : ${report.score}/100.`)
    setActiveStep('quality')
  }

  function applyStandardToPrompt() {
    if (!standard) return
    setPrompt((current) => {
      const standardText = [
        `STANDARD ÉDITORIAL ${standard.label.toUpperCase()}`,
        `Format : ${standard.format}`,
        `Mise en page : ${standard.layout}`,
        `Typographie : ${standard.typography}`,
        `Blocs obligatoires : ${standard.mandatoryBlocks.join(', ')}`,
        `Non négociables : ${standard.nonNegotiables.join(', ')}`,
        `Seuils : ${standard.minTables} tableaux, ${standard.minSituations} situations, ${standard.minDiagrams} schémas minimum.`,
      ].join('\n')

      return current.trim() ? `${current.trim()}\n\n${standardText}` : standardText
    })
    setMessage('Standard éditorial injecté dans le cadre de rédaction.')
    setActiveStep('production')
  }

  function autoFixFormat() {
    const normalized = normalizeStudioContent(responseContent)
    setResponseContent(normalized)
    runQualityCheck(normalized)
    setMessage('Format BCVB normalisé.')
    setActiveStep('quality')
  }

  function buildCorrectionPrompt(instruction: string) {
    const correctionPrompt = `
Tu dois corriger le document BCVB ci-dessous sans changer son intention.

Action demandée :
${instruction}

Contraintes :
- conserver les blocs valides ;
- utiliser uniquement des blocs typés :::bcvb-* ;
- ne jamais laisser de tableau brut hors bloc :::bcvb-table ;
- ne jamais laisser de champs players/arrows/zones hors bloc diagramme ;
- produire uniquement le document corrigé.

DOCUMENT À CORRIGER
---
${responseContent}
---
`.trim()

    setPrompt(correctionPrompt)
    setMessage('Cadre de correction généré.')
    setActiveStep('production')
  }

  function buildBoostPrompt(issues = qualityIssues) {
    if (!standard || !qualityReport) return ''

    const nextPrompt = buildQualityBoostPrompt({
      currentDocument: responseContent,
      family: standard.label,
      category: settings.category,
      audience: settings.audience,
      season: settings.season,
      targetTitle: settings.targetTitle,
      qualityScore: qualityReport.score,
      issues,
      editorialStandard: standard,
      sourceSummary: source.text ? `${source.text.length} caractères source, mode ${source.mode}` : undefined,
      selectedReferentials: settings.selectedReferentials,
    })

    setQualityBoostPrompt(nextPrompt)
    setPrompt(nextPrompt)
    setMessage('Cadre d’amélioration généré.')
    setActiveStep('production')
    return nextPrompt
  }

  function getQualityMetrics(report = qualityReport) {
    const failedChecks = report?.checks
      .filter((check) => check.status !== 'pass')
      .map((check) => check.label) ?? []

    return {
      tables: report?.counts.tables ?? 0,
      situations: report?.counts.situations ?? 0,
      diagrams: report?.counts.diagrams ?? 0,
      bcvbBlocks: report?.counts.richBlocks ?? 0,
      rawTables: (report?.counts.tablesNotRendered ?? 0) + (report?.counts.rawTechnicalFieldsVisible ?? 0),
      missingRequiredSections: failedChecks,
    }
  }

  function buildElevationPrompt(mode?: ImprovementMode) {
    if (!standard || !qualityReport) return ''
    const resolvedMode = mode ?? selectImprovementMode(qualityReport.score)
    const metrics = getQualityMetrics(qualityReport)
    const target = getQualityTarget(standard.label)
    const nextPrompt = buildEditorialElevationPrompt({
      document: responseContent,
      qualityScore: qualityReport.score,
      documentFamily: standard.label,
      category: settings.category,
      audience: settings.audience,
      season: settings.season,
      qualityIssues: qualityReport.checks
        .filter((check) => check.status !== 'pass')
        .map((check) => `${check.label}: ${check.detail}`),
      qualityMetrics: metrics,
      editorialStandard: [
        `Objectif publication : ${target.minScore}/100`,
        `Famille : ${standard.label}`,
        `Format : ${standard.format}`,
        `Mise en page : ${standard.layout}`,
        `Blocs obligatoires : ${standard.mandatoryBlocks.join(', ')}`,
        `Non négociables : ${standard.nonNegotiables.join(', ')}`,
      ].join('\n'),
      mode: resolvedMode,
    })

    setSelectedImprovementMode(resolvedMode)
    setQualityBoostPrompt(nextPrompt)
    setPrompt(nextPrompt)
    setMessage('Cadre de rehaussement publication BCVB généré.')
    setActiveStep('production')
    setLastElevationGain({
      previousScore: qualityReport.score,
      newScore: Math.min(target.minScore, Math.max(qualityReport.score + 8, qualityReport.score)),
      addedBlocks: Math.max(0, target.minBcvbBlocks - metrics.bcvbBlocks),
      convertedTables: metrics.rawTables,
      addedSituations: Math.max(0, target.minSituations - metrics.situations),
      addedDiagrams: Math.max(0, target.minDiagrams - metrics.diagrams),
      reinforcedSections: metrics.missingRequiredSections.length,
    })
    return nextPrompt
  }

  function buildStrongLiftPrompt() {
    if (!standard || !qualityReport) return ''
    const intent = analyzeDocumentIntent({
      title: settings.targetTitle,
      category: settings.category,
      audience: settings.audience,
      sourceText: source.text,
    })
    const plan = buildIntelligentEditorialPlan(intent)
    const provider = prompt.toLowerCase().includes('claude') ? 'claude' : 'chatgpt'
    const nextPrompt = buildStrongQualityLiftPrompt({
      currentDocument: responseContent,
      currentScore: qualityReport.score,
      targetScore: publicationTargetScore,
      family: intent.recommendedFamily,
      plan,
      qualityIssues: [
        ...qualityReport.blockingIssues,
        ...qualityReport.improvementActions.map((action) => `${action.label} (+${action.expectedGain})`),
      ],
      selectedProvider: provider,
    })

    setQualityBoostPrompt(nextPrompt)
    setPrompt(nextPrompt)
    setMessage('Cadre d’amélioration forte généré.')
    setActiveStep('production')
    return nextPrompt
  }

  function generateStrongUpgradePrompt() {
    const content = responseContent || source.text
    const currentReport = qualityReport ?? analyzeDocumentQuality({
      content,
      documentType: standard?.label,
      generationType: settings.family || undefined,
      title: settings.targetTitle,
      category: settings.category,
      subcategory: settings.productionLevel,
    })
    const qualityStats = currentReport.counts
    const familyKey = mapFamilyToQualityEngine(settings.family || standard?.id)
    const detectedSections = extractDetectedSections(content, currentReport)

    const report = buildQualityReport({
      familyKey,
      category: settings.category,
      score: currentReport.score,
      tables: qualityStats.tables,
      situations: qualityStats.situations,
      diagrams: qualityStats.diagrams,
      bcvbBlocks: qualityStats.richBlocks,
      rawTables: qualityStats.tablesNotRendered + qualityStats.rawTechnicalFieldsVisible,
      isolatedClosures: qualityStats.genericBlocksDetected,
      detectedSections,
    })

    const nextPrompt = buildPublicationUpgradePrompt({
      provider: resolvePromptProvider(draft?.provider),
      familyKey,
      category: settings.category,
      title: settings.targetTitle,
      currentDocument: content,
      sourceText: source.text,
      report,
      upgradeMode,
    })

    setQualityReport(currentReport)
    setQualityBoostPrompt(nextPrompt)
    setPrompt(nextPrompt)
    setMessage('Cadre de rehaussement fort généré.')
    setActiveStep('production')
    return nextPrompt
  }

  function getWorldClassTarget(level = worldClassLevel) {
    return worldClassLevels.find((item) => item.id === level)?.target ?? 97
  }

  function buildCurrentWorldClassReport(targetScore = getWorldClassTarget()) {
    const content = responseContent || source.text
    const report = buildEditorialScoreReport({
      document: content,
      familyKey: mapFamilyToQualityEngine(settings.family || standard?.id),
      category: settings.category,
      targetScore,
    })
    setWorldClassReport(report)
    return report
  }

  function generateWorldClassPrompt(level = worldClassLevel, provider = worldClassProvider) {
    const content = responseContent || source.text
    const targetScore = getWorldClassTarget(level)
    const report = buildCurrentWorldClassReport(targetScore)
    const familyKey = mapFamilyToQualityEngine(settings.family || standard?.id)

    if (provider === 'dual') {
      const promptSet = buildWorldClassPromptSet({
        level,
        familyKey,
        category: settings.category,
        title: settings.targetTitle,
        currentDocument: content,
        sourceText: source.text,
        scoreReport: report,
      })
      const combinedPrompt = [
        '# CADRE RÉDACTIONNEL — STRUCTURE ET CONFORMITÉ',
        promptSet.chatgptPrompt,
        '',
        '# CADRE APPROFONDI — PROFONDEUR ÉDITORIALE',
        promptSet.claudePrompt,
      ].join('\n\n')
      setPrompt(combinedPrompt)
      setQualityBoostPrompt(combinedPrompt)
      setMessage('Double cadre de production généré.')
      setActiveStep('production')
      return combinedPrompt
    }

    const nextPrompt = buildWorldClassPrompt({
      provider,
      level,
      familyKey,
      category: settings.category,
      title: settings.targetTitle,
      currentDocument: content,
      sourceText: source.text,
      scoreReport: report,
    })

    setPrompt(nextPrompt)
    setQualityBoostPrompt(nextPrompt)
    setMessage(`Cadre Reconstruction Éditeur Mondial ${targetScore}/100 généré.`)
    setActiveStep('production')
    return nextPrompt
  }

  function generateWorldClassFusionPrompt() {
    const targetScore = getWorldClassTarget(worldClassLevel)
    const report = worldClassReport ?? buildCurrentWorldClassReport(targetScore)
    const nextPrompt = buildFusionWorldClassPrompt({
      title: settings.targetTitle,
      familyKey: mapFamilyToQualityEngine(settings.family || standard?.id),
      category: settings.category,
      targetScore,
      chatgptResponse: worldChatGptResponse || responseContent,
      claudeResponse: worldClaudeResponse,
      report,
    })

    setWorldFusionPrompt(nextPrompt)
    setPrompt(nextPrompt)
    setQualityBoostPrompt(nextPrompt)
    setMessage('Cadre Fusionner et surclasser généré.')
    setActiveStep('production')
    return nextPrompt
  }

  function applyEditorialAutoFix(action: 'tables' | 'evaluation' | 'coachChecklist' | 'conclusion' | 'all') {
    let nextContent = responseContent || source.text
    const family = standard?.label || settings.family

    if (action === 'tables' || action === 'all') nextContent = convertRawTablesToBcvbTables(nextContent)
    if (action === 'evaluation' || action === 'all') nextContent = addMissingEvaluationGrid(nextContent, family, settings.category)
    if (action === 'coachChecklist' || action === 'all') nextContent = addMissingCoachChecklist(nextContent, family, settings.category)
    if (action === 'conclusion' || action === 'all') nextContent = addMissingConclusion(nextContent, family, settings.category)
    nextContent = normalizeBcvbRichMarkdown(nextContent)

    setResponseContent(nextContent)
    runQualityCheck(nextContent)
    setMessage('Action automatique appliquée et document normalisé.')
    setActiveStep('quality')
  }

  function buildTargetedBoost(issueKey: string) {
    const selectedIssues = qualityIssues.filter((issue) => issue.key === issueKey)
    buildBoostPrompt(selectedIssues.length > 0 ? selectedIssues : [
      {
        key: issueKey,
        label: 'Correction ciblée',
        severity: 'warning',
        message: 'Corriger ce point précis en respectant le standard BCVB.',
      },
    ])
  }

  async function copyBoostPrompt() {
    if (!qualityBoostPrompt.trim()) return
    await navigator.clipboard.writeText(qualityBoostPrompt)
    setMessage('Cadre d’amélioration copié.')
    setActiveStep('production')
  }

  async function saveDocument() {
    if (!standard) return
    const normalized = normalizeStudioContent(responseContent)
    const title = extractTitle(normalized, settings.targetTitle)

    await saveManualGeneratedDocument({
      title,
      content: normalized,
      description: `Document produit dans le studio éditorial BCVB (${settings.productionLevel}).`,
      documentType: standard.label,
      category: settings.category,
      subcategory: settings.family,
      audience: settings.audience,
      season: settings.season === 'Générique / intemporel' ? null : settings.season,
      tags: [
        'BCVB',
        'Studio éditorial',
        standard.label,
        settings.category,
        qualityReport && qualityReport.score >= 90 ? 'Référence club' : '',
      ].filter(Boolean) as string[],
      sourceDocumentId: null,
      generationType: 'ai_document_studio',
    })

    setMessage('Document enregistré dans la bibliothèque.')
    forceSave()
    await loadData()
  }

  return (
    <section className="ai-studio-page">
      <header className="ai-studio-hero bcvb-studio-hero">
        <p className="ai-studio-kicker">Administration BCVB</p>
        <h1>{PRESENTATION_LABELS.studioTitle}</h1>
        <p>{PRESENTATION_LABELS.studioSubtitle}</p>
        {PRESENTATION_MODE && (
          <p className="ai-studio-alert ai-studio-alert--warning">
            {PRESENTATION_LABELS.demoWarning}
          </p>
        )}
        <div className="bcvb-upgrade-mode">
          <p className="bcvb-eyebrow">Mode correcteur</p>
          <div className="provider-switch" aria-label="Mode de rehaussement documentaire">
            {upgradeModes.map((mode) => (
              <button
                type="button"
                key={mode.id}
                className={upgradeMode === mode.id ? 'active' : ''}
                onClick={() => setUpgradeMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="bcvb-upgrade-mode__description">
            {upgradeModes.find((mode) => mode.id === upgradeMode)?.description}
          </p>
        </div>
        <div className="bcvb-upgrade-mode">
          <p className="bcvb-eyebrow">Reconstruction Éditeur Mondial</p>
          <div className="provider-switch" aria-label="Niveau de sortie">
            {worldClassLevels.map((level) => (
              <button
                type="button"
                key={level.id}
                className={worldClassLevel === level.id ? 'active' : ''}
                onClick={() => setWorldClassLevel(level.id)}
              >
                {level.label} · {level.target}
              </button>
            ))}
          </div>
          <div className="provider-switch" aria-label="Mode de production premium">
            {(['chatgpt', 'claude', 'dual'] as WorldClassProvider[]).map((provider) => (
              <button
                type="button"
                key={provider}
                className={worldClassProvider === provider ? 'active' : ''}
                onClick={() => setWorldClassProvider(provider)}
              >
                {provider === 'dual' ? 'Double production' : provider === 'claude' ? 'Cadre approfondi' : 'Cadre rédactionnel'}
              </button>
            ))}
          </div>
          <p className="bcvb-upgrade-mode__description">
            Vise directement {getWorldClassTarget(worldClassLevel)}/100 avec reconstruction complète,
            quotas renforcés, tableaux propres, situations denses et schémas exploitables.
          </p>
        </div>
	        <div className="bcvb-provider-actions">
          <button
            type="button"
            className="bcvb-button-primary"
            onClick={() => setActiveStep('sources')}
          >
            Transformer un document en document BCVB
          </button>
	          <button
	            type="button"
	            className="bcvb-button-secondary"
	            onClick={() => setActiveStep('production')}
	          >
	            Continuer la production guidée
	          </button>
          <button
            type="button"
            className="bcvb-button-primary"
            onClick={generateStrongUpgradePrompt}
          >
	            {upgradeMode === 'rebuild'
                ? 'Reconstruction publication club'
                : 'Rehausser fortement le document'}
	          </button>
          <button
            type="button"
            className="bcvb-button-primary"
            onClick={() => generateWorldClassPrompt(worldClassLevel, worldClassProvider)}
          >
            Reconstruire vers 97–100
          </button>
          <button
            type="button"
            className="bcvb-button-secondary"
            onClick={() => generateWorldClassPrompt('edition_mondiale', worldClassProvider)}
          >
            Transformer en document 100
          </button>
	        </div>
	      </header>

      {errorMessage && <p className="ai-studio-alert ai-studio-alert--blocked">{errorMessage}</p>}
      {message && <p className="ai-studio-alert ai-studio-alert--warning">{message}</p>}

      {draft && (hadDraftAtBoot || prompt || responseContent || source.text || editorialPlan) && (
        <div className="bcvb-draft-banner">
          <div>
            <p className="bcvb-eyebrow">Travail en cours sauvegardé</p>
            <strong>{draft.targetTitle || settings.targetTitle || 'Document BCVB en cours'}</strong>
            <span>
              Dernière sauvegarde : {new Date(draft.updatedAt).toLocaleString('fr-FR')}
            </span>
          </div>

          <div className="bcvb-draft-banner__actions">
            <button
              type="button"
              className="bcvb-button-secondary"
              onClick={() => setActiveStep(draft.activeStep || 'production')}
            >
              Reprendre le travail en cours
            </button>

            <button
              type="button"
              className="bcvb-button-secondary"
              onClick={() => setActiveStep('production')}
            >
              Coller la proposition
            </button>

            <button
              type="button"
              className="bcvb-button-danger"
              onClick={resetStudioDraft}
            >
              Nouveau document
            </button>
          </div>
        </div>
      )}

      <ProductionStepper
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={(index) => setActiveStep(STEP_IDS[index] ?? 'cadre')}
      />

      <div className="ai-studio-layout">
        <main className="ai-studio-main">
          <DocumentFramingPanel
            settings={settings}
            onChange={(nextSettings) => {
              setSettings(nextSettings)
              setPlanValidated(false)
              setActiveStep('cadre')
            }}
            familyOptions={FAMILY_OPTIONS}
            referentialOptions={REFERENTIAL_OPTIONS}
          />

          <EditorialStandardCard
            standard={standard}
            onApply={applyStandardToPrompt}
            disabled={!standard}
          />

          <DocumentSourcePanel
            documents={documents}
            source={source}
            onSourceChange={(nextSource) => {
              setSource(nextSource)
              setActiveStep('sources')
            }}
          />

          <EditorialPlanPanel
            settings={settings}
            standard={standard}
            source={source}
            plan={editorialPlan}
            validated={planValidated}
            onPlanChange={(plan) => {
              setEditorialPlan(plan)
              setPlanValidated(false)
              setActiveStep('plan')
            }}
            onValidate={() => {
              setPlanValidated(Boolean(editorialPlan))
              setMessage('Plan éditorial validé.')
              setActiveStep('production')
            }}
          />

          <ProductionPanel
            settings={settings}
            standard={standard}
            source={source}
            plan={editorialPlan}
            planValidated={planValidated}
            prompt={prompt}
            responseContent={responseContent}
            initialProvider={draft?.provider}
            onPromptChange={(nextPrompt) => {
              setPrompt(nextPrompt)
              setActiveStep('production')
            }}
            onResponseChange={(nextContent) => {
              setResponseContent(nextContent)
              setActiveStep('production')
            }}
            onAnalyze={runQualityCheck}
            onPreview={() => setMessage('Aperçu mis à jour.')}
            onProviderChange={(provider: EditorialProvider) => updateDraft({ provider })}
          />

          <QualityActionPanel
            report={qualityReport}
            onAutoFixFormat={autoFixFormat}
            onBuildCorrectionPrompt={buildCorrectionPrompt}
            onImproveToEditorLevel={() => buildElevationPrompt()}
            onStrongImprove={buildStrongLiftPrompt}
            onTargetedBoost={buildTargetedBoost}
            onRerun={() => runQualityCheck(responseContent)}
          />

          <section className="ai-studio-card ai-world-class-card">
            <div className="ai-studio-card__header">
              <p className="ai-studio-kicker">Reconstruction Éditeur Mondial</p>
              <h2>Atteindre 95–100 sans micro-correction</h2>
              <p>
                Prépare un cadre beaucoup plus directif pour une production simple ou double
                à fusionner ensuite en version finale supérieure.
              </p>
            </div>

            <div className="ai-quality-counters">
              <span>Score actuel · {worldClassReport?.score ?? qualityReport?.score ?? '--'}/100</span>
              <span>Score cible · {getWorldClassTarget(worldClassLevel)}/100</span>
              <span>Blocages 95 · {worldClassReport?.blockersFor95.length ?? '--'}</span>
              <span>Blocages 100 · {worldClassReport?.blockersFor100.length ?? '--'}</span>
            </div>

            {worldClassReport && (
              <div className="ai-quality-grid">
                <div>
                  <h3>Blocages empêchant 95</h3>
                  {worldClassReport.blockersFor95.length ? (
                    <ul>
                      {worldClassReport.blockersFor95.slice(0, 8).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Aucun blocage majeur détecté.</p>
                  )}
                </div>
                <div>
                  <h3>Actions rapides</h3>
                  <div className="ai-studio-actions">
                    <button type="button" className="ai-studio-secondary" onClick={() => applyEditorialAutoFix('tables')}>
                      Convertir tableaux bruts
                    </button>
                    <button type="button" className="ai-studio-secondary" onClick={() => applyEditorialAutoFix('evaluation')}>
                      Ajouter grille joueur
                    </button>
                    <button type="button" className="ai-studio-secondary" onClick={() => applyEditorialAutoFix('coachChecklist')}>
                      Ajouter grille coach
                    </button>
                    <button type="button" className="ai-studio-secondary" onClick={() => applyEditorialAutoFix('conclusion')}>
                      Ajouter synthèse éditoriale
                    </button>
                    <button type="button" className="ai-studio-secondary" onClick={() => applyEditorialAutoFix('all')}>
                      Normaliser tout
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="ai-studio-actions">
              <button type="button" className="ai-studio-primary" onClick={() => generateWorldClassPrompt('publication_club', worldClassProvider)}>
                Reconstruire en mode 95
              </button>
              <button type="button" className="ai-studio-primary" onClick={() => generateWorldClassPrompt('reference_bcvb', worldClassProvider)}>
                Reconstruire en mode 97
              </button>
              <button type="button" className="ai-studio-primary" onClick={() => generateWorldClassPrompt('edition_mondiale', worldClassProvider)}>
                Reconstruire en mode 100
              </button>
              <button type="button" className="ai-studio-secondary" onClick={() => buildCurrentWorldClassReport()}>
                Relancer scoring mondial
              </button>
            </div>

            <div className="ai-world-fusion-grid">
              <label className="ai-studio-full-field">
                <span>Proposition 1</span>
                <textarea
                  value={worldChatGptResponse}
                  onChange={(event) => setWorldChatGptResponse(event.target.value)}
                  placeholder="Colle ici la première version."
                />
              </label>
              <label className="ai-studio-full-field">
                <span>Proposition 2</span>
                <textarea
                  value={worldClaudeResponse}
                  onChange={(event) => setWorldClaudeResponse(event.target.value)}
                  placeholder="Colle ici la deuxième version."
                />
              </label>
            </div>

            <div className="ai-studio-actions">
              <button type="button" className="ai-studio-primary" onClick={generateWorldClassFusionPrompt}>
                Fusionner et surclasser
              </button>
            </div>

            <label className="ai-studio-full-field">
              <span>Cadre de fusion mondiale</span>
              <textarea
                value={worldFusionPrompt}
                onChange={(event) => setWorldFusionPrompt(event.target.value)}
                placeholder="Le cadre Fusionner et surclasser apparaîtra ici."
              />
            </label>
          </section>

          <QualityBoostPanel
            score={qualityReport?.score ?? null}
            scoreTarget={publicationTargetScore}
            issues={qualityIssues}
            prompt={qualityBoostPrompt}
            selectedMode={selectedImprovementMode}
            lastGain={lastElevationGain}
            onGenerate={() => buildElevationPrompt()}
            onGenerateMode={(mode) => buildElevationPrompt(mode)}
            onCopy={copyBoostPrompt}
            onPromptChange={(nextPrompt) => {
              setQualityBoostPrompt(nextPrompt)
              setPrompt(nextPrompt)
              setActiveStep('production')
            }}
          />

          <DocumentPreviewExportPanel
            content={responseContent}
            settings={settings}
            standard={standard}
            report={qualityReport}
            onSave={saveDocument}
          />
        </main>

        <aside className="ai-studio-sidebar">
          <span><strong>Document ciblé</strong>{settings.targetTitle || 'Non défini'}</span>
          <span><strong>Famille</strong>{standard?.label || 'Non définie'}</span>
          <span><strong>Niveau de publication</strong>{qualityReport ? `${qualityReport.score}/100` : 'Non contrôlé'}</span>
          <span><strong>Objectif</strong>{publicationTargetScore}/100</span>
          <span><strong>Écarts critiques</strong>{qualityIssues.filter((issue) => issue.severity === 'critical').length}</span>
          <span><strong>Action recommandée</strong>{qualityReport && qualityReport.score < 92 ? 'Améliorer jusqu’au niveau éditeur' : 'Relire puis publier'}</span>
          <span><strong>Source</strong>{source.status} · {source.text.length} caractères</span>
          <span><strong>Plan</strong>{planValidated ? 'Validé' : editorialPlan ? 'À valider' : 'Non construit'}</span>
          <span><strong>Production</strong>{responseContent.trim() ? 'Réponse collée' : 'En attente'}</span>
          <span><strong>Export</strong>{qualityReport && qualityReport.score >= 85 ? 'Publication possible' : 'À corriger'}</span>
        </aside>
      </div>
    </section>
  )
}
