import type { QualityIssue } from '../quality/buildQualityBoostPrompt'
import {
  IMPROVEMENT_MODE_LABELS,
  type ImprovementMode,
} from '../editorial/elevateDocumentQuality'

type QualityBoostPanelProps = {
  score: number | null
  scoreTarget?: number
  issues: QualityIssue[]
  prompt: string
  selectedMode: ImprovementMode
  lastGain?: {
    previousScore: number
    newScore: number
    addedBlocks: number
    convertedTables: number
    addedSituations: number
    addedDiagrams: number
    reinforcedSections: number
  } | null
  onGenerate: () => void
  onGenerateMode: (mode: ImprovementMode) => void
  onCopy: () => Promise<void> | void
  onPromptChange: (prompt: string) => void
}

export function QualityBoostPanel({
  score,
  scoreTarget = 92,
  issues,
  prompt,
  selectedMode,
  lastGain,
  onGenerate,
  onGenerateMode,
  onCopy,
  onPromptChange,
}: QualityBoostPanelProps) {
  const criticalCount = issues.filter((issue) => issue.severity === 'critical').length
  const gainNeeded = score !== null ? Math.max(0, scoreTarget - score) : null

  return (
    <section className="ai-studio-card ai-quality-boost-card">
      <div className="ai-studio-card__header">
        <p className="ai-studio-kicker">editorialElevationEngine</p>
        <h2>Rehausser au niveau publication BCVB</h2>
        <p>
          Transforme les écarts qualité en élévation éditoriale ambitieuse, pas en micro-correction.
        </p>
      </div>

      <div className="ai-quality-boost-metrics">
        <span>
          <strong>{score !== null ? `${score}/100` : '--/100'}</strong>
          Score actuel
        </span>
        <span className="is-target">
          <strong>{scoreTarget}/100</strong>
          Objectif qualité éditeur
        </span>
        <span className={criticalCount > 0 ? 'is-critical' : ''}>
          <strong>{criticalCount}</strong>
          Écart{criticalCount > 1 ? 's' : ''} critique{criticalCount > 1 ? 's' : ''}
        </span>
        <span>
          <strong>{gainNeeded !== null ? `+${gainNeeded}` : '--'}</strong>
          Gain nécessaire
        </span>
      </div>

      <div className="ai-studio-actions">
        <button type="button" className="ai-studio-primary" onClick={onGenerate}>
          Rehausser au niveau publication BCVB
        </button>
        {(['light_fix', 'editorial_elevation', 'publication_rebuild'] as ImprovementMode[]).map((mode) => (
          <button
            type="button"
            className={mode === selectedMode ? 'ai-studio-primary' : 'ai-studio-secondary'}
            key={mode}
            onClick={() => onGenerateMode(mode)}
          >
            {IMPROVEMENT_MODE_LABELS[mode]}
          </button>
        ))}
        <button type="button" className="ai-studio-secondary" onClick={onCopy} disabled={!prompt.trim()}>
          Copier le cadre
        </button>
      </div>

      {lastGain && (
        <div className="ai-quality-gain">
          <span><strong>Ancien score</strong>{lastGain.previousScore}</span>
          <span><strong>Nouveau score</strong>{lastGain.newScore}</span>
          <span><strong>Gain</strong>+{lastGain.newScore - lastGain.previousScore}</span>
          <span><strong>Blocs ajoutés</strong>{lastGain.addedBlocks}</span>
          <span><strong>Tableaux convertis</strong>{lastGain.convertedTables}</span>
          <span><strong>Situations ajoutées</strong>{lastGain.addedSituations}</span>
          <span><strong>Diagrammes ajoutés</strong>{lastGain.addedDiagrams}</span>
          <span><strong>Sections renforcées</strong>{lastGain.reinforcedSections}</span>
        </div>
      )}

      {lastGain && lastGain.newScore - lastGain.previousScore < 3 && (
        <p className="ai-studio-alert ai-studio-alert--blocked">
          Gain insuffisant. Le document nécessite une reconstruction éditoriale ciblée :
          reconstruction ciblée, ajout des blocs manquants, régénération situations/schémas
          et refonte de la planification.
        </p>
      )}

      {issues.length > 0 && (
        <ul className="ai-quality-boost-issues">
          {issues.slice(0, 8).map((issue) => (
            <li key={`${issue.key}-${issue.label}`} className={`is-${issue.severity}`}>
              <strong>{issue.label}</strong>
              <span>{issue.message}</span>
            </li>
          ))}
        </ul>
      )}

      <label className="ai-studio-full-field">
        <span>Cadre d’amélioration</span>
        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="Le cadre d’amélioration sera préparé ici."
        />
      </label>
    </section>
  )
}
