import { extractMarkdownTablesFromText } from './parseMarkdownTable'

function serializeTable(headers: string[], rows: string[][]) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${headers.map((_, index) => row[index] ?? '').join(' | ')} |`),
  ].join('\n')
}

function serializeYamlList(values: string[]) {
  return values.map((value) => `  - ${value}`).join('\n')
}

function serializeYamlRows(rows: string[][]) {
  return rows
    .map((row) => `  - ${row.map((cell) => `"${cell.replace(/"/g, '\\"')}"`).join(', ')}`)
    .join('\n')
}

function isInsideTypedTable(contentBefore: string) {
  const lastOpen = contentBefore.lastIndexOf(':::bcvb-')
  const lastClose = contentBefore.lastIndexOf(':::')
  if (lastOpen < 0) return false
  if (lastClose > lastOpen) return false
  return /:::bcvb-(table|planning-table|progression|session-template|evaluation-grid|cycle|microcycle)/i.test(
    contentBefore.slice(lastOpen)
  )
}

export function normalizeRawMarkdownTables(content: string): string {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  let index = 0

  while (index < lines.length) {
    const remaining = lines.slice(index).join('\n')
    const { tables } = extractMarkdownTablesFromText(remaining)
    const firstTable = tables[0]

    if (!firstTable) {
      output.push(lines[index])
      index += 1
      continue
    }

    const currentLine = lines[index]
    const looksLikeTable = currentLine.includes('|') && currentLine.split('|').filter((cell) => cell.trim()).length >= 2

    if (!looksLikeTable || isInsideTypedTable(output.join('\n'))) {
      output.push(currentLine)
      index += 1
      continue
    }

    const tableLines: string[] = []
    while (
      index < lines.length &&
      lines[index].includes('|') &&
      lines[index].split('|').filter((cell) => cell.trim()).length >= 2
    ) {
      tableLines.push(lines[index])
      index += 1
    }

    const parsed = extractMarkdownTablesFromText(tableLines.join('\n')).tables[0]
    if (!parsed) {
      output.push(
        ':::bcvb-warning',
        'title: Tableau à reconstruire',
        'content: Tableau source détecté mais structure insuffisante. Recommandation : reconstruire via amélioration forte.',
        ':::'
      )
      continue
    }

    output.push(
      ':::bcvb-table',
      'title: Tableau détecté',
      'variant: summary',
      'columns:',
      serializeYamlList(parsed.headers),
      'rows:',
      serializeYamlRows(parsed.rows),
      'table:',
      serializeTable(parsed.headers, parsed.rows),
      ':::'
    )
  }

  return output.join('\n')
}
