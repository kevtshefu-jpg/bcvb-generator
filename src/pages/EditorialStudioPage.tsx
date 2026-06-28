import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type {
  CorrectionAction,
  CorrectionPlan,
  DocumentFamily,
  MassiveCorrectionResult,
  PublicationStatus,
} from '../features/document-quality/types/quality.types'
import { buildPublicationChecklist, buildQualityDecisionItems } from '../features/document-quality/services/qualityDecisionView'
import { statusLabel } from '../features/document-quality/services/qualityRules'
import { applyMassiveCorrection } from '../features/document-quality/services/massiveCorrectionAdapter'
import { createCorrectionPlan } from '../features/document-quality/services/massiveCorrectionPlanner'
import { scoreDocument } from '../features/document-quality/services/qualityScorer'
import { DocumentNextStepCard } from '../features/documents/workflow/DocumentNextStepCard'
import { DocumentWorkflowAssistantCard } from '../features/documents/workflow/DocumentWorkflowAssistantCard'
import { DocumentWorkflowGuide } from '../features/documents/workflow/DocumentWorkflowGuide'
import { DocumentWorkflowStepper } from '../features/documents/workflow/DocumentWorkflowStepper'
import { EditorialStudioAssistancePanels } from '../features/editorial-studio/components/EditorialStudioAssistancePanels'
import { EditorialStudioCorrectionPanel } from '../features/editorial-studio/components/EditorialStudioCorrectionPanel'
import { EditorialStudioExportActions } from '../features/editorial-studio/components/EditorialStudioExportActions'
import { EditorialStudioForm } from '../features/editorial-studio/components/EditorialStudioForm'
import { EditorialStudioHero } from '../features/editorial-studio/components/EditorialStudioHero'
import { EditorialStudioModeSelector } from '../features/editorial-studio/components/EditorialStudioModeSelector'
import { EditorialStudioPreview } from '../features/editorial-studio/components/EditorialStudioPreview'
import { EditorialStudioPromptPanel } from '../features/editorial-studio/components/EditorialStudioPromptPanel'
import { EditorialStudioQualityPanel } from '../features/editorial-studio/components/EditorialStudioQualityPanel'
import { EditorialStudioWorkflow } from '../features/editorial-studio/components/EditorialStudioWorkflow'
import {
  getCurrentDocumentStep,
  getDocumentWorkflowSteps,
  getNextDocumentStep,
  type DocumentWorkflowMode,
  type DocumentWorkflowStep,
  type DocumentWorkflowStepKey,
} from '../features/documents/workflow/documentWorkflow'
import {
  EDITORIAL_AI_MODES,
  EDITORIAL_DOCUMENT_FAMILIES,
  EDITORIAL_STUDIO_STEPS,
} from '../config/editorialStudioModules.js'
import {
  buildChatGPTPrompt,
  buildClaudePrompt,
  buildFusionPrompt,
  buildMassiveCorrectionPrompt,
  buildPublicationReconstructionPrompt,
  defaultEditorialStudioState,
  loadEditorialStudioState,
  resetEditorialStudioState,
  saveEditorialStudioState,
  type EditorialStudioState,
} from '../utils/editorialStudioStorage.js'
import '../features/documents/workflow/document-workflow.css'
import '../features/editorial-studio/components/editorial-studio-components.css'
import './EditorialStudioPage.css'

function computeSteps(state: EditorialStudioState) {
  return {
    framing: state.targetDocument && state.family ? 'validé' : 'en cours',
    sources: state.sourceText ? 'validé' : 'en cours',
    plan: state.editorialPlan ? 'validé' : state.sourceText ? 'en cours' : 'non démarré',
    production: state.activePrompt ? 'validé' : state.editorialPlan ? 'en cours' : 'non démarré',
    quality: state.finalDocument ? (state.qualityScore >= 95 ? 'validé' : 'à corriger') : 'non démarré',
    export: state.finalDocument ? 'validé' : 'non démarré',
  }
}

function resolveQualityFamily(familyId: string): DocumentFamily {
  if (familyId === 'technical-book') return 'cahier_technique'
  if (familyId === 'coach-guide') return 'guide_coach'
  if (familyId === 'practice-session') return 'fiche_seance'
  if (familyId === 'theme-sheet') return 'situation_pedagogique'
  if (familyId === 'training-plan') return 'guide_coach'

  return 'unknown'
}

function getQualityStatusTone(status: PublicationStatus) {
  if (status === 'premium' || status === 'publiable') return 'ready'
  if (status === 'publiable_avec_reserves') return 'reserve'
  if (status === 'a_corriger') return 'warning'
  return 'blocked'
}

