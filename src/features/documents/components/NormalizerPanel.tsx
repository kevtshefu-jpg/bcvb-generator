import { useMemo } from 'react'
import { normalizeBCVBRichMarkdown } from '../utils/normalizeBCVBRichMarkdown'

type NormalizerPanelProps = {
  content: string
  onNormalized: (normalized: string) => void
}

export function NormalizerPanel({ content, onNormalized }: NormalizerPanelProps) {
  const result = useMemo(() => normalizeBCVBRichMarkdown(content), [content])
  const hasContent = content.trim().length > 0

  function handleNormalize() {
    if (!hasContent) return
    onNormalized(result.content)
  }

  return (
    <aside className="bcvb-normalizer-panel">
      <div>
        <p>Normalisation BCVB Rich Markdown</p>
        <strong>Corrige la syntaxe évidente avant analyse et sauvegarde.</strong>
      </div>

      <div className="bcvb-normalizer-panel__stats">
        <span>{result.report.convertedHeroes} hero</span>
        <span>{result.report.convertedSituations} situations</span>
        <span>{result.report.convertedDiagrams} diagrammes</span>
        <span>{result.report.removedIsolatedClosures} fermetures isolées</span>
      </div>

      <button type="button" onClick={handleNormalize} disabled={!hasContent}>
        Nettoyer / normaliser le document
      </button>
    </aside>
  )
}
