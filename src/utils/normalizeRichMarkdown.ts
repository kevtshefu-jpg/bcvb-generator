export type RichMarkdownNormalizationReport = {
  convertedHeroes: number
  convertedSituations: number
  convertedDiagrams: number
  convertedIdentityBlocks: number
  removedIsolatedClosures: number
  ambiguousBlocks: number
}

export type RichMarkdownNormalizationResult = {
  content: string
  report: RichMarkdownNormalizationReport
}

const EMPTY_REPORT: RichMarkdownNormalizationReport = {
  convertedHeroes: 0,
  convertedSituations: 0,
  convertedDiagrams: 0,
  convertedIdentityBlocks: 0,
  removedIsolatedClosures: 0,
  ambiguousBlocks: 0,
}

function detectBlockType(source: string) {
  const normalized = source.toLowerCase()

  if (/court\s*:/.test(normalized) && /players\s*:/.test(normalized)) {
    return 'bcvb-diagram'
  }

  if (
    /numero\s*:/.test(normalized) &&
    /objectif\s*:/.test(normalized) &&
    /organisation\s*:/.test(normalized)
  ) {
    return 'bcvb-situation'
  }

  if (/title\s*:/.test(normalized) && /(subtitle|sous-titre|sous_titre)\s*:/.test(normalized)) {
    return 'bcvb-hero'
  }

  if (/title\s*:/.test(normalized) && /content\s*:/.test(normalized)) {
    return /conclusion|synthese|synthèse/.test(normalized)
      ? 'bcvb-conclusion'
      : 'bcvb-section'
  }

  return null
}

function bumpReport(report: RichMarkdownNormalizationReport, type: string | null) {
  if (type === 'bcvb-diagram') report.convertedDiagrams += 1
  else if (type === 'bcvb-situation') report.convertedSituations += 1
  else if (type === 'bcvb-hero') report.convertedHeroes += 1
  else if (type === 'bcvb-identity') report.convertedIdentityBlocks += 1
  else report.ambiguousBlocks += 1
}

export function normalizeRichMarkdown(source: string): RichMarkdownNormalizationResult {
  const report = { ...EMPTY_REPORT }
  const lines = source.replace(/\r\n/g, '\n').split('\n')
  const output: string[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    const trimmed = line.trim()

    if (/^:::\s*bcvb-[a-z0-9_-]+/i.test(trimmed)) {
      output.push(line)
      index += 1

      while (index < lines.length) {
        output.push(lines[index])
        if (lines[index].trim() === ':::') {
          index += 1
          break
        }
        index += 1
      }

      continue
    }

    if (trimmed === ':::') {
      const blockLines: string[] = []
      let cursor = index + 1

      while (cursor < lines.length && lines[cursor].trim() !== ':::') {
        blockLines.push(lines[cursor])
        cursor += 1
      }

      if (cursor < lines.length) {
        const blockContent = blockLines.join('\n').trim()
        const blockType = detectBlockType(blockContent)

        if (blockType && blockContent) {
          output.push(`:::${blockType}`)
          output.push(...blockLines)
          output.push(':::')
          bumpReport(report, blockType)
          index = cursor + 1
          continue
        }
      }

      report.removedIsolatedClosures += 1
      index += 1
      continue
    }

    if (/^(title|court|intent|players|ball|arrows|zones|notes)\s*:/i.test(trimmed)) {
      const diagramLines: string[] = []
      let cursor = index

      while (
        cursor < lines.length &&
        lines[cursor].trim() &&
        !/^:::/i.test(lines[cursor].trim()) &&
        !/^#{1,4}\s+/.test(lines[cursor].trim())
      ) {
        diagramLines.push(lines[cursor])
        cursor += 1
      }

      const diagramContent = diagramLines.join('\n')
      if (/court\s*:/i.test(diagramContent) && /players\s*:/i.test(diagramContent)) {
        output.push(':::bcvb-diagram')
        output.push(...diagramLines)
        output.push(':::')
        report.convertedDiagrams += 1
        index = cursor
        continue
      }
    }

    output.push(line)
    index += 1
  }

  return {
    content: output.join('\n').replace(/\n{4,}/g, '\n\n\n').trim(),
    report,
  }
}
