import type {
  EvaluationCriterion,
  EvaluationPlayer,
  EvaluationTeam,
  PlayerEvaluation,
  TeamEvaluationSummary,
} from "../../types/evaluations";
import { computePlayerEvaluationSummary, getEvaluationScoreLabel } from "./evaluationScoring";
import { evaluationDomainLabels, evaluationDomains } from "./evaluationTemplates";

function playerName(player?: EvaluationPlayer) {
  return player ? `${player.firstName} ${player.lastName}` : "Joueur BCVB";
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export function buildPlayerEvaluationMarkdown(
  evaluation: PlayerEvaluation,
  player: EvaluationPlayer,
  criteria: EvaluationCriterion[]
): string {
  const summary = computePlayerEvaluationSummary(evaluation, criteria);

  return [
    `# Fiche évaluation - ${playerName(player)}`,
    "",
    `Équipe : ${player.teamName}`,
    `Catégorie : ${player.category}`,
    `Période : ${evaluation.period}`,
    `Saison : ${evaluation.season}`,
    `Score global : ${summary.globalScore}/5`,
    "",
    "## Scores par domaine",
    ...evaluationDomains.map((domain) => `- ${evaluationDomainLabels[domain]} : ${summary.domainScores[domain] || "—"}/5`),
    "",
    "## Points forts",
    ...(evaluation.strengths.length ? evaluation.strengths.map((item) => `- ${item}`) : summary.strongestDomains.map((domain) => `- ${evaluationDomainLabels[domain]}`)),
    "",
    "## Axes prioritaires",
    ...(evaluation.priorities.length ? evaluation.priorities.map((item) => `- ${item}`) : summary.priorityDomains.map((domain) => `- ${evaluationDomainLabels[domain]}`)),
    "",
    "## Objectif individuel",
    evaluation.individualObjective ? `- ${evaluation.individualObjective.title} : ${evaluation.individualObjective.observableCriterion}` : "- À définir",
    "",
    "## Commentaire coach",
    evaluation.coachComment || "À compléter",
    "",
    `Signature / date : ${new Date(evaluation.updatedAt).toLocaleDateString("fr-FR")}`,
  ].join("\n");
}

export function buildTeamEvaluationMarkdown(
  summary: TeamEvaluationSummary,
  team: EvaluationTeam,
  players: EvaluationPlayer[]
): string {
  return [
    `# Bilan équipe - ${team.name}`,
    "",
    `Période : ${summary.period}`,
    `Saison : ${summary.season}`,
    `Joueurs évalués : ${summary.playersCount}/${players.filter((player) => player.teamId === team.id).length}`,
    `Moyenne générale : ${summary.teamGlobalScore}/5`,
    "",
    "## Radar équipe",
    ...evaluationDomains.map((domain) => `- ${evaluationDomainLabels[domain]} : ${summary.domainAverages[domain] || "—"}/5`),
    "",
    "## Forces du groupe",
    ...(summary.teamStrengths.length ? summary.teamStrengths.map((item) => `- ${item}`) : ["- À consolider"]),
    "",
    "## Points faibles collectifs",
    ...(summary.teamPriorities.length ? summary.teamPriorities.map((item) => `- ${item}`) : ["- Aucun point faible critique"]),
    "",
    "## Joueurs à accompagner",
    ...(summary.playersToSupport.length ? summary.playersToSupport.map((id) => `- ${players.find((player) => player.id === id)?.firstName || id}`) : ["- Aucun joueur en alerte forte"]),
    "",
    "## Recommandations planification",
    ...summary.planningRecommendations.map((item) => `- ${item}`),
  ].join("\n");
}

export function exportEvaluationCsv(
  evaluations: PlayerEvaluation[],
  players: EvaluationPlayer[],
  criteria: EvaluationCriterion[]
): string {
  return [
    ["joueur", "equipe", "periode", "critere", "domaine", "score", "niveau", "commentaire", "preuve", "objectif", "axe_prioritaire"].join(";"),
    ...evaluations.flatMap((evaluation) => {
      const player = players.find((item) => item.id === evaluation.playerId);
      return evaluation.scores.map((score) => {
        const criterion = criteria.find((item) => item.id === score.criterionId);
        return [
          playerName(player),
          player?.teamName,
          evaluation.period,
          criterion?.label,
          criterion ? evaluationDomainLabels[criterion.domain] : "",
          score.score,
          getEvaluationScoreLabel(score.score),
          score.comment,
          score.observableEvidence,
          evaluation.individualObjective?.title || evaluation.monthlyChallenge,
          evaluation.priorityAxis || evaluation.priorities.join(" | "),
        ].map(csvCell).join(";");
      });
    }),
  ].join("\n");
}

export function downloadEvaluationFile(fileName: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function printEvaluationMarkdown(markdown: string) {
  const html = markdown
    .split("\n")
    .map((line) => {
      if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
      if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
      if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
      return `<p>${line || "&nbsp;"}</p>`;
    })
    .join("");
  const win = window.open("", "_blank", "noopener,noreferrer");
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Évaluation BCVB</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
          h1 { color: #c8102e; }
          h2 { margin-top: 24px; }
          li, p { line-height: 1.5; }
        </style>
      </head>
      <body>${html}</body>
    </html>
  `);
  win.document.close();
  win.print();
}
