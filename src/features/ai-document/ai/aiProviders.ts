import type { AiGenerationMode } from './types'

export const DEFAULT_OPENAI_MODEL =
  import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.2'

export const DEFAULT_CLAUDE_MODEL =
  import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-opus-4-7'

export const AI_API_ENABLED = import.meta.env.VITE_ENABLE_AI_API === 'true'

export const AI_PROVIDERS: AiGenerationMode[] = [
  {
    provider: 'manual_chatgpt',
    label: 'Cadre rédactionnel',
    description: 'Le site prépare un cadre à utiliser en mode manuel.',
    requiresApiKey: false,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
  {
    provider: 'manual_claude',
    label: 'Cadre approfondi',
    description: 'Le site prépare un cadre approfondi pour une version longue.',
    requiresApiKey: false,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
  {
    provider: 'openai',
    label: 'Production guidée',
    description: 'Production automatisée via la configuration serveur.',
    requiresApiKey: true,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
  {
    provider: 'anthropic',
    label: 'Production approfondie',
    description: 'Production automatisée longue via la configuration serveur.',
    requiresApiKey: true,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
  {
    provider: 'dual',
    label: 'Double production',
    description: 'Prépare deux versions puis une fusion éditoriale BCVB.',
    requiresApiKey: true,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
]
