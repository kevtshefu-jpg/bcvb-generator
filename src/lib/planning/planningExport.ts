import type { AnnualPlanning, PlanningCycle } from "../../types/planning";
import { scorePlanning } from "./planningScoring";

function slugify(value = "planification-bcvb") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "planification-bcvb";
}

function downloadText(content: string, filename: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function planningToMarkdown(planning: AnnualPlanning) {
  const score = scorePlanning(planning);
  const cycles = planning.cycles.map(cycleToMarkdown).join("\n\n");
  return [
    `# ${planning.title}`,
    "",
    `- Équipe : ${planning.teamName || "Non renseignée"}`,
    `- Saison : ${planning.season}`,
    `- Catégorie : ${planning.category}`,
    `- Niveau : ${planning.level}`,
    `- Profil coach : ${planning.coachProfile}`,
    `- Statut : ${planning.status}`,
    `- Score qualité : ${score.score}/100`,
    "",
    "## Objectifs globaux",
    planning.globalObjectives.map((objective) => `- **${objective.label}** : ${objective.description || ""} (${objective.bcvbLink})`).join("\n"),
    "",
    "## Cycles",
    cycles,
  ].join("\n");
}

function cycleToMarkdown(cycle: PlanningCycle) {
  return [
    `### ${cycle.title}`,
    `- Semaines : ${cycle.startWeek} à ${cycle.endWeek}`,
    `- Priorité BCVB : ${cycle.bcvbPriority}`,
    `- Statut : ${cycle.status}${cycle.locked ? " / verrouillé" : ""}`,
    "",
    "| Semaine | Thème | Priorité | Critères | Séances liées |",
    "|---|---|---|---|---|",
    ...cycle.weeks.map((week) => `| S${week.weekNumber} | ${week.theme} | ${week.priority} | ${week.validationCriteria.join("<br>")} | ${week.linkedSessionIds.join(", ")} |`),
  ].join("\n");
}

export function exportPlanningMarkdown(planning: AnnualPlanning) {
  downloadText(planningToMarkdown(planning), `${slugify(planning.title)}.md`, "text/markdown;charset=utf-8");
}

export function exportPlanningJson(planning: AnnualPlanning) {
  downloadText(JSON.stringify(planning, null, 2), `${slugify(planning.title)}.json`, "application/json;charset=utf-8");
}

export function printPlanningPdf() {
  window.print();
}
