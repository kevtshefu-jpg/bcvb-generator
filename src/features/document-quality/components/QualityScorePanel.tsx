import type { QualityScore } from "../types/quality.types";
import { statusLabel } from "../services/qualityRules";
import QualityBreakdown from "./QualityBreakdown";
import QualityRecommendations from "./QualityRecommendations";

type QualityScorePanelProps = {
  score: QualityScore;
  onImprove: () => void;
};

export default function QualityScorePanel({ score, onImprove }: QualityScorePanelProps) {
  const criticalWarnings = score.warnings.filter((warning) => warning.level === "critical");

  return (
    <section className={`quality-score-panel quality-score-panel--${score.status} no-print`}>
      <header>
        <div>
          <p className="bcvb-eyebrow">Score qualité</p>
          <h2>{score.globalScore}/100</h2>
          <span>{statusLabel(score.status)}</span>
        </div>
        <button type="button" onClick={onImprove}>
          Améliorer fortement
        </button>
      </header>

      <QualityBreakdown score={score} />

      <div className="quality-warning-list">
        <strong>Warnings</strong>
        {score.warnings.length === 0 ? (
          <span>Aucun warning détecté.</span>
        ) : (
          score.warnings.map((warning) => (
            <span className={`quality-warning quality-warning--${warning.level}`} key={warning.id}>
              {warning.message}
            </span>
          ))
        )}
      </div>

      {criticalWarnings.length > 0 && (
        <p className="quality-critical-note">Un warning critique empêche le statut premium tant qu’il n’est pas résolu.</p>
      )}

      <QualityRecommendations score={score} />
    </section>
  );
}
