import type { TrainingSessionV2 } from './sessionModels'
import { analyzeSessionQuality } from './sessionQuality'

type SessionQualityPanelProps = {
  session: TrainingSessionV2
  onAutoFix: (mode?: string) => void
  onBuildUpgradePrompt?: () => void
  onExportPdf?: () => void
}

export function SessionQualityPanel({ session, onAutoFix, onBuildUpgradePrompt, onExportPdf }: SessionQualityPanelProps) {
  const report = analyzeSessionQuality(session)

  return (
    <section className="session-quality-panel">
      <p className="bcvb-eyebrow">Qualité séance</p>
      <div className="session-quality-score">{report.score}</div>
      <strong>{report.status}</strong>
      {report.warnings.map((warning) => <p className="session-warning" key={warning}>{warning}</p>)}
      <ul>
        {report.actions.slice(0, 5).map((action) => <li key={action}>{action}</li>)}
      </ul>
      <div className="session-quality-actions">
        <button type="button" onClick={() => onAutoFix('general')}>Compléter infos générales</button>
        <button type="button" onClick={() => onAutoFix('situations')}>Enrichir situations</button>
        <button type="button" onClick={() => onAutoFix('criteria')}>Ajouter critères quantifiables</button>
        <button type="button" onClick={() => onAutoFix('bcvb')}>Adapter aux valeurs BCVB</button>
        <button type="button" onClick={() => onAutoFix('courts')}>Régénérer terrains</button>
        <button type="button" onClick={onExportPdf || (() => window.print())}>Exporter séance PDF</button>
        {onBuildUpgradePrompt && <button type="button" onClick={onBuildUpgradePrompt}>Améliorer automatiquement la séance</button>}
      </div>
    </section>
  )
}
