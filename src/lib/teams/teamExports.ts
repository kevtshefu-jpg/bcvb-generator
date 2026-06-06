import type {
  TeamIndicators,
  TeamLinkedDocument,
  TeamObjective,
  TeamProfile,
  TeamSeasonHistory,
  TeamStaffMember,
} from "../../types/teams";

function csvCell(value: unknown) {
  const normalized = Array.isArray(value) ? value.join(" | ") : value;
  return `"${String(normalized ?? "").replace(/"/g, '""')}"`;
}

function trainingSlotToText(slot: NonNullable<TeamProfile["trainingSlots"]>[number]) {
  return typeof slot === "string" ? slot : `${slot.day} ${slot.startTime}-${slot.endTime} · ${slot.gym}`;
}

export function buildTeamProfileMarkdown(
  team: TeamProfile,
  staff: TeamStaffMember[],
  objectives: TeamObjective[],
  documents: TeamLinkedDocument[],
  history: TeamSeasonHistory[],
  indicators: TeamIndicators
) {
  return [
    `# Fiche équipe - ${team.name}`,
    "",
    `Catégorie : ${team.category}`,
    `Niveau : ${team.level}`,
    `Championnat : ${team.championship || "Non renseigné"}`,
    `Saison : ${team.season}`,
    `Statut : ${team.status}`,
    `Salle principale : ${team.mainGym || "Non renseignée"}`,
    `Créneaux : ${(team.trainingSlots || []).map(trainingSlotToText).join(", ") || "Non renseignés"}`,
    "",
    "## Staff",
    ...staff.map((member) => `- ${member.name} : ${member.role}${member.isActive ? "" : " (inactif)"}`),
    "",
    "## Objectifs saison",
    ...objectives.map((objective) => `- ${objective.title} [${objective.priority}] : ${objective.description}`),
    "",
    "## Indicateurs",
    `- Joueurs : ${indicators.playersCount}`,
    `- Présence moyenne : ${indicators.averageAttendanceRate}%`,
    `- Score évaluation : ${indicators.averageEvaluationScore}/5`,
    `- Documents liés : ${documents.length}`,
    "",
    "## Documents liés",
    ...documents.map((document) => `- ${document.title} (${document.documentType})`),
    "",
    "## Historique court",
    ...history.map((item) => `- ${item.season} : ${item.summary}`),
  ].join("\n");
}

export function buildTeamStaffCsv(staff: TeamStaffMember[]) {
  return [
    ["nom", "role", "email", "telephone", "debut", "fin", "actif"].join(";"),
    ...staff.map((member) => [
      member.name,
      member.role,
      member.email,
      member.phone,
      member.startDate,
      member.endDate,
      member.isActive ? "oui" : "non",
    ].map(csvCell).join(";")),
  ].join("\n");
}

export function buildTeamObjectivesCsv(objectives: TeamObjective[]) {
  return [
    ["type", "titre", "description", "observable", "quantifiable", "priorite", "statut", "planning"].join(";"),
    ...objectives.map((objective) => [
      objective.type,
      objective.title,
      objective.description,
      objective.observableCriteria,
      objective.quantifiableCriteria,
      objective.priority,
      objective.status,
      objective.linkedPlanningId,
    ].map(csvCell).join(";")),
  ].join("\n");
}

export function downloadTeamFile(fileName: string, content: string, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export function buildTeamJsonExport(
  team: TeamProfile,
  staff: TeamStaffMember[],
  objectives: TeamObjective[],
  documents: TeamLinkedDocument[],
  history: TeamSeasonHistory[],
  indicators: TeamIndicators
) {
  return JSON.stringify({ team, staff, objectives, documents, history, indicators, exportedAt: new Date().toISOString() }, null, 2);
}

export function printTeamMarkdown(markdown: string) {
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
        <title>Fiche équipe BCVB</title>
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
