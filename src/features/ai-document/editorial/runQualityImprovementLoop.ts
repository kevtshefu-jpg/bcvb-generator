import { analyzeDocumentQuality } from '../../../utils/documentQuality'
import { generateWithAi } from '../ai/generateWithAi'
import type { AiProvider } from '../ai/types'
import { normalizeBCVBRichMarkdown } from '../../documents/utils/normalizeBCVBRichMarkdown'
import { buildEditorialElevationPrompt, type EditorialElevationInput } from './elevateDocumentQuality'
import { getQualityTarget } from './documentQualityTargets'
import { selectImprovementMode } from './selectImprovementMode'

export type QualityImprovementLoopInput = Omit<
  EditorialElevationInput,
  'qualityScore' | 'qualityIssues' | 'mode'
> & {
  provider: AiProvider
}

export type QualityImprovementLoopResult = {
  document: string
  iterations: number
  initialScore: number
  finalScore: number
  stoppedReason: string
}

export async function runQualityImprovementLoop(
  input: QualityImprovementLoopInput
): Promise<QualityImprovementLoopResult> {
  const target = getQualityTarget(input.documentFamily)
  let document = input.document
  let weakGainCount = 0
  let previousScore = analyzeDocumentQuality({
    content: document,
    documentType: input.documentFamily,
    category: input.category,
  }).score
  const initialScore = previousScore

  for (let iteration = 1; iteration <= 3; iteration += 1) {
    const quality = analyzeDocumentQuality({
      content: document,
      documentType: input.documentFamily,
      category: input.category,
    })

    if (quality.score >= target.minScore) {
      return {
        document,
        iterations: iteration - 1,
        initialScore,
        finalScore: quality.score,
        stoppedReason: 'Seuil publiable atteint.',
      }
    }

    const mode = selectImprovementMode(quality.score)
    const prompt = buildEditorialElevationPrompt({
      ...input,
      document,
      qualityScore: quality.score,
      mode,
      qualityIssues: quality.checks
        .filter((check) => check.status !== 'pass')
        .map((check) => `${check.label}: ${check.detail}`),
    })

    const improved = await generateWithAi({
      provider: input.provider,
      role: 'normalizer',
      prompt,
      system: 'Tu es le directeur éditorial technique du BCVB. Réponds uniquement avec le document BCVB Rich Markdown corrigé.',
      maxTokens: 12000,
      temperature: 0.35,
    })

    const normalized = normalizeBCVBRichMarkdown(improved.text).content
    const newQuality = analyzeDocumentQuality({
      content: normalized,
      documentType: input.documentFamily,
      category: input.category,
    })
    const gain = newQuality.score - previousScore

    if (gain < 3) weakGainCount += 1
    if (weakGainCount >= 2) {
      return {
        document: normalized,
        iterations: iteration,
        initialScore,
        finalScore: newQuality.score,
        stoppedReason: 'Arrêt : gain inférieur à 3 points pendant deux itérations.',
      }
    }

    document = normalized
    previousScore = newQuality.score
  }

  const finalScore = analyzeDocumentQuality({
    content: document,
    documentType: input.documentFamily,
    category: input.category,
  }).score

  return {
    document,
    iterations: 3,
    initialScore,
    finalScore,
    stoppedReason: 'Arrêt : maximum 3 itérations atteint.',
  }
}
