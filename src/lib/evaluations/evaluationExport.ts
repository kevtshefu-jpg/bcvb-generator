import type { EvaluationCriterion, EvaluationPlayer, EvaluationTeam, PlayerEvaluation, TeamEvaluationSummary } from "../../types/evaluations";
import { getEvaluationTemplateByCategory } from "./evaluationTemplates";
import {
  buildPlayerEvaluationMarkdown as buildPlayerMarkdown,
  buildTeamEvaluationMarkdown as buildTeamMarkdown,
  downloadEvaluationFile,
  exportEvaluationCsv,
  printEvaluationMarkdown,
} from "./evaluationExports";
import { computeTeamEvaluationSummary } from "./evaluationStats";

export { downloadEvaluationFile, printEvaluationMarkdown };

export function buildPlayerEvaluationMarkdown(
  evaluation: PlayerEvaluation,
  player: EvaluationPlayer,
  criteria: EvaluationCriterion[] = evaluation.criteria || getEvaluationTemplateByCategory(player.category)
): string {
  return buildPlayerMarkdown(evaluation, player, criteria);
}

export function buildTeamEvaluationMarkdown(
  evaluations: PlayerEvaluation[] | TeamEvaluationSummary,
  players: EvaluationPlayer[],
  team: EvaluationTeam,
  criteria: EvaluationCriterion[] = getEvaluationTemplateByCategory(team.category, team.level)
): string {
  const summary = Array.isArray(evaluations)
    ? computeTeamEvaluationSummary(evaluations, criteria, team, evaluations[0]?.period || "mensuel", evaluations[0]?.season || "2026-2027")
    : evaluations;
  return buildTeamMarkdown(summary, team, players);
}

export function exportEvaluationsCsv(
  evaluations: PlayerEvaluation[],
  players: EvaluationPlayer[],
  criteria: EvaluationCriterion[] = getEvaluationTemplateByCategory(players[0]?.category || "U13")
): string {
  return exportEvaluationCsv(evaluations, players, criteria);
}
