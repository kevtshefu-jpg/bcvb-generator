import type {
  EvaluationCriterion,
  EvaluationPlayer,
  EvaluationTeam,
  PlayerEvaluation,
  TeamEvaluationSummary,
} from "../../types/evaluations";
import {
  buildPlayerEvaluationMarkdown,
  buildTeamEvaluationMarkdown,
  downloadEvaluationFile,
  exportEvaluationCsv,
  printEvaluationMarkdown,
} from "../../lib/evaluations/evaluationExports";

export function EvaluationExportPanel({
  evaluation,
  evaluations,
  player,
  team,
  players,
  criteria,
  teamSummary,
  canExport,
}: {
  evaluation: PlayerEvaluation;
  evaluations: PlayerEvaluation[];
  player: EvaluationPlayer;
  team: EvaluationTeam;
  players: EvaluationPlayer[];
  criteria: EvaluationCriterion[];
  teamSummary: TeamEvaluationSummary;
  canExport: boolean;
}) {
  const playerMarkdown = buildPlayerEvaluationMarkdown(evaluation, player, criteria);
  const teamMarkdown = buildTeamEvaluationMarkdown(teamSummary, team, players);

  return (
    <aside className="evaluation-card evaluation-export-panel">
      <div className="evaluations-section-title">
        <span>Exports</span>
        <h2>PDF / CSV / JSON</h2>
      </div>
      <button type="button" disabled={!canExport} onClick={() => printEvaluationMarkdown(playerMarkdown)}>Fiche joueur PDF</button>
      <button type="button" disabled={!canExport} onClick={() => printEvaluationMarkdown(teamMarkdown)}>Bilan équipe PDF</button>
      <button type="button" disabled={!canExport} onClick={() => downloadEvaluationFile("evaluations-bcvb.csv", exportEvaluationCsv(evaluations, players, criteria), "text/csv;charset=utf-8")}>Export Excel CSV</button>
      <button type="button" disabled={!canExport} onClick={() => downloadEvaluationFile(`evaluation-${player.id}.json`, JSON.stringify({ evaluation, player, teamSummary }, null, 2), "application/json;charset=utf-8")}>Source JSON</button>
      {!canExport && <p>Exports réservés aux coachs, responsables techniques et admins.</p>}
    </aside>
  );
}

