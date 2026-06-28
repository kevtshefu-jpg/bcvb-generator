import type { AiProvider } from '../ai/types'

export function adaptPromptForProvider(prompt: string, provider: AiProvider): string {
  if (provider === 'manual_claude' || provider === 'anthropic') {
    return `
Produis une réponse complète, structurée, sans commentaires, en respectant strictement le Rich Markdown BCVB. Ne pas résumer. Ne pas expliquer. Ne pas convertir les blocs techniques en prose. Produire une écriture longue, fluide, humaine et éditoriale, mais garder chaque bloc typé intact.

${prompt}
`.trim()
  }

  return `
Produis un document BCVB normalisé, structuré, compatible avec le parseur du site et les blocs typés. Respecte strictement le format Rich Markdown BCVB et retourne uniquement le contenu final.

${prompt}
`.trim()
}
