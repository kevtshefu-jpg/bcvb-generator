export type EditorialStudioFeedbackType = 'success' | 'error' | 'info' | 'warning'

export type EditorialStudioModeOption = {
  id: string
  title: string
  description: string
  recommendation: string
}

export type EditorialStudioWorkflowItem = {
  label: string
  help: string
}

export type EditorialStudioFamilyOption = {
  id: string
  label: string
}

export type EditorialStudioFormValues = {
  targetDocument: string
  family: string
  category: string
  audience: string
  sourceText: string
  transformedFromTitle?: string | null
  sourceDocumentId?: string | null
}

export type EditorialStudioQualityCheck = {
  id: string
  label: string
  value: number
  explanation: string
  action: string
}

export type EditorialStudioMetaItem = {
  label: string
  value: string
}

export type EditorialStudioPromptAction = {
  label: string
  onClick: () => void
}

export type EditorialStudioQuickAction = {
  label: string
  action: () => void
}
