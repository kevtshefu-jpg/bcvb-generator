export type EditorialProvider = 'chatgpt' | 'claude' | 'manual'

export type EditorialStudioStep =
  | 'cadre'
  | 'sources'
  | 'plan'
  | 'production'
  | 'quality'
  | 'export'

export type EditorialDraftState = {
  id: string
  updatedAt: string
  activeStep: EditorialStudioStep
  targetTitle: string
  documentFamily: string
  productionLevel: string
  category: string
  audience: string
  season: string
  selectedReferentials: string[]
  sourceMode: 'paste' | 'upload' | 'library' | 'ocr'
  sourceText: string
  uploadedFileName?: string
  uploadedFileType?: string
  extractedText?: string
  editorialPlan: any | null
  masterPrompt: string
  provider: EditorialProvider
  generatedAnswer: string
  normalizedMarkdown: string
  qualityScore: number | null
  qualityReport: any | null
  previewHtml: string
}

const STORAGE_KEY = 'bcvb_editorial_studio_draft_v1'

export function saveEditorialDraft(draft: Partial<EditorialDraftState>) {
  try {
    const current = loadEditorialDraft()
    const next: EditorialDraftState = {
      id: current?.id || crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
      activeStep: draft.activeStep || current?.activeStep || 'cadre',
      targetTitle: draft.targetTitle ?? current?.targetTitle ?? '',
      documentFamily: draft.documentFamily ?? current?.documentFamily ?? '',
      productionLevel: draft.productionLevel ?? current?.productionLevel ?? '',
      category: draft.category ?? current?.category ?? '',
      audience: draft.audience ?? current?.audience ?? '',
      season: draft.season ?? current?.season ?? '',
      selectedReferentials: draft.selectedReferentials ?? current?.selectedReferentials ?? [],
      sourceMode: draft.sourceMode ?? current?.sourceMode ?? 'paste',
      sourceText: draft.sourceText ?? current?.sourceText ?? '',
      uploadedFileName: draft.uploadedFileName ?? current?.uploadedFileName,
      uploadedFileType: draft.uploadedFileType ?? current?.uploadedFileType,
      extractedText: draft.extractedText ?? current?.extractedText ?? '',
      editorialPlan: draft.editorialPlan ?? current?.editorialPlan ?? null,
      masterPrompt: draft.masterPrompt ?? current?.masterPrompt ?? '',
      provider: draft.provider ?? current?.provider ?? 'chatgpt',
      generatedAnswer: draft.generatedAnswer ?? current?.generatedAnswer ?? '',
      normalizedMarkdown: draft.normalizedMarkdown ?? current?.normalizedMarkdown ?? '',
      qualityScore: draft.qualityScore ?? current?.qualityScore ?? null,
      qualityReport: draft.qualityReport ?? current?.qualityReport ?? null,
      previewHtml: draft.previewHtml ?? current?.previewHtml ?? '',
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  } catch (error) {
    console.warn('Impossible de sauvegarder le brouillon éditorial', error)
    return null
  }
}

export function loadEditorialDraft(): EditorialDraftState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as EditorialDraftState
  } catch (error) {
    console.warn('Impossible de charger le brouillon éditorial', error)
    return null
  }
}

export function clearEditorialDraft() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Impossible de supprimer le brouillon éditorial', error)
  }
}

export function hasEditorialDraft() {
  const draft = loadEditorialDraft()
  return Boolean(
    draft &&
      (
        draft.targetTitle ||
        draft.sourceText ||
        draft.extractedText ||
        draft.editorialPlan ||
        draft.masterPrompt ||
        draft.generatedAnswer ||
        draft.normalizedMarkdown
      )
  )
}
