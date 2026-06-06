import type { EvaluationPlayer, TeamEvaluationSummary } from "../../types/evaluations";
import { evaluationDomainLabels, evaluationDomains } from "../../lib/evaluations/evaluationTemplates";
import { EvaluationRadar } from "./EvaluationRadar";

export function TeamEvaluationDashboard({
  summary,
  players,
}: {
  summary: TeamEvaluationSummary;
  players: EvaluationPlayer[];
}) {
  const strongest = evaluationDomains
    .filter((domain) => summary.domainAverages[domain] > 0)
    .sort((a, b) => summary.domainAverages[b] - summary.domainAverages[a])[0];
  const weakest = evaluationDomains
    .filter((domain) => summary.domainAverages[domain] > 0)
    .sort((a, b) => summary.domainAverages[a] - summary.domainAverages[b])[0];

  return (
    <section className="evaluation-card team-evaluation-dashboard">
      <div className="evaluations-section-title">
        <span>Bilan équipe</span>
        <h2>{summary.teamGlobalScore}/5 moyenne équipe</h2>
      </div>
      <div className="team-evaluation-grid">
        <EvaluationRadar title="Radar équipe" domainScores={summary.domainAverages} />
        <div className="team-evaluation-content">
          <div className="evaluation-team-metrics">
            <span>Joueurs évalués <strong>{summary.playersCount}</strong></span>
            <span>Domaine fort <strong>{strongest ? evaluationDomainLabels[strongest] : "À définir"}</strong></span>
            <span>Domaine faible <strong>{weakest ? evaluationDomainLabels[weakest] : "À définir"}</strong></span>
          </div>
          <h3>Joueurs à accompagner</h3>
          <div className="evaluation-pill-list">
            {summary.playersToSupport.map((id) => {
              const player = players.find((item) => item.id === id);
              return <span key={id}>{player ? `${player.firstName} ${player.lastName}` : id}</span>;
            })}
            {summary.playersToSupport.length === 0 && <span>Aucun joueur en alerte forte</span>}
          </div>
          <h3>Recommandations prochain cycle</h3>
          <ul>
            {summary.planningRecommendations.map((recommendation) => <li key={recommendation}>{recommendation}</li>)}
          </ul>
          <a className="evaluation-planning-link" href="/coach/planifications">Ouvrir la planification sportive</a>
        </div>
      </div>
    </section>
  );
}

