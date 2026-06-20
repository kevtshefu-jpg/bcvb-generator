export type DocumentWorkflowMode =
  | 'creation'
  | 'edition'
  | 'improvement'
  | 'validation'
  | 'export'

export type DocumentWorkflowStepKey =
  | 'source'
  | 'classification'
  | 'structure'
  | 'production'
  | 'preview'
  | 'quality'
  | 'correction'
  | 'validation'
  | 'export'
  | 'archive'

export type DocumentWorkflowStepStatus =
  | 'todo'
  | 'current'
  | 'done'
  | 'warning'
  | 'blocked'

export type DocumentWorkflowStep = {
  key: DocumentWorkflowStepKey
  order: number
  title: string
  shortTitle: string
  description: string
  actionLabel: string
  status: DocumentWorkflowStepStatus
  required: boolean
}

export type DocumentWorkflowState = {
  hasSource?: boolean
  hasClassification?: boolean
  hasStructure?: boolean
  hasContent?: boolean
  hasPreview?: boolean
  qualityScore?: number | null
  isValidated?: boolean
  isExported?: boolean
}

type StepDefinition = Omit<DocumentWorkflowStep, 'status'>

const CREATION_WORKFLOW_STEPS: StepDefinition[] = [
  {
    key: 'source',
    order: 1,
    title: 'Ajouter ou écrire la source',
    shortTitle: 'Source',
    description: 'Coller un texte, importer une ressource ou démarrer d’un modèle.',
    actionLabel: 'Importer / écrire',
    required: true,
  },
  {
    key: 'classification',
    order: 2,
    title: 'Classer le document',
    shortTitle: 'Classement',
    description: 'Définir famille, catégorie, audience, saison, tags et niveau de publication.',
    actionLabel: 'Classer',
    required: true,
  },
  {
    key: 'structure',
    order: 3,
    title: 'Construire le plan',
    shortTitle: 'Structure',
    description: 'Organiser les parties, chapitres, objectifs et blocs importants.',
    actionLabel: 'Structurer',
    required: true,
  },
  {
    key: 'production',
    order: 4,
    title: 'Produire le contenu',
    shortTitle: 'Production',
    description: 'Rédiger, générer ou améliorer le contenu final.',
    actionLabel: 'Produire',
    required: true,
  },
  {
    key: 'preview',
    order: 5,
    title: 'Vérifier le rendu',
    shortTitle: 'Aperçu',
    description: 'Lire le document comme un utilisateur final.',
    actionLabel: 'Prévisualiser',
    required: true,
  },
  {
    key: 'quality',
    order: 6,
    title: 'Contrôler la qualité',
    shortTitle: 'Qualité',
    description: 'Vérifier cohérence, lisibilité, identité BCVB et complétude.',
    actionLabel: 'Contrôler',
    required: true,
  },
  {
    key: 'export',
    order: 7,
    title: 'Exporter ou publier',
    shortTitle: 'Export',
    description: 'Générer PDF, Markdown ou publier dans la bibliothèque.',
    actionLabel: 'Préparer export',
    required: true,
  },
]

const EDITION_WORKFLOW_STEPS: StepDefinition[] = [
  {
    key: 'source',
    order: 1,
    title: 'Identifier la modification',
    shortTitle: 'Identifier',
    description: 'Comprendre ce qui doit être modifié et pourquoi.',
    actionLabel: 'Identifier',
    required: true,
  },
  {
    key: 'production',
    order: 2,
    title: 'Modifier le contenu',
    shortTitle: 'Modifier',
    description: 'Corriger le contenu, les métadonnées ou la structure utile.',
    actionLabel: 'Modifier',
    required: true,
  },
  {
    key: 'preview',
    order: 3,
    title: 'Comparer le rendu',
    shortTitle: 'Comparer',
    description: 'Vérifier l’avant / après et la cohérence de lecture.',
    actionLabel: 'Comparer',
    required: true,
  },
  {
    key: 'quality',
    order: 4,
    title: 'Scorer la nouvelle version',
    shortTitle: 'Scorer',
    description: 'Contrôler la qualité après modification.',
    actionLabel: 'Scorer',
    required: true,
  },
  {
    key: 'validation',
    order: 5,
    title: 'Valider la version',
    shortTitle: 'Valider',
    description: 'Confirmer que la nouvelle version est stable.',
    actionLabel: 'Valider',
    required: true,
  },
  {
    key: 'export',
    order: 6,
    title: 'Exporter la version',
    shortTitle: 'Exporter',
    description: 'Générer ou publier la version propre.',
    actionLabel: 'Préparer export',
    required: false,
  },
]

