import { normalizeBCVBRichMarkdown } from './normalizeBCVBRichMarkdown'

export type BcvbBlockNormalizationResult = {
  content: string
  warnings: string[]
}

export function normalizeBcvbBlocks(content: string): BcvbBlockNormalizationResult {
  const warnings: string[] = []
  const normalized = normalizeBCVBRichMarkdown(content).content
  const lines = normalized.split('\n')
  const output: string[] = []
  let insideTypedBlock = false

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim()

    if (/^:::\s*bcvb-[a-z0-9_-]+/i.test(trimmed)) {
      if (insideTypedBlock) {
        output.push(':::')
        warnings.push(`Bloc précédent fermé automatiquement avant la ligne ${index + 1}.`)
      }
      insideTypedBlock = true
      output.push(line)
      continue
    }

    if (trimmed === ':::') {
      if (insideTypedBlock) {
        insideTypedBlock = false
        output.push(line)
      } else {
        warnings.push(`Fermeture isolée supprimée ligne ${index + 1}.`)
      }
      continue
    }

    if (trimmed === ':::bcvb-table' || trimmed === ':::bcvb-section') {
      warnings.push(`Bloc vide potentiel ligne ${index + 1}.`)
    }

    output.push(line)
  }

  if (insideTypedBlock) {
    output.push(':::')
    warnings.push('Bloc final fermé automatiquement.')
  }

  return {
    content: output.join('\n'),
    warnings,
  }
}
