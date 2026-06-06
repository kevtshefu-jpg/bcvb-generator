import type { DocumentQualityReport } from '../../../utils/documentQuality'

type QualityActionPanelProps = {
  report: DocumentQualityReport | null
  onAutoFixFormat: () => void
  onBuildCorrectionPrompt: (instruction: string) => void
  onImproveToEditorLevel?: () => void
  onStrongImprove?: () => void
  onTargetedBoost?: (issueKey: string) => void
  onRerun: () => void
}

const SCORE_TARGET = 95

function getStatus(report: DocumentQualityReport | null) {
  if (!report) return 'En attente'
  if (report.score < 85) return 'Non publiable'
  if (report.score < SCORE_TARGET) return 'Publiable après correction'
  return 'Qualité éditeur'
}

export function QualityActionPanel({
  report,
  onAutoFixFormat,
  onBuildCorrectionPrompt,
  onImproveToEditorLevel,
  onStrongImprove,
  onTargetedBoost,
  onRerun,
}: QualityActionPanelProps) {
  const criticalChecks = report?.checks.filter((check) => check.status === 'fail').slice(0, 8) ?? []
  const warningChecks = report?.checks.filter((check) => check.status === 'warning').slice(0, 8) ?? []

  return (
    <section className="ai-studio-card">
      <div className="ai-studio-card__header">
        <p className="ai-studio-kicker">Étape 5</p>
        <h2>Contrôle qualité actionnable</h2>
        <p>Score, blocages et actions de correction sont regroupés ici.</p>
      </div>

      <div className="ai-quality-score">
        <strong>{report ? `${report.score}/100` : '--/100'}</strong>
        <span>{getStatus(report)}</span>
        <small>Objectif qualité éditeur : {SCORE_TARGET}/100</small>
        <small>Objectif : gagner 8 à 20 points en une passe, sans perdre la qualité éditoriale.</small>
      </div>

      {report && (
        <>
          <div className="ai-quality-counters">
            <span>Tableaux · {report.counts.tables}</span>
            <span>Situations · {report.counts.situations}</span>
            <span>Schémas · {report.counts.diagrams}</span>
            <span>Blocs BCVB · {report.counts.richBlocks}</span>
            <span>Balises brutes · {report.counts.rawTechnicalFieldsVisible}</span>
          </div>

          <div className="ai-quality-grid">
            <div>
              <h3>Erreurs critiques</h3>
              {criticalChecks.length === 0 ? (
                <p>Aucune erreur bloquante détectée.</p>
              ) : (
                <ul>
                  {criticalChecks.map((check) => (
                    <li key={check.label}><strong>{check.label}</strong> · {check.detail}</li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <h3>Corrections recommandées</h3>
              {warningChecks.length === 0 ? (
                <p>Aucune correction prioritaire.</p>
              ) : (
                <ul>
                  {warningChecks.map((check) => (
                    <li key={check.label}><strong>{check.label}</strong> · {check.detail}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <div className="ai-studio-actions">
        <button type="button" className="ai-studio-primary" onClick={onStrongImprove} disabled={!report}>
          Améliorer fortement le document
        </button>
        <button type="button" className="ai-studio-primary" onClick={onImproveToEditorLevel} disabled={!report}>
          Améliorer jusqu’au niveau éditeur
        </button>
        <button type="button" className="ai-studio-secondary" onClick={onAutoFixFormat}>
          Corriger automatiquement le format
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onTargetedBoost?.('situations_missing')} disabled={!report}>
          Ajouter situations manquantes
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onTargetedBoost?.('diagrams_missing')} disabled={!report}>
          Régénérer les schémas terrain
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onTargetedBoost?.('planning_weak')} disabled={!report}>
          Renforcer la planification
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onTargetedBoost?.('evaluation_missing')} disabled={!report}>
          Ajouter grilles & synthèse
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onTargetedBoost?.('raw_tables')} disabled={!report}>
          Nettoyer tableaux
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onBuildCorrectionPrompt('Convertis tous les tableaux bruts en blocs :::bcvb-table typés.')}>
          Convertir les tableaux bruts
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onBuildCorrectionPrompt('Ajoute les blocs BCVB manquants sans changer le fond validé.')}>
          Ajouter les blocs manquants
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onBuildCorrectionPrompt('Régénère les schémas manquants en blocs :::bcvb-diagram valides.')}>
          Régénérer les schémas manquants
        </button>
        <button type="button" className="ai-studio-secondary" onClick={() => onBuildCorrectionPrompt('Ajoute une grille d’évaluation joueur et une synthèse coach en blocs typés.')}>
          Ajouter grille & synthèse
        </button>
        <button type="button" className="ai-studio-secondary" onClick={onRerun}>
          Relancer le contrôle qualité
        </button>
      </div>
    </section>
  )
}
