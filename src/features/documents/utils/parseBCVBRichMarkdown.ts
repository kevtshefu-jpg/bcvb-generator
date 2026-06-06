import { normalizeBCVBRichMarkdown } from './normalizeBCVBRichMarkdown'
import {
  extractMarkdownTables,
  type ParsedMarkdownTable,
} from './parseMarkdownTable'

export type BCVBParsedBlock = {
  id: string
  type: string
  raw: string
  fields: Record<string, string>
  tables: ParsedMarkdownTable[]
}

const SUPPORTED_BCVB_BLOCKS = new Set([
  'bcvb-hero',
  'bcvb-identity',
  'bcvb-section',
  'bcvb-chapter',
  'bcvb-planning-table',
  'bcvb-table',
  'bcvb-progression',
  'bcvb-session-template',
  'bcvb-evaluation-grid',
  'bcvb-situation',
  'bcvb-exercise-card',
  'bcvb-diagram',
  'bcvb-annex',
  'bcvb-conclusion',
  'bcvb-summary',
  'bcvb-cycle',
  'bcvb-microcycle',
  'bcvb-callout',
  'bcvb-warning',
  'bcvb-poster',
  'bcvb-poster-summary',
])

function normalizeKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-/g, '_')
}

export function parseBlockFields(raw: string) {
  const fields: Record<string, string> = {}
  const lines = raw.split('\n')
  let activeKey: string | null = null

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const match = /^([a-zA-ZÀ-ÿ0-9_ -]+)\s*:\s*(.*)$/.exec(line.trim())

    if (match) {
      activeKey = normalizeKey(match[1])
      fields[activeKey] = match[2].trim()
      continue
    }

    if (activeKey && line.trim()) {
      fields[activeKey] = `${fields[activeKey]}\n${line.trim()}`
    }
  }

  return fields
}

function inferBlockType(type: string, raw: string, fields: Record<string, string>) {
  const normalizedRaw = raw.toLowerCase()

  if (
    fields.court ||
    fields.intent ||
    fields.players ||
    fields.arrows ||
    fields.ball ||
    (/court\s*:/.test(normalizedRaw) && /players\s*:/.test(normalizedRaw))
  ) {
    return 'bcvb-diagram'
  }

  if (
    fields.numero ||
    (fields.finalite && fields.objectif) ||
    (fields.objectif && fields.organisation && fields.deroulement)
  ) {
    return 'bcvb-situation'
  }

  if (!SUPPORTED_BCVB_BLOCKS.has(type)) return 'bcvb-unknown'

  return type
}

function makeBlock(type: string, raw: string, index: number): BCVBParsedBlock {
  const fields = parseBlockFields(raw)
  const cleanedType = inferBlockType(type, raw, fields)

  return {
    id: `${cleanedType}-${index}`,
    type: cleanedType,
    raw,
    fields,
    tables: extractMarkdownTables(raw),
  }
}

function stripTechnicalNoise(raw: string) {
  return raw
    .replace(/^:::\s*bcvb-[a-z0-9_-]+.*$/gim, '')
    .replace(/^:::\s*$/gim, '')
    .replace(/\bbcvb-[a-z0-9_-]+\b/gim, '')
    .trim()
}

export function parseBCVBRichMarkdown(source: string): BCVBParsedBlock[] {
  const normalized = normalizeBCVBRichMarkdown(source).content
  const blocks: BCVBParsedBlock[] = []
  const pattern = /^:::\s*(bcvb-[a-z0-9_-]+)[^\n]*\n([\s\S]*?)\n:::/gim
  let cursor = 0
  let match: RegExpExecArray | null
  let index = 0

  while ((match = pattern.exec(normalized)) !== null) {
    const before = stripTechnicalNoise(normalized.slice(cursor, match.index))
    if (before) {
      blocks.push(makeBlock('bcvb-markdown', before, index))
      index += 1
    }

    blocks.push(makeBlock(match[1].toLowerCase(), match[2].trim(), index))
    index += 1
    cursor = match.index + match[0].length
  }

  const after = stripTechnicalNoise(normalized.slice(cursor))
  if (after) blocks.push(makeBlock('bcvb-markdown', after, index))

  return blocks
}
