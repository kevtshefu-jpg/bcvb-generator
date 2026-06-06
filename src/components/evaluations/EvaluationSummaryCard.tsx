import type { EvaluationPlayer, PlayerEvaluation, PlayerEvaluationSummary } from "../../types/evaluations";
import { bcvbRadarDomains, evaluationDomainLabels } from "../../lib/evaluations/evaluationTemplates";
import { EvaluationRadar } from "./EvaluationRadar";
import { EvaluationDomainScore } from "./EvaluationDomainScore";

export function EvaluationSummaryCard({
  player,
  evaluation,
  summary,
  canViewComments,
  onCommentChange,
}: {
  player: EvaluationPlayer;
  evaluation: PlayerEvaluation;
  summary: PlayerEvaluationSummary;
  canViewComments: boolean;
  onCommentChange: (comment: string) => void;
}) {
  return (
    <aside className="evaluation-card evaluation-summary">
      <div className="evaluations-section-title">
        <span>Synthèse joueur</span>
        <h2>{summary.globalScore}/5</h2>
      </div>
      <article className="evaluation-player-identity">
        <strong>{player.firstName} {player.lastName}</strong>
        <span>{player.teamName} · {player.category} · présence {player.attendanceRate ?? 0}%</span>
        <span>Dernière évaluation : {player.lastEvaluationDate || "À créer"}</span>
      </article>
      <EvaluationRadar domainScores={summary.domainScores} />
      <div className="evaluation-domain-score-grid">
        {bcvbRadarDomains.slice(0, 4).map((domain) => (
          <EvaluationDomainScore key={domain} domain={domain} score={summary.domainScores[domain]} />
        ))}
      </div>
      <div className="evaluation-pill-list">
        <strong>Points forts</strong>
        {(evaluation.strengths.length ? evaluation.strengths : summary.strongestDomains.map((domain) => evaluationDomainLabels[domain])).map((item) => <span key={item}>{item}</span>)}
        {summary.strongestDomains.length === 0 && evaluation.strengths.length === 0 && <span>À identifier</span>}
      </div>
      <div className="evaluation-pill-list">
        <strong>Axes prioritaires</strong>
        {(evaluation.priorities.length ? evaluation.priorities : summary.priorityDomains.map((domain) => evaluationDomainLabels[domain])).map((item) => <span key={item}>{item}</span>)}
        {summary.priorityDomains.length === 0 && evaluation.priorities.length === 0 && <span>À consolider</span>}
      </div>
      <p className="evaluation-recommendation">{summary.recommendation}</p>
      <label>
        Commentaire coach
        {canViewComments ? (
          <textarea value={evaluation.coachComment} onChange={(event) => onCommentChange(event.target.value)} />
        ) : (
          <p>Commentaire sensible masqué.</p>
        )}
      </label>
    </aside>
  );
}
