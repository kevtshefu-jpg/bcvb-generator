import type { EvaluationPlayer, TeamEvaluationSummary } from "../../types/evaluations";
import { TeamEvaluationDashboard } from "./TeamEvaluationDashboard";

export function EvaluationTeamSummary({
  summary,
  players,
}: {
  summary: TeamEvaluationSummary;
  players: EvaluationPlayer[];
}) {
  const teamPlayerIds = new Set(players.filter((player) => player.teamId === summary.teamId).map((player) => player.id));
  const evaluatedRate = teamPlayerIds.size ? Math.round((summary.playersCount / teamPlayerIds.size) * 100) : 0;

  return (
    <section className="evaluation-team-summary">
      <TeamEvaluationDashboard summary={summary} players={players} />
      <section className="evaluation-card evaluation-team-decisions">
        <div className="evaluations-section-title">
          <span>Décisions coach</span>
          <h2>Planifier le prochain cycle</h2>
        </div>
        <div className="evaluation-team-metrics">
          <span>Joueurs évalués <strong>{evaluatedRate}%</strong></span>
          <span>Points forts <strong>{summary.teamStrengths.slice(0, 3).join(", ") || "À consolider"}</strong></span>
          <span>Axes prioritaires <strong>{summary.teamPriorities.slice(0, 3).join(", ") || "Aucun critique"}</strong></span>
        </div>
        <ul>
          <li>Prochain cycle : {summary.planningRecommendations[0] || "conserver le cycle actuel."}</li>
          <li>Thèmes de séance : {summary.teamPriorities.slice(0, 2).join(", ") || "individualisation ciblée."}</li>
          <li>Réunion staff : suivre {summary.playersToSupport.length} joueur(s) à accompagner.</li>
        </ul>
      </section>
    </section>
  );
}

