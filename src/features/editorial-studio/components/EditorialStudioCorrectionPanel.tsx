type EditorialCorrectionMode = 'micro' | 'strong' | 'rebuild'

type EditorialCorrectionAction = {
  id: string
  description: string
  expectedGain: number
}

type EditorialCorrectionPlan = {
  riskLevel: string
  actions: EditorialCorrectionAction[]
}

type EditorialCorrectionScore = {
  globalScore?: number
}

type EditorialCorrectionReview = {
  mode: EditorialCorrectionMode
  before: string
  result: {
    correctedSource: string
    changeLog: string[]
    previousScore?: EditorialCorrectionScore
    newScore?: EditorialCorrectionScore
  }
}

type EditorialStudioCorrectionPanelProps = {
  currentScore: number
  targetScore: number
  correctionPlan: EditorialCorrectionPlan
  correctionRunning: EditorialCorrectionMode | null
  correctionReview: EditorialCorrectionReview | null
  modeLabels: Record<EditorialCorrectionMode, string>
  onTargetScoreChange: (score: number) => void
  onRunCorrection: (mode: EditorialCorrectionMode) => void
  onValidateCorrection: () => void
  onRestoreCorrection: () => void
}

export function EditorialStudioCorrectionPanel({
  currentScore,
  targetScore,
  correctionPlan,
  correctionRunning,
  correctionReview,
  modeLabels,
  onTargetScoreChange,
  onRunCorrection,
  onValidateCorrection,
  onRestoreCorrection,
}: EditorialStudioCorrectionPanelProps) {
  return (
    <section className="editorial-panel editorial-step-card editorial-assist-panel editorial-correction-panel">
      <header>
        <p className="bcvb-eyebrow">Correction contrôlée</p>
        <h2>Améliorer fortement sans perdre la source</h2>
      </header>

      <div className="editorial-correction-target">
        <div>
          <span>Score actuel</span>
          <strong>{currentScore}/100</strong>
        </div>
        <label>
          <span>Score visé</span>
          <input
            type="number"
            min={70}
            max={100}
            value={targetScore}
            onChange={(event) => onTargetScoreChange(Number(event.target.value))}
          />
        </label>
      </div>

      <div className="editorial-correction-safety">
        <article>
          <strong>Conservé</strong>
          <p>Source OCR, cadre de rédaction, notes admin, métadonnées et ancienne version locale.</p>
        </article>
        <article>
          <strong>Restructuré</strong>
          <p>Sections faibles, tableaux, identité BCVB, situations, export readiness.</p>
        </article>
        <article>
          <strong>Risque</strong>
          <p>{correctionPlan.riskLevel === 'medium' ? 'Réorganisation visible : relire avant validation.' : 'Faible : corrections ciblées.'}</p>
        </article>
      </div>

      <div className="editorial-correction-plan">
        <strong>Actions prévues</strong>
        {correctionPlan.actions.length > 0 ? (
          correctionPlan.actions.slice(0, 4).map((action) => (
            <span key={action.id}>
              {action.description} - +{action.expectedGain}
            </span>
          ))
        ) : (
          <span>Aucune correction automatique prioritaire. Relecture humaine conseillée.</span>
        )}
      </div>

      <div className="editorial-correction-levels">
        <button
          type="button"
          disabled={Boolean(correctionRunning)}
          onClick={() => onRunCorrection('micro')}
        >
          {correctionRunning === 'micro' ? 'Micro-correction...' : 'Micro-correction'}
        </button>
        <button
          type="button"
          disabled={Boolean(correctionRunning)}
          onClick={() => onRunCorrection('strong')}
        >
          {correctionRunning === 'strong' ? 'Amélioration...' : 'Amélioration forte'}
        </button>
        <button
          type="button"
          disabled={Boolean(correctionRunning)}
          onClick={() => onRunCorrection('rebuild')}
        >
          {correctionRunning === 'rebuild' ? 'Reconstruction...' : 'Reconstruction publication club'}
        </button>
      </div>

      {correctionReview ? (
        <div className="editorial-correction-result">
          <strong>{modeLabels[correctionReview.mode]} appliquée</strong>
          <div>
            <span>Avant {correctionReview.result.previousScore?.globalScore ?? currentScore}/100</span>
            <span>Après {correctionReview.result.newScore?.globalScore ?? currentScore}/100</span>
            <span>
              Gain +{Math.max(
                0,
                (correctionReview.result.newScore?.globalScore ?? 0) -
                  (correctionReview.result.previousScore?.globalScore ?? 0),
              )}
            </span>
          </div>
          <ul>
            {correctionReview.result.changeLog.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          <details>
            <summary>Comparer avant / après</summary>
            <div className="editorial-correction-diff">
              <pre>{correctionReview.before.slice(0, 1200)}</pre>
              <pre>{correctionReview.result.correctedSource.slice(0, 1200)}</pre>
            </div>
          </details>
          <div className="editorial-correction-result__actions">
            <button type="button" onClick={onValidateCorrection}>
              Valider
            </button>
            <button type="button" onClick={onRestoreCorrection}>
              Restaurer ancienne version
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
