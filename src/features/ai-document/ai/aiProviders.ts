import type { AiGenerationMode } from './types'

export const DEFAULT_OPENAI_MODEL =
  import.meta.env.VITE_OPENAI_MODEL || 'gpt-5.2'

export const DEFAULT_CLAUDE_MODEL =
  import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-opus-4-7'

export const AI_API_ENABLED = import.meta.env.VITE_ENABLE_AI_API === 'true'

export const AI_PROVIDERS: AiGenerationMode[] = [
  {
    provider: 'manual_chatgpt',
    label: 'Manuel ChatGPT',
    description: 'Le site génère un prompt à coller dans ChatGPT.',
    requiresApiKey: false,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
  {
    provider: 'manual_claude',
    label: 'Manuel Claude',
    description: 'Le site génère un prompt optimisé pour Claude.',
    requiresApiKey: false,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
  {
    provider: 'openai',
    label: 'API OpenAI',
    description: 'Production automatisée via OpenAI.',
    requiresApiKey: true,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
  {
    provider: 'anthropic',
    label: 'API Claude',
    description: 'Production automatisée via Anthropic Claude.',
    requiresApiKey: true,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
  {
    provider: 'dual',
    label: 'Double génération ChatGPT + Claude',
    description: 'Génère deux versions puis prépare une fusion éditoriale BCVB.',
    requiresApiKey: true,
    supportsFiles: true,
    supportsImages: true,
    supportsLongContext: true,
  },
]
