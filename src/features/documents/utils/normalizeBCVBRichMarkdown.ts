import {
  normalizeRichMarkdown,
  type RichMarkdownNormalizationResult,
} from '../../../utils/normalizeRichMarkdown'

const FIELD_ALIASES: Array<[RegExp, string]> = [
  [/^(\s*)sous-titre\s*:/gim, '$1subtitle:'],
  [/^(\s*)sous_titre\s*:/gim, '$1subtitle:'],
  [/^(\s*)finalité\s*:/gim, '$1finalite:'],
  [/^(\s*)matériel\s*:/gim, '$1materiel:'],
  [/^(\s*)déroulement\s*:/gim, '$1deroulement:'],
  [/^(\s*)critères\s+de\s+réussite\s*:/gim, '$1criteres_reussite:'],
  [/^(\s*)critere\s+de\s+reussite\s*:/gim, '$1criteres_reussite:'],
  [/^(\s*)consignes\s+joueurs\s*:/gim, '$1consignes_joueurs:'],
  [/^(\s*)points\s+coach\s*:/gim, '$1points_coach:'],
  [/^(\s*)erreurs\s+fréquentes\s*:/gim, '$1erreurs_frequentes:'],
  [/^(\s*)corrections\s+possibles\s*:/gim, '$1corrections_possibles:'],
]

const INLINE_FIELD_KEYS = [
  'title',
  'titre',
  'subtitle',
  'sous-titre',
  'content',
  'table',
  'variant',
  'numero',
  'finalite',
  'objectif',
  'organisation',
  'materiel',
  'deroulement',
  'consignes_joueurs',
  'points_coach',
  'criteres_reussite',
  'variables_simplification',
  'variables_complexification',
  'evolution_1',
  'evolution_2',
  'transfert_match',
  'erreurs_frequentes',
  'corrections_possibles',
  'court',
  'intent',
  'players',
  'arrows',
  'notes',
]

function expandInlineFields(source: string) {
  const keyPattern = INLINE_FIELD_KEYS.map((key) => key.replace(/[-_]/g, '[-_ ]?')).join('|')
  const fieldPattern = new RegExp(
    `\\b(${keyPattern})\\s*:\\s*([\\s\\S]*?)(?=\\s+(?:${keyPattern})\\s*:|\\s*:::\\s*$|$)`,
    'gi'
  )
  const lines: string[] = []
  let match: RegExpExecArray | null

  while ((match = fieldPattern.exec(source)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, '_')
    const value = match[2].trim()
    if (key && value) lines.push(`${key}: ${value}`)
  }

  return lines
}

function expandInlineBcvbBlocks(source: string) {
  const blockPattern = /(?:(?<=^)|(?<=\n))(?:::)?(bcvb-[a-z0-9_-]+)\s+([^\n]*?(?:title|titre|content|numero|court|intent|players|arrows)\s*:[^\n]*?)(?:\s*:::)?(?=\n|$)/gim

  return source.replace(blockPattern, (_match, type: string, body: string) => {
    const fields = expandInlineFields(body)
    if (fields.length === 0) return _match

    return `:::${type.toLowerCase()}\n${fields.join('\n')}\n:::`
  })
}

function normalizeObviousSyntax(source: string) {
  let normalized = source.replace(/\r\n/g, '\n')

  normalized = normalized
    .replace(/^:{1,2}(bcvb-[a-z0-9_-]+)\s*$/gim, ':::$1')
    .replace(/^:::\s+bcvb-/gim, ':::bcvb-')

  normalized = expandInlineBcvbBlocks(normalized)

  for (const [pattern, replacement] of FIELD_ALIASES) {
    normalized = normalized.replace(pattern, replacement)
  }

  return normalized
}

export function normalizeBCVBRichMarkdown(source: string): RichMarkdownNormalizationResult {
  return normalizeRichMarkdown(normalizeObviousSyntax(source))
}
