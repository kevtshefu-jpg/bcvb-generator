export type ParsedMarkdownTable = {
  headers: string[]
  rows: string[][]
}

function isSeparatorRow(line: string) {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line)
}

function isTableLikeRow(line: string) {
  return line.includes('|') && line.split('|').filter((cell) => cell.trim()).length >= 2
}

function isLikelyTableStart(lines: string[], index: number) {
  const line = lines[index]
  const next = lines[index + 1]
  const after = lines[index + 2]

  if (!line || !next || !isTableLikeRow(line)) return false
  if (isSeparatorRow(next)) return true
  return isTableLikeRow(next) && Boolean(after && (isSeparatorRow(after) || isTableLikeRow(after)))
}

function readCells(line: string) {
  return line
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((cell) => cell.trim())
}

export function parseMarkdownTable(raw: string | string[]): ParsedMarkdownTable | null {
  const sourceLines = Array.isArray(raw) ? raw : raw.replace(/\r\n/g, '\n').split('\n')
  const cleanLines = sourceLines.map((line) => line.trim()).filter(Boolean)
  if (cleanLines.length < 2) return null

  const normalizedLines = isSeparatorRow(cleanLines[1])
    ? cleanLines
    : [
        cleanLines[0],
        cleanLines[0]
          .replace(/^\||\|$/g, '')
          .split('|')
          .map(() => '---')
          .join('|'),
        ...cleanLines.slice(1),
      ]

  const headers = readCells(normalizedLines[0])
  const rows = normalizedLines
    .slice(2)
    .filter(isTableLikeRow)
    .map(readCells)
    .filter((row) => row.length > 0)

  if (headers.length < 2 || rows.length === 0) return null

  return { headers, rows }
}

export function extractMarkdownTables(source: string): ParsedMarkdownTable[] {
  return extractMarkdownTablesFromText(source).tables
}

export function extractMarkdownTablesFromText(text: string): {
  before: string
  tables: ParsedMarkdownTable[]
  after: string
} {
  const lines = text.split('\n')
  const tables: ParsedMarkdownTable[] = []
  const beforeLines: string[] = []
  const afterLines: string[] = []
  let foundFirstTable = false
  let index = 0

  while (index < lines.length) {
    if (isLikelyTableStart(lines, index)) {
      const tableLines: string[] = []

      while (index < lines.length && (isTableLikeRow(lines[index]) || isSeparatorRow(lines[index]))) {
        tableLines.push(lines[index])
        index += 1
      }

      const table = parseMarkdownTable(tableLines)
      if (table) tables.push(table)
      foundFirstTable = true
      continue
    }

    if (foundFirstTable) {
      afterLines.push(lines[index])
    } else {
      beforeLines.push(lines[index])
    }
    index += 1
  }

  return {
    before: beforeLines.join('\n').trim(),
    tables,
    after: afterLines.join('\n').trim(),
  }
}
