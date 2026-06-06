export type EditorialStepStatus = 'non démarré' | 'en cours' | 'validé' | 'à corriger'

export type EditorialStudioModule = {
  id: string
  title: string
  forWhat: string
  why: string
  forWhom: string
  how: string
  evolution: string
  howToEvolve: string
  priority: string
  impact: string
  complexity: string
  status: string
}

export type EditorialDocumentFamily = {
  id: string
  label: string
  requirements: string[]
}

export const EDITORIAL_STUDIO_STEPS: Array<{ id: string; label: string }>
export const EDITORIAL_STEP_STATUSES: EditorialStepStatus[]
export const EDITORIAL_AI_MODES: Array<{ id: string; label: string }>
export const EDITORIAL_DOCUMENT_FAMILIES: EditorialDocumentFamily[]
export const EDITORIAL_STUDIO_MODULES: EditorialStudioModule[]
