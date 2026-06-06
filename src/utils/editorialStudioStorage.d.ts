export type EditorialStudioState = {
  targetDocument: string
  family: string
  category: string
  audience: string
  season: string
  productionLevel: string
  sourceText: string
  editorialPlan: string
  activeMode: string
  activePrompt: string
  chatGptResponse: string
  claudeResponse: string
  analyzedResponse: string
  finalDocument: string
  qualityScore: number
  recommendedAction: string
  sourceDocumentId?: string | null
  transformedFromTitle?: string | null
  transformationDate?: string | null
  transformationMode?: 'bcvb_upgrade' | string | null
  parentDocumentId?: string | null
  createdFromDocumentId?: string | null
  isLatestVersion?: boolean | null
  steps: Record<string, string>
  updatedAt: string | null
}

export const defaultEditorialStudioState: EditorialStudioState
export function saveEditorialStudioState(state: EditorialStudioState): EditorialStudioState
export function loadEditorialStudioState(): EditorialStudioState | null
export function resetEditorialStudioState(): EditorialStudioState
export function buildChatGPTPrompt(state: EditorialStudioState): string
export function buildClaudePrompt(state: EditorialStudioState): string
export function buildFusionPrompt(state: EditorialStudioState): string
export function buildMassiveCorrectionPrompt(state: EditorialStudioState): string
export function buildPublicationReconstructionPrompt(state: EditorialStudioState): string