const IMPROVEMENT_WORKFLOW_STEPS: StepDefinition[] = [
  {
    key: 'quality',
    order: 1,
    title: 'Analyser les faiblesses',
    shortTitle: 'Analyser',
    description: 'Identifier les faiblesses du document.',
    actionLabel: 'Analyser',
    required: true,
  },
  {
    key: 'correction',
    order: 2,
    title: 'Prioriser les corrections',
    shortTitle: 'Prioriser',
    description: 'Choisir les corrections utiles pour le club.',
    actionLabel: 'Prioriser',
    required: true,
  },
  {
    key: 'production',
    order: 3,
    title: 'Améliorer le document',
    shortTitle: 'Améliorer',
    description: 'Réécrire, compléter ou renforcer les blocs faibles.',
    actionLabel: 'Améliorer',
    required: true,
  },
  {
    key: 'preview',
    order: 4,
    title: 'Vérifier la cohérence',
    shortTitle: 'Vérifier',
    description: 'Contrôler cohérence, rendu et qualité de lecture.',
    actionLabel: 'Vérifier',
    required: true,
  },
  {
    key: 'validation',
    order: 5,
    title: 'Valider la version',
    shortTitle: 'Valider',
    description: 'Stabiliser la version avant diffusion.',
    actionLabel: 'Valider',
    required: true,
  },
  {
    key: 'export',
    order: 6,
    title: 'Exporter la version propre',
    shortTitle: 'Exporter',
    description: 'Diffuser une version propre et lisible.',
    actionLabel: 'Préparer export',
    required: false,
  },
]

const VALIDATION_WORKFLOW_STEPS: StepDefinition[] = [
  {
    key: 'preview',
    order: 1,
    title: 'Relire le document',
    shortTitle: 'Relire',
    description: 'Lire le document dans son rendu final avant décision.',
    actionLabel: 'Relire',
    required: true,
  },
  {
    key: 'quality',
    order: 2,
    title: 'Vérifier la qualité',
    shortTitle: 'Qualité',
    description: 'Contrôler score, warnings, identité BCVB et lisibilité.',
    actionLabel: 'Contrôler',
    required: true,
  },
  {
    key: 'validation',
    order: 3,
    title: 'Confirmer la validation',
    shortTitle: 'Valider',
    description: 'Confirmer que le document est utilisable par le club.',
    actionLabel: 'Valider',
    required: true,
  },
  {
    key: 'export',
    order: 4,
    title: 'Préparer la diffusion',
    shortTitle: 'Diffuser',
    description: 'Préparer export ou publication sans modifier le contenu.',
    actionLabel: 'Préparer',
    required: false,
  },
]

const EXPORT_WORKFLOW_STEPS: StepDefinition[] = [
  {
    key: 'source',
    order: 1,
    title: 'Vérifier la source',
    shortTitle: 'Source',
    description: 'Confirmer que la source et le document final sont conservés.',
    actionLabel: 'Vérifier source',
    required: true,
  },
  {
    key: 'preview',
    order: 2,
    title: 'Relire le rendu',
    shortTitle: 'Rendu',
    description: 'Relire avant toute diffusion ou téléchargement.',
    actionLabel: 'Relire',
    required: true,
  },
  {
    key: 'quality',
    order: 3,
    title: 'Contrôler avant export',
    shortTitle: 'Contrôle',
    description: 'Vérifier les warnings critiques avant export.',
    actionLabel: 'Contrôler',
    required: true,
  },
  {
    key: 'export',
    order: 4,
    title: 'Exporter ou publier',
    shortTitle: 'Exporter',
    description: 'Utiliser les actions existantes pour générer ou diffuser.',
    actionLabel: 'Préparer export',
    required: false,
  },
  {
    key: 'archive',
    order: 5,
    title: 'Conserver la version',
    shortTitle: 'Archive',
    description: 'Conserver source, version et historique de travail.',
    actionLabel: 'Voir historique',
    required: false,
  },
]

const WORKFLOW_STEPS_BY_MODE: Record<DocumentWorkflowMode, StepDefinition[]> = {
  creation: CREATION_WORKFLOW_STEPS,
  edition: EDITION_WORKFLOW_STEPS,
  improvement: IMPROVEMENT_WORKFLOW_STEPS,
  validation: VALIDATION_WORKFLOW_STEPS,
  export: EXPORT_WORKFLOW_STEPS,
}

const STEP_STATUS_LABELS: Record<DocumentWorkflowStepStatus, string> = {
  todo: 'À faire',
  current: 'En cours',
  done: 'Terminé',
  warning: 'À vérifier',
  blocked: 'Bloqué',
}

function hasQualityScore(documentState: DocumentWorkflowState) {
  return typeof documentState.qualityScore === 'number'
}

