import type { QualityScore } from "../types/quality.types";
import { statusLabel } from "../services/qualityRules";
import { buildPublicationChecklist } from "../services/qualityDecisionView";
import QualityBreakdown from "./QualityBreakdown";
import QualityRecommendations from "./QualityRecommendations";

type QualityScorePanelProps = {
  score: QualityScore;
  onImprove: () => void;
};

export default function QualityScorePanel({ score, onImprove }: QualityScorePanelProps) {
  const criticalWarnings = score.warnings.filter((warning) => warning.level === "critical");
  const checklist = buildPublicationChecklist(score);

  return (
    <section className={`quality-score-panel quality-score-panel--${score.status} no-print`}>
      <header>
        <div>
          <p className="bcvb-eyebrow">Score qualité</p>
          <h2>{score.globalScore}/100</h2>
          <span className={`quality-publication-badge quality-publication-badge--${score.status}`}>
            {statusLabel(score.status)}
          </span>
        </div>
        <button type="button" onClick={onImprove}>
          Améliorer fortement
        </button>
      </header>

      <div className="quality-decision-summary">
        <strong>Aide à la décision</strong>
        <p>
          {criticalWarnings.length > 0
            ? "Des warnings critiques bloquent une publication sereine. Corrige-les avant export."
            : score.globalScore >= 85
              ? "Le document peut passer en relecture humaine puis export."
              : "Le score indique les priorités à corriger avant publication."}
        </p>
      </div>

      <QualityBreakdown score={score} />

      <section className="quality-evidence-list">
        <strong>Preuves métier détectées</strong>
        {score.evidence.length === 0 ? (
          <span>Aucune exigence spécifique à cette famille documentaire.</span>
        ) : (
          score.evidence.map((item) => (
            <article className={item.passed ? "is-done" : "is-missing"} key={item.id}>
              <span>{item.passed ? "OK" : "À vérifier"}</span>
              <div>
                <strong>{item.label}</strong>
                <p>{item.detail}</p>
              </div>
            </article>
          ))
        )}
      </section>

      <div className="quality-warning-list">
        <strong>Warnings critiques et points de vigilance</strong>
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

      <section className="quality-publication-checklist">
        <h3>Checklist publication</h3>
        <div>
          {checklist.map((item) => (
            <article className={item.done ? "is-done" : "is-missing"} key={item.label}>
              <span>{item.done ? "OK" : "À faire"}</span>
              <strong>{item.label}</strong>
              <p>{item.helper}</p>
            </article>
          ))}
        </div>
      </section>

      <QualityRecommendations score={score} />
    </section>
  );
}
