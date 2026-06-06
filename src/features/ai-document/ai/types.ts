export type AiProvider =
  | 'manual_chatgpt'
  | 'manual_claude'
  | 'openai'
  | 'anthropic'
  | 'dual'

export type AiModelRole =
  | 'planner'
  | 'writer'
  | 'critic'
  | 'diagrammer'
  | 'normalizer'
  | 'fusion'

export type AiGenerationMode = {
  provider: AiProvider
  label: string
  description: string
  requiresApiKey: boolean
  supportsFiles: boolean
  supportsImages: boolean
  supportsLongContext: boolean
}

export type AiGenerateInput = {
  provider: AiProvider
  model?: string
  role: AiModelRole
  prompt: string
  system?: string
  maxTokens?: number
  temperature?: number
}

export type AiGenerateResult = {
  provider: AiProvider
  model?: string
  text: string
  usage?: {
    inputTokens?: number
    outputTokens?: number
  }
  error?: string
}
