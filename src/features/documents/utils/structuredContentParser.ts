import {
  parseMarkdownTable,
  type ParsedMarkdownTable,
} from './parseMarkdownTable'

export type StructuredSegment =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'callout'; title: string; text: string }

function isSeparatorRow(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
}

function pipeCount(line: string) {
  return (line.match(/\|/g) ?? []).length
}

function isPipeTableRow(line: string) {
  const trimmed = line.trim()
  if (!trimmed || /^>/.test(trimmed)) return false
  return pipeCount(trimmed) >= 2 && trimmed.split('|').filter((cell) => cell.trim()).length >= 2
}

function isLikelyTableStart(lines: string[], index: number) {
  const line = lines[index]
  const next = lines[index + 1]
  const after = lines[index + 2]

  if (!isPipeTableRow(line) || !next) return false
  if (isSeparatorRow(next)) return true
  if (isPipeTableRow(next) && after && (isPipeTableRow(after) || isSeparatorRow(after))) return true

  return false
}

function normalizeTableLines(lines: string[]) {
  const clean = lines.map((line) => line.trim()).filter(Boolean)
  if (clean.length < 2) return clean
  if (isSeparatorRow(clean[1])) return clean

  const headerCellCount = clean[0].replace(/^\||\|$/g, '').split('|').length
  const separator = Array.from({ length: headerCellCount }, () => '---').join(' | ')

  return [clean[0], separator, ...clean.slice(1)]
}

function parseTableFromLines(lines: string[]): ParsedMarkdownTable | null {
  return parseMarkdownTable(normalizeTableLines(lines))
}

function stripFieldPrefix(line: string) {
  return line
    .replace(/^(content|table|texte)\s*:\s*/i, '')
    .replace(/^["'`]+|["'`]+$/g, '')
    .trim()
}

export function parseStructuredContent(source: string): StructuredSegment[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const segments: StructuredSegment[] = []
  let index = 0

  while (index < lines.length) {
    const rawLine = lines[index]
    const line = stripFieldPrefix(rawLine)

    if (!line || /^:{1,3}$/.test(line) || /^bcvb-[a-z0-9_-]+/i.test(line)) {
      index += 1
      continue
    }

    if (isLikelyTableStart(lines.map(stripFieldPrefix), index)) {
      const tableLines: string[] = []

      while (index < lines.length) {
        const tableLine = stripFieldPrefix(lines[index])
        if (!isPipeTableRow(tableLine) && !isSeparatorRow(tableLine)) break
        tableLines.push(tableLine)
        index += 1
      }

      const table = parseTableFromLines(tableLines)
      if (table) {
        segments.push({ type: 'table', headers: table.headers, rows: table.rows })
        continue
      }
    }

    if (/^#{1,4}\s+/.test(line)) {
      const level = line.match(/^#+/)?.[0].length ?? 2
      segments.push({ type: 'heading', level, text: line.replace(/^#{1,4}\s+/, '') })
      index += 1
      continue
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = []
      while (index < lines.length && /^[-*]\s+/.test(stripFieldPrefix(lines[index]))) {
        items.push(stripFieldPrefix(lines[index]).replace(/^[-*]\s+/, ''))
        index += 1
      }
      segments.push({ type: 'list', items })
      continue
    }

    if (/^>\s+/.test(line)) {
      segments.push({ type: 'quote', text: line.replace(/^>\s+/, '') })
      index += 1
      continue
    }

    const calloutMatch = /^(À retenir|A retenir|Point de vigilance|Repère coach|Critère de réussite|Évolution|Transfert)\s*:\s*(.+)$/i.exec(line)
    if (calloutMatch) {
      segments.push({
        type: 'callout',
        title: calloutMatch[1],
        text: calloutMatch[2],
      })
      index += 1
      continue
    }

    const paragraphLines = [line]
    index += 1

    while (
      index < lines.length &&
      stripFieldPrefix(lines[index]) &&
      !/^#{1,4}\s+/.test(stripFieldPrefix(lines[index])) &&
      !/^[-*]\s+/.test(stripFieldPrefix(lines[index])) &&
      !/^>\s+/.test(stripFieldPrefix(lines[index])) &&
      !isLikelyTableStart(lines.map(stripFieldPrefix), index)
    ) {
      paragraphLines.push(stripFieldPrefix(lines[index]))
      index += 1
    }

    segments.push({ type: 'paragraph', text: paragraphLines.join('\n') })
  }

  return segments
}