function buildPlanDraft(state: EditorialStudioState) {
  return [
    `# ${state.targetDocument}`,
    '',
    '1. Intention BCVB et public cible',
    '2. Principes techniques et pédagogiques',
    '3. Progression par étapes',
    '4. Situations pédagogiques autonomes',
    '5. Schémas terrain associés',
    '6. Planification et modalités d’évaluation',
    '7. Relation familles et communication',
    '8. Checklist publication club',
  ].join('\n')
}

function downloadText(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/markdown;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const WORKFLOW_STEP_TARGETS: Record<DocumentWorkflowStepKey, string> = {
  source: 'studio-source',
  classification: 'studio-classification',
  structure: 'studio-structure',
  production: 'studio-production',
  preview: 'studio-preview',
  quality: 'studio-assistance',
  correction: 'studio-assistance',
  validation: 'studio-preview',
  export: 'studio-export',
  archive: 'studio-assistance',
}

type CorrectionMode = 'micro' | 'strong' | 'rebuild'

type CorrectionReview = {
  mode: CorrectionMode
  before: string
  result: MassiveCorrectionResult
}

const correctionModeLabels: Record<CorrectionMode, string> = {
  micro: 'Micro-correction',
  strong: 'Amélioration forte',
  rebuild: 'Reconstruction publication club',
}

export default function EditorialStudioPage() {
  const [state, setState] = useState<EditorialStudioState>(() => loadEditorialStudioState() ?? defaultEditorialStudioState)
  const [workflowMode, setWorkflowMode] = useState<DocumentWorkflowMode>('creation')
  const [copied, setCopied] = useState('')
  const [message, setMessage] = useState('Studio prêt.')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(state.updatedAt)
  const [correctionTargetScore, setCorrectionTargetScore] = useState(95)
  const [correctionRunning, setCorrectionRunning] = useState<CorrectionMode | null>(null)
  const [correctionReview, setCorrectionReview] = useState<CorrectionReview | null>(null)
  const selectedFamily = EDITORIAL_DOCUMENT_FAMILIES.find((family) => family.id === state.family) ?? EDITORIAL_DOCUMENT_FAMILIES[1]
  const finalDocumentExists = Boolean(state.finalDocument.trim())

  const savedState = useMemo(() => ({ ...state, steps: computeSteps(state) }), [state])
  const documentWorkflowState = useMemo(() => ({
    hasSource: Boolean(state.sourceText.trim() || state.activePrompt.trim() || state.transformedFromTitle),
    hasClassification: Boolean(
      state.targetDocument.trim() &&
      state.family.trim() &&
      state.category.trim() &&
      state.audience.trim()
    ),
    hasStructure: Boolean(state.editorialPlan.trim()),
    hasContent: Boolean(state.finalDocument.trim() || state.analyzedResponse.trim()),
    hasPreview: finalDocumentExists,
    qualityScore: finalDocumentExists ? state.qualityScore : null,
    isValidated: finalDocumentExists && state.qualityScore >= 95,
    isExported: false,
  }), [
    finalDocumentExists,
    state.activePrompt,
    state.analyzedResponse,
    state.audience,
    state.category,
    state.editorialPlan,
    state.family,
    state.finalDocument,
    state.qualityScore,
    state.sourceText,
    state.targetDocument,
    state.transformedFromTitle,
  ])
  const workflowSteps = useMemo(
    () => getDocumentWorkflowSteps(workflowMode, documentWorkflowState),
    [documentWorkflowState, workflowMode]
  )
  const currentWorkflowStepKey = useMemo(
    () => getCurrentDocumentStep(documentWorkflowState, workflowMode),
    [documentWorkflowState, workflowMode]
  )
  const nextWorkflowStep = useMemo(() => getNextDocumentStep(workflowSteps), [workflowSteps])
  const qualityReport = useMemo(() => {
    const content = state.finalDocument || state.analyzedResponse || state.sourceText

    return scoreDocument({
      contentSource: content,
      family: resolveQualityFamily(state.family),
    })
  }, [state.analyzedResponse, state.family, state.finalDocument, state.sourceText])
  const qualityDecisionItems = useMemo(
    () => buildQualityDecisionItems(qualityReport),
    [qualityReport],
  )
  const publicationChecklist = useMemo(
    () => buildPublicationChecklist(qualityReport),
    [qualityReport],
  )
  const criticalWarnings = qualityReport.warnings.filter((warning) => warning.level === 'critical')
  const correctionSource = state.finalDocument || state.analyzedResponse || state.sourceText
  const correctionPlan = useMemo(
    () => createCorrectionPlan(qualityReport, correctionTargetScore),
    [correctionTargetScore, qualityReport],
  )
  const qualityActions = useMemo(() => {
    if (!finalDocumentExists) {
      return [
        'Coller ou analyser une proposition de contenu.',
        'Préparer un cadre de rédaction.',
        'Construire le plan éditorial avant production.',
      ]
    }

    const actions = []
    if (state.qualityScore < 95) actions.push('Lancer une correction massive.')
    if (state.qualityScore < 90) actions.push('Utiliser la reconstruction publication club.')
    if (/\|.+\|/.test(state.finalDocument)) actions.push('Convertir les tableaux bruts en blocs visuels.')
    if (!/évaluation|critères|observables/i.test(state.finalDocument)) actions.push('Ajouter une grille d’évaluation exploitable.')
    if (!/terrain|schéma|players|arrows|zones|ball/i.test(state.finalDocument)) actions.push('Ajouter les schémas terrain obligatoires.')
    if (actions.length === 0) actions.push('Document prêt à publier et exporter.')
    return actions
  }, [finalDocumentExists, state.finalDocument, state.qualityScore])

  useEffect(() => {
    const nextState = saveEditorialStudioState(savedState)
    setLastSavedAt(nextState.updatedAt)
  }, [savedState])

  useEffect(() => {
    const handler = () => {
      saveEditorialStudioState(savedState)
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [savedState])

  function patch(patchState: Partial<EditorialStudioState>) {
    setState((current) => ({
      ...current,
      ...patchState,
      steps: computeSteps({ ...current, ...patchState }),
    }))
  }

  function generatePrompt(mode: string) {
    const nextState = { ...state, activeMode: mode }
    const builders: Record<string, (current: EditorialStudioState) => string> = {
      chatgpt: buildChatGPTPrompt,
      claude: buildClaudePrompt,
      fusion: buildFusionPrompt,
      'massive-correction': buildMassiveCorrectionPrompt,
      'publication-reconstruction': buildPublicationReconstructionPrompt,
    }
    const nextPrompt = (builders[mode] ?? buildChatGPTPrompt)(nextState)
    patch({ activeMode: mode, activePrompt: nextPrompt, steps: computeSteps({ ...nextState, activePrompt: nextPrompt }) })
    setMessage(`Cadre de rédaction ${EDITORIAL_AI_MODES.find((item) => item.id === mode)?.label ?? mode} préparé.`)
  }

  async function copyPrompt() {
    if (!state.activePrompt.trim()) return
    await navigator.clipboard.writeText(state.activePrompt)
    setCopied('Cadre de rédaction copié.')
    window.setTimeout(() => setCopied(''), 1800)
  }

  function analyzeResponse() {
    const source = state.analyzedResponse || state.chatGptResponse || state.claudeResponse
    const score = scoreDocument({
      contentSource: source,
      family: resolveQualityFamily(state.family),
    }).globalScore
    patch({
      finalDocument: source,
      qualityScore: score,
      recommendedAction: score >= 95 ? 'Document prêt à publier et exporter.' : 'Lancer correction massive ou reconstruction publication club.',
    })
    setMessage(`Réponse analysée : score estimé ${score}/100.`)
  }

  function resetStudio() {
    const nextState = resetEditorialStudioState()
    setState(nextState)
    setMessage('Studio réinitialisé.')
  }

  function resumeWork() {
    const loaded = loadEditorialStudioState()
    if (!loaded) {
      setMessage('Aucun travail précédent trouvé.')
      return
    }
    setState(loaded)
    setMessage('Travail restauré.')
  }

  function exportPdf() {
    window.print()
  }

  function getStepStatus(stepId: string) {
    return savedState.steps[stepId as keyof typeof savedState.steps] ?? 'non démarré'
  }

  async function handleAttachment(file: File | null) {
    if (!file) return

    const canReadAsText =
      file.type.startsWith('text/') ||
      /\.(md|txt|csv|json)$/i.test(file.name)

    const extractedText = canReadAsText
      ? await file.text()
      : [
          `Pièce jointe importée : ${file.name}`,
          `Type : ${file.type || 'format bureautique'}`,
          'Source prête pour OCR / extraction avancée.',
          'Pour extraction complète PDF, image ou DOCX, utiliser le module OCR ou l’ancien studio avancé.',
        ].join('\n')

    patch({
      sourceText: state.sourceText.trim()
        ? `${state.sourceText.trim()}\n\n---\n${extractedText}`
        : extractedText,
    })
    setMessage(`Pièce jointe ajoutée : ${file.name}.`)
  }

  function saveToLibrary() {
    const savedDocuments = JSON.parse(window.localStorage.getItem('bcvb-editorial-library-drafts') || '[]')
    window.localStorage.setItem(
      'bcvb-editorial-library-drafts',
      JSON.stringify([
        {
          title: state.targetDocument,
          family: state.family,
          content: state.finalDocument,
          score: state.qualityScore,
          savedAt: new Date().toISOString(),
        },
        ...savedDocuments,
      ])
    )
    setMessage('Document enregistré dans les brouillons bibliothèque.')
  }

  function scrollToStudioBlock(blockId: string) {
    window.setTimeout(() => {
      document.getElementById(blockId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  function handleWorkflowStepClick(step: DocumentWorkflowStep) {
    scrollToStudioBlock(WORKFLOW_STEP_TARGETS[step.key] ?? 'studio-editor')
  }

  function handleWorkflowPrimaryAction() {
    if (!nextWorkflowStep) {
      scrollToStudioBlock('studio-export')
      return
    }

    if (nextWorkflowStep.key === 'structure' && !state.editorialPlan.trim()) {
      patch({ editorialPlan: buildPlanDraft(state) })
      setMessage('Plan éditorial généré depuis le workflow guidé.')
      scrollToStudioBlock('studio-structure')
      return
    }

    if (
      nextWorkflowStep.key === 'quality' &&
      (state.finalDocument.trim() || state.analyzedResponse.trim() || state.chatGptResponse.trim() || state.claudeResponse.trim())
    ) {
      analyzeResponse()
    }

    scrollToStudioBlock(WORKFLOW_STEP_TARGETS[nextWorkflowStep.key] ?? 'studio-editor')
  }

  function saveStudioNow() {
    const nextState = saveEditorialStudioState(savedState)
    setLastSavedAt(nextState.updatedAt)
    setMessage('Studio sauvegardé.')
  }

  function appendToFinalDocument(label: string, snippet: string) {
    const base = state.finalDocument.trim() || state.analyzedResponse.trim() || state.sourceText.trim()
    const nextDocument = `${base ? `${base}\n\n` : ''}${snippet}`.trim()
    patch({
      finalDocument: nextDocument,
      qualityScore: scoreDocument({
        contentSource: nextDocument,
        family: resolveQualityFamily(state.family),
      }).globalScore,
      recommendedAction: 'Bloc ajouté. Relance le score puis vérifie le rendu.',
    })
    setMessage(`${label} ajouté au document.`)
    scrollToStudioBlock('studio-editor')
  }

  function handleQualityAction(actionLabel: string) {
    const actions: Record<string, () => void> = {
      'Compléter les sections': () => scrollToStudioBlock('studio-structure'),
      'Ajouter identité BCVB': () => appendToFinalDocument('Identité BCVB', ':::bcvb-identity\ntitle: Identité BCVB\ncontent: Défendre Fort, Courir et Partager la Balle. Défense Homme à Homme, intensité, agressivité maîtrisée, maîtrise et jeu collectif.\n:::'),
      'Ajouter objectifs': () => appendToFinalDocument('Objectifs', '## Objectifs\n- Objectif principal : à préciser.\n- Objectif terrain : action observable à obtenir.\n- Objectif BCVB : relier Défendre Fort, Courir ou Partager la Balle.'),
      'Renforcer terrain': () => appendToFinalDocument('Utilité terrain', '## Exploitation terrain\n- Organisation : espace, joueurs, matériel.\n- Consignes coach : formulation courte et observable.\n- Critère terrain : décision ou comportement attendu.\n- Régulation : simplifier, complexifier, transférer en match.'),
      'Corriger les tableaux': () => appendToFinalDocument('Tableau corrigé', '## Tableau de synthèse\n| Élément | Intention | Critère | Point de vigilance |\n| --- | --- | --- | --- |\n| À compléter | À préciser | Observable | À relire |'),
      'Ajouter situation': () => appendToFinalDocument('Situation pédagogique', ':::bcvb-situation\ntitle: Situation à compléter\nobjectif: Relier l’objectif à une action terrain.\norganisation: Espace, joueurs, matériel, rotations.\nconsignes_joueurs: Défendre Fort, Courir, Partager la Balle.\ncriteres_reussite: Critères observables et mesurables.\nevolution_1: Simplifier ou complexifier.\n:::'),
      'Ajouter schémas': () => appendToFinalDocument('Schémas terrain', '## Schémas terrain\n- Terrain 1 : organisation de départ.\n- Flèches : déplacements, passes, dribbles ou écrans.\n- Zones : espaces à occuper ou à protéger.\n- Point de lecture : décision attendue.'),
      'Améliorer style': () => generatePrompt('massive-correction'),
      'Préparer export': () => scrollToStudioBlock('studio-export'),
    }

    const action = actions[actionLabel]

    if (action) {
      action()
      return
    }

    scrollToStudioBlock('studio-assistance')
  }

  function buildMicroCorrectionResult(content: string): MassiveCorrectionResult {
    const family = resolveQualityFamily(state.family)
    const correctedSource = content
      .trim()
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')

    return {
      correctedSource,
      changeLog: [
        'Espaces multiples, retours ligne et paragraphes trop espacés normalisés.',
        'Source documentaire conservée dans la colonne de gauche.',
        'Version précédente disponible via le bouton restaurer.',
      ],
      previousScore: scoreDocument({ contentSource: content, family }),
      newScore: scoreDocument({ contentSource: correctedSource, family }),
    }
  }

  function withRebuildAction(plan: CorrectionPlan): CorrectionPlan {
    const rebuildAction: CorrectionAction = {
      id: 'studio-rebuild-publication-club',
      type: 'restructure',
      description: 'Réorganisation globale en version publication club avec sections, vigilance, identité BCVB et blocs actionnables.',
      expectedGain: 18,
      requiresAi: true,
    }

    const hasRebuild = plan.actions.some((action) => action.type === 'restructure')

    return {
      ...plan,
      targetScore: Math.max(plan.targetScore, 98),
      riskLevel: 'medium',
      actions: hasRebuild ? plan.actions : [rebuildAction, ...plan.actions],
    }
  }

  async function runControlledCorrection(mode: CorrectionMode) {
    const before = correctionSource.trim()

    if (!before) {
      setMessage('Ajoute d’abord une source ou un document final avant correction.')
      scrollToStudioBlock('studio-source')
      return
    }

    setCorrectionRunning(mode)

    try {
      const family = resolveQualityFamily(state.family)
      const result =
        mode === 'micro'
          ? buildMicroCorrectionResult(before)
          : await applyMassiveCorrection({
              contentSource: before,
              family,
              correctionPlan:
                mode === 'rebuild'
                  ? withRebuildAction(createCorrectionPlan(qualityReport, 98))
                  : correctionPlan,
            })

      setCorrectionReview({ mode, before, result })
      patch({
        finalDocument: result.correctedSource,
        qualityScore: result.newScore?.globalScore ?? scoreDocument({ contentSource: result.correctedSource, family }).globalScore,
        recommendedAction: `${correctionModeLabels[mode]} appliquée. Relis puis valide ou restaure l’ancienne version.`,
      })
      setMessage(`${correctionModeLabels[mode]} appliquée. Ancienne version conservée pour restauration.`)
      scrollToStudioBlock('studio-editor')
    } finally {
      setCorrectionRunning(null)
    }
  }

  function restoreCorrectionBefore() {
    if (!correctionReview) return

    const family = resolveQualityFamily(state.family)
    patch({
      finalDocument: correctionReview.before,
      qualityScore: scoreDocument({ contentSource: correctionReview.before, family }).globalScore,
      recommendedAction: 'Ancienne version restaurée. Relance le score avant publication.',
    })
    setMessage('Ancienne version restaurée.')
    setCorrectionReview(null)
    scrollToStudioBlock('studio-editor')
  }

  function validateCorrectionReview() {
    if (!correctionReview) return
    setMessage(`${correctionModeLabels[correctionReview.mode]} validée dans l’éditeur.`)
    setCorrectionReview(null)
  }

  const studioWarnings = useMemo(() => {
    const content = state.finalDocument || state.analyzedResponse || state.sourceText
    const warnings = []
    if (!state.sourceText.trim()) warnings.push('Source absente : ajoute un brief, une transcription ou une note admin.')
    if (!state.editorialPlan.trim()) warnings.push('Plan éditorial à construire.')
    if (!content.trim()) warnings.push('Document final non généré.')
    if (state.qualityScore < 90) warnings.push('Score qualité à améliorer avant publication.')
    if (!/objectif|objectifs/i.test(content)) warnings.push('Objectifs explicites manquants.')
    if (!/crit[eè]re|observable|réussite/i.test(content)) warnings.push('Critères de réussite à ajouter.')
    if (!/vigilance|attention|point clé/i.test(content)) warnings.push('Bloc vigilance conseillé.')
    return warnings
  }, [state.editorialPlan, state.finalDocument, state.analyzedResponse, state.sourceText, state.qualityScore])

  const editorStats = useMemo(() => {
    const content = state.finalDocument || ''
    return [
      { label: 'Sections', value: String((content.match(/^##\s+/gm) || []).length) },
      { label: 'Tableaux', value: String((content.match(/\|.+\|/g) || []).length > 0 ? (content.match(/\n\|/g) || []).length : 0) },
      { label: 'Situations', value: String((content.match(/bcvb-situation|situation pédagogique|situation/gi) || []).length) },
      { label: 'Encarts', value: String((content.match(/:::bcvb-/gi) || []).length) },
    ]
  }, [state.finalDocument])

  const quickActions = [
    {
      label: 'Ajouter identité BCVB',
      action: () => appendToFinalDocument('Identité BCVB', ':::bcvb-identity\ntitle: Identité BCVB\ncontent: Défendre Fort, Courir et Partager la Balle. Défense Homme à Homme, intensité, agressivité maîtrisée, maîtrise et jeu collectif.\n:::'),
    },
    {
      label: 'Ajouter objectifs',
      action: () => appendToFinalDocument('Objectifs', '## Objectifs\n- Objectif principal : à préciser.\n- Objectif terrain : action observable à obtenir.\n- Objectif BCVB : relier Défendre Fort, Courir ou Partager la Balle.'),
    },
    {
      label: 'Ajouter critères de réussite',
      action: () => appendToFinalDocument('Critères de réussite', '## Critères de réussite\n- Critère observable 1 : comportement visible.\n- Critère observable 2 : décision juste sous pression.\n- Critère quantifiable : fréquence, durée ou réussite attendue.'),
    },
    {
      label: 'Ajouter tableau',
      action: () => appendToFinalDocument('Tableau', '## Tableau de synthèse\n| Élément | Intention | Critère | Point de vigilance |\n| --- | --- | --- | --- |\n| À compléter | À préciser | Observable | À relire |'),
    },
    {
      label: 'Ajouter situation pédagogique',
      action: () => appendToFinalDocument('Situation pédagogique', ':::bcvb-situation\ntitle: Situation à compléter\nobjectif: Relier l’objectif à une action terrain.\norganisation: Espace, joueurs, matériel, rotations.\nconsignes_joueurs: Défendre Fort, Courir, Partager la Balle.\ncriteres_reussite: Critères observables et mesurables.\nevolution_1: Simplifier ou complexifier.\n:::'),
    },
    {
      label: 'Ajouter bloc vigilance',
      action: () => appendToFinalDocument('Bloc vigilance', ':::bcvb-vigilance\ntitle: Point de vigilance\ncontent: À relire avant publication : clarté des consignes, sécurité, cohérence avec le niveau et rôle des adultes.\n:::'),
    },
    {
      label: 'Ajouter bilan',
      action: () => appendToFinalDocument('Bilan', '## Bilan\n- Ce qui est acquis.\n- Ce qui reste à travailler.\n- Prochaine action coach / admin / dirigeant.\n- Décision de publication.'),
    },
    {
      label: 'Améliorer le style',
      action: () => generatePrompt('massive-correction'),
    },
    {
      label: 'Préparer export PDF',
      action: () => scrollToStudioBlock('studio-export'),
    },
  ]

  const compactWorkflowStep =
    currentWorkflowStepKey === 'source' || currentWorkflowStepKey === 'classification'
      ? 1
      : currentWorkflowStepKey === 'structure' || currentWorkflowStepKey === 'production'
        ? 2
        : currentWorkflowStepKey === 'preview'
          ? 3
          : currentWorkflowStepKey === 'quality' || currentWorkflowStepKey === 'correction' || currentWorkflowStepKey === 'validation'
            ? 4
            : 5

  const compactWorkflowCompletedSteps = [
    documentWorkflowState.hasClassification ? 1 : null,
    documentWorkflowState.hasContent ? 2 : null,
    documentWorkflowState.hasPreview ? 3 : null,
    documentWorkflowState.isValidated ? 4 : null,
    documentWorkflowState.isExported ? 5 : null,
  ].filter((step): step is number => step !== null)

  return (
    <main className="editorial-studio-page editorial-studio-premium bcvb-page bcvb-premium-page">
      <EditorialStudioHero
        title="Produire, transformer, contrôler, exporter"
        subtitle="Un outil de production documentaire BCVB pensé pour la publication club, avec cadres de rédaction spécialisés, contrôle qualité et reprise de travail automatique."
      >
        <button className="bcvb-premium-button bcvb-premium-button--primary" type="button" onClick={resumeWork}>Reprendre mon travail</button>
        <button className="bcvb-premium-button bcvb-premium-button--danger" type="button" onClick={resetStudio}>Réinitialiser le studio</button>
        <Link className="bcvb-premium-button bcvb-premium-button--ghost" to="/admin/ia-documentaire">Ancien studio technique</Link>
      </EditorialStudioHero>

      <section className="editorial-document-workbench" aria-label="Workflow documentaire guidé">
        <EditorialStudioModeSelector
          mode={workflowMode}
          onModeChange={(mode) => setWorkflowMode(mode as DocumentWorkflowMode)}
        />
        <EditorialStudioWorkflow
          currentStep={compactWorkflowStep}
          completedSteps={compactWorkflowCompletedSteps}
        />
        <div className="editorial-document-workbench__header">
          <DocumentNextStepCard
            step={nextWorkflowStep}
            mode={workflowMode}
            onPrimaryAction={handleWorkflowPrimaryAction}
          />
        </div>

        <div className="editorial-document-workbench__main">
          <DocumentWorkflowStepper
            steps={workflowSteps}
            currentStepKey={currentWorkflowStepKey}
            onStepClick={handleWorkflowStepClick}
          />
          <div className="editorial-document-workbench__side">
            <DocumentWorkflowAssistantCard
              steps={workflowSteps}
              mode={workflowMode}
              currentStepKey={currentWorkflowStepKey}
              nextStep={nextWorkflowStep}
              onPrimaryAction={handleWorkflowPrimaryAction}
              onOpenStep={handleWorkflowStepClick}
            />
            <DocumentWorkflowGuide mode={workflowMode} />
          </div>
        </div>
      </section>

      <section className="editorial-stepper">
        {EDITORIAL_STUDIO_STEPS.map((step) => {
          const stepStatus = getStepStatus(step.id)
          const premiumStatusClass =
            stepStatus === 'validé'
              ? 'bcvb-premium-status--done'
              : stepStatus === 'à corriger'
                ? 'bcvb-premium-status--warning'
                : stepStatus === 'en cours'
                  ? 'bcvb-premium-status--progress'
                  : 'bcvb-premium-status--pending'

          return (
            <article
              className={[
                'editorial-step',
                'editorial-step-card',
                stepStatus !== 'non démarré' ? 'editorial-step-card--active' : '',
                `editorial-step--${stepStatus.replace(/\s+/g, '-')}`,
              ].filter(Boolean).join(' ')}
              key={step.id}
            >
              <span>{step.label}</span>
              <strong className={`bcvb-premium-status ${premiumStatusClass}`}>{stepStatus}</strong>
            </article>
          )
        })}
      </section>

      <section className="editorial-top-toolbar editorial-action-bar bcvb-premium-toolbar bcvb-toolbar-safe">
        <div className="bcvb-premium-toolbar__main bcvb-action-row-safe">
          <button className="bcvb-premium-button bcvb-premium-button--primary" type="button" onClick={saveStudioNow}>Sauvegarder</button>
          <button className="bcvb-premium-button bcvb-premium-button--secondary" type="button" onClick={() => { analyzeResponse(); scrollToStudioBlock('studio-preview') }}>Prévisualiser</button>
          <button className="bcvb-premium-button bcvb-premium-button--secondary" type="button" onClick={analyzeResponse}>Scorer</button>
          <button className="bcvb-premium-button bcvb-premium-button--primary" type="button" onClick={() => generatePrompt('massive-correction')}>Améliorer</button>
        </div>
        <div className="bcvb-premium-toolbar__secondary bcvb-action-row-safe">
          <button className="bcvb-premium-button bcvb-premium-button--ghost" type="button" onClick={exportPdf}>Exporter</button>
          <button className="bcvb-premium-button bcvb-premium-button--ghost" type="button" onClick={resumeWork}>Historique</button>
        </div>
      </section>

      <div className="editorial-studio-layout editorial-studio-layout--workbench editorial-workbench">
        <aside className="editorial-source-column editorial-workbench__side" id="studio-source">
          <EditorialStudioPromptPanel
            prompt={state.activePrompt}
            copiedMessage={copied}
            onPromptChange={(activePrompt) => patch({ activePrompt })}
            actions={[
              { label: 'Cadre rédactionnel', onClick: () => generatePrompt('chatgpt') },
              { label: 'Cadre approfondi', onClick: () => generatePrompt('claude') },
              { label: 'Copier', onClick: copyPrompt },
            ]}
          />

          <EditorialStudioForm
            values={{
              targetDocument: state.targetDocument,
              family: state.family,
              category: state.category,
              audience: state.audience,
              sourceText: state.sourceText,
              transformedFromTitle: state.transformedFromTitle,
              sourceDocumentId: state.sourceDocumentId,
            }}
            families={EDITORIAL_DOCUMENT_FAMILIES}
            metadata={[
              { label: 'Fichier associé', value: state.transformedFromTitle || 'Aucun fichier associé' },
              { label: 'Source document', value: state.sourceDocumentId || 'Source locale' },
              { label: 'Dernière sauvegarde', value: lastSavedAt ? new Date(lastSavedAt).toLocaleString('fr-FR') : 'Autosave actif' },
            ]}
            onChange={(nextValues) => patch(nextValues)}
            onAttachment={handleAttachment}
          />
        </aside>

        <section className="editorial-editor-column editorial-workbench__main" id="studio-editor">
          <section className="editorial-panel editorial-step-card editorial-editor-shell">
            <header>
              <p className="bcvb-eyebrow">Éditeur</p>
              <h2>BCVB Rich Markdown</h2>
              <span>Sections · tableaux · situations · encarts</span>
            </header>
            <div className="editorial-editor-stats">
              {editorStats.map((item) => (
                <article key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              ))}
            </div>
            <textarea
              className="editorial-markdown-editor"
              value={state.finalDocument}
              onChange={(event) => patch({
                finalDocument: event.target.value,
                qualityScore: scoreDocument({
                  contentSource: event.target.value,
                  family: resolveQualityFamily(state.family),
                }).globalScore,
              })}
              placeholder="Écris ou colle ici le document final BCVB Rich Markdown. Les actions rapides à droite ajoutent des blocs prêts à relire."
            />
          </section>

          <section className="editorial-panel editorial-step-card" id="studio-structure">
            <header>
              <p className="bcvb-eyebrow">Structure</p>
              <h2>Plan et production guidée</h2>
            </header>
            <textarea
              className="editorial-textarea editorial-textarea--small"
              value={state.editorialPlan}
              onChange={(event) => patch({ editorialPlan: event.target.value })}
              placeholder="Plan éditorial, sections, progression, situations, schémas, évaluations..."
            />
            <div className="editorial-mode-grid">
              {EDITORIAL_AI_MODES.map((mode) => (
                <button
                  type="button"
                  className={state.activeMode === mode.id ? 'is-active' : ''}
                  onClick={() => generatePrompt(mode.id)}
                  key={mode.id}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <div className="editorial-actions">
              <button type="button" onClick={() => patch({ editorialPlan: buildPlanDraft(state) })}>Générer plan</button>
              <button type="button" onClick={() => generatePrompt('fusion')}>Consolider deux versions</button>
              <button type="button" onClick={() => generatePrompt('publication-reconstruction')}>Reconstruction publication</button>
            </div>
          </section>

          <section className="editorial-panel editorial-step-card" id="studio-production">
            <header>
              <p className="bcvb-eyebrow">Propositions de contenu</p>
              <h2>Comparer et analyser</h2>
            </header>
            <div className="editorial-response-grid">
              <textarea value={state.chatGptResponse} onChange={(event) => patch({ chatGptResponse: event.target.value })} placeholder="Proposition de contenu 1" />
              <textarea value={state.claudeResponse} onChange={(event) => patch({ claudeResponse: event.target.value })} placeholder="Proposition de contenu 2" />
            </div>
            <textarea
              className="editorial-textarea editorial-textarea--small"
              value={state.analyzedResponse}
              onChange={(event) => patch({ analyzedResponse: event.target.value })}
              placeholder="Réponse finale à analyser ou à convertir en document final."
            />
            <div className="editorial-actions">
              <button type="button" onClick={analyzeResponse}>Analyser et envoyer dans l’éditeur</button>
              <button type="button" onClick={() => patch({ finalDocument: state.analyzedResponse || state.chatGptResponse || state.claudeResponse })}>Utiliser comme document final</button>
            </div>
          </section>

          <EditorialStudioPreview content={state.finalDocument}>
            <EditorialStudioExportActions
              canExport={finalDocumentExists}
              onExportPdf={exportPdf}
              onExportMarkdown={() => downloadText(`${state.targetDocument}.md`, state.finalDocument)}
              onSaveToLibrary={saveToLibrary}
            />
          </EditorialStudioPreview>
        </section>

        <aside className="editorial-assistance-column editorial-workbench__side" id="studio-assistance">
          <EditorialStudioQualityPanel
            title={state.targetDocument}
            status={statusLabel(qualityReport.status)}
            statusTone={getQualityStatusTone(qualityReport.status)}
            criticalWarningsCount={criticalWarnings.length}
            score={qualityReport.globalScore}
            recommendedAction={state.recommendedAction}
            metadata={[
              { label: 'Famille', value: selectedFamily.label },
              { label: 'Catégorie', value: state.category },
              { label: 'Source', value: savedState.steps.sources },
              { label: 'Plan', value: savedState.steps.plan },
              { label: 'Production', value: savedState.steps.production },
              { label: 'Export', value: savedState.steps.export },
            ]}
            message={message}
            checks={qualityDecisionItems.map((item) => ({
              id: item.key,
              label: item.label,
              value: item.value,
              explanation: item.explanation,
              action: item.action,
            }))}
            onCheckAction={handleQualityAction}
          />

          <EditorialStudioCorrectionPanel
            currentScore={qualityReport.globalScore}
            targetScore={correctionTargetScore}
            correctionPlan={correctionPlan}
            correctionRunning={correctionRunning}
            correctionReview={correctionReview}
            modeLabels={correctionModeLabels}
            onTargetScoreChange={setCorrectionTargetScore}
            onRunCorrection={runControlledCorrection}
            onValidateCorrection={validateCorrectionReview}
            onRestoreCorrection={restoreCorrectionBefore}
          />

          <EditorialStudioAssistancePanels
            qualityActions={qualityActions}
            warnings={studioWarnings}
            quickActions={quickActions}
            publicationChecklist={publicationChecklist}
          />
        </aside>
      </div>
    </main>
  )
}