function hasPublishableQuality(documentState: DocumentWorkflowState) {
  return hasQualityScore(documentState) && Number(documentState.qualityScore) >= 90
}

function isStepDone(key: DocumentWorkflowStepKey, documentState: DocumentWorkflowState) {
  switch (key) {
    case 'source':
      return Boolean(documentState.hasSource)
    case 'classification':
      return Boolean(documentState.hasClassification)
    case 'structure':
      return Boolean(documentState.hasStructure)
    case 'production':
      return Boolean(documentState.hasContent)
    case 'preview':
      return Boolean(documentState.hasPreview)
    case 'quality':
      return hasPublishableQuality(documentState)
    case 'correction':
      return hasQualityScore(documentState) && Number(documentState.qualityScore) >= 95
    case 'validation':
      return Boolean(documentState.isValidated)
    case 'export':
      return Boolean(documentState.isExported)
    case 'archive':
      return Boolean(documentState.isExported)
    default:
      return false
  }
}

export function getCurrentDocumentStep(
  documentState: DocumentWorkflowState,
  mode: DocumentWorkflowMode = 'creation'
): DocumentWorkflowStepKey {
  if (mode === 'improvement') {
    if (!documentState.hasContent || !hasQualityScore(documentState)) return 'quality'
    if (!hasPublishableQuality(documentState)) return 'correction'
    if (!documentState.hasPreview) return 'preview'
    if (!documentState.isValidated) return 'validation'
    if (!documentState.isExported) return 'export'
    return 'archive'
  }

  if (mode === 'validation') {
    if (!documentState.hasPreview) return 'preview'
    if (!hasPublishableQuality(documentState)) return 'quality'
    if (!documentState.isValidated) return 'validation'
    if (!documentState.isExported) return 'export'
    return 'archive'
  }

  if (mode === 'export') {
    if (!documentState.hasSource) return 'source'
    if (!documentState.hasPreview) return 'preview'
    if (!hasPublishableQuality(documentState)) return 'quality'
    if (!documentState.isExported) return 'export'
    return 'archive'
  }

  if (mode === 'edition') {
    if (!documentState.hasSource) return 'source'
    if (!documentState.hasContent) return 'production'
    if (!documentState.hasPreview) return 'preview'
    if (!hasPublishableQuality(documentState)) return 'quality'
    if (!documentState.isValidated) return 'validation'
    if (!documentState.isExported) return 'export'
    return 'archive'
  }

  if (!documentState.hasSource) return 'source'
  if (!documentState.hasClassification) return 'classification'
  if (!documentState.hasStructure) return 'structure'
  if (!documentState.hasContent) return 'production'
  if (!documentState.hasPreview) return 'preview'
  if (!hasPublishableQuality(documentState)) return 'quality'
  if (!documentState.isExported) return 'export'
  return 'archive'
}

function getStepStatus(
  step: StepDefinition,
  currentStepKey: DocumentWorkflowStepKey,
  currentOrder: number,
  documentState: DocumentWorkflowState
): DocumentWorkflowStepStatus {
  if (isStepDone(step.key, documentState)) return 'done'
  if (step.key === currentStepKey) {
    if (step.key === 'quality' && hasQualityScore(documentState) && !hasPublishableQuality(documentState)) {
      return 'warning'
    }
    return 'current'
  }
  if (step.order < currentOrder && step.required) return 'warning'
  if (step.order > currentOrder + 1 && step.required) return 'blocked'
  return 'todo'
}

export function getDocumentWorkflowSteps(
  mode: DocumentWorkflowMode,
  documentState: DocumentWorkflowState = {}
): DocumentWorkflowStep[] {
  const definitions = WORKFLOW_STEPS_BY_MODE[mode] ?? CREATION_WORKFLOW_STEPS
  const currentStepKey = getCurrentDocumentStep(documentState, mode)
  const currentOrder =
    definitions.find((step) => step.key === currentStepKey)?.order ??
    definitions.find((step) => !isStepDone(step.key, documentState))?.order ??
    definitions[definitions.length - 1]?.order ??
    1

  return definitions.map((step) => ({
    ...step,
    status: getStepStatus(step, currentStepKey, currentOrder, documentState),
  }))
}

export function getNextDocumentStep(steps: DocumentWorkflowStep[]) {
  return steps.find((step) => step.status !== 'done') ?? null
}

export function getWorkflowProgress(steps: DocumentWorkflowStep[]) {
  if (!steps.length) return 0
  const doneSteps = steps.filter((step) => step.status === 'done').length
  return Math.round((doneSteps / steps.length) * 100)
}

export function getStepStatusLabel(status: DocumentWorkflowStepStatus) {
  return STEP_STATUS_LABELS[status]
}
