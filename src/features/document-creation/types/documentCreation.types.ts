import type { DocumentFamily } from '../../document-quality/types/quality.types'

export type CreationDocumentType = Exclude<DocumentFamily, 'unknown'>

export type CreationCategory = 'U7' | 'U9' | 'U11' | 'U13' | 'U15' | 'U18' | 'Seniors' | 'Club'
export type CreationAudience = 'coachs' | 'joueurs' | 'parents' | 'dirigeants' | 'bénévoles'
export type CreationLevel = 'découverte' | 'formation' | 'compétition' | 'performance'
export type CreationContentMode = 'prompt_libre' | 'modele_guide' | 'fichier_importe'

export type DocumentTypeOption = {
  id: CreationDocumentType
  label: string
  purpose: string
  example: string
  detailLevel: string
}

export type CreationContext = {
  category: CreationCategory
  audience: CreationAudience
  level: CreationLevel
  mainObjective: string
  constraints: string
}

export type CreationSource = {
  mode: CreationContentMode
  freePrompt: string
  guidedNotes: string
  importedFileName: string
  importedText: string
}

export type DocumentCreationInput = {
  documentType: CreationDocumentType
  context: CreationContext
  source: CreationSource
}

export type DocumentCreationDraft = {
  title: string
  internalPrompt: string
  richMarkdown: string
}
