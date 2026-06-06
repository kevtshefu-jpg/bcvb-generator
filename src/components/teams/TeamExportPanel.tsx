import type {
  TeamIndicators,
  TeamLinkedDocument,
  TeamObjective,
  TeamProfile,
  TeamSeasonHistory,
  TeamStaffMember,
} from "../../types/teams";
import {
  buildTeamObjectivesCsv,
  buildTeamJsonExport,
  buildTeamProfileMarkdown,
  buildTeamStaffCsv,
  downloadTeamFile,
  printTeamMarkdown,
} from "../../lib/teams/teamExports";

export function TeamExportPanel({
  id,
  team,
  staff,
  objectives,
  documents,
  history,
  indicators,
  canExport,
}: {
  id?: string;
  team: TeamProfile;
  staff: TeamStaffMember[];
  objectives: TeamObjective[];
  documents: TeamLinkedDocument[];
  history: TeamSeasonHistory[];
  indicators: TeamIndicators;
  canExport: boolean;
}) {
  const markdown = buildTeamProfileMarkdown(team, staff, objectives, documents, history, indicators);
  const fullJson = buildTeamJsonExport(team, staff, objectives, documents, history, indicators);

  return (
    <aside id={id} className="team-export-panel">
      <div className="teams-section-title">
        <span>Exports</span>
        <h2>Fiche, bilan, staff, objectifs</h2>
      </div>
      <button type="button" disabled={!canExport} onClick={() => printTeamMarkdown(markdown)}>Fiche équipe PDF</button>
      <button type="button" disabled={!canExport} onClick={() => printTeamMarkdown(markdown)}>Bilan équipe PDF</button>
      <button type="button" disabled={!canExport} onClick={() => downloadTeamFile("staff-equipe-bcvb.csv", buildTeamStaffCsv(staff), "text/csv;charset=utf-8")}>Synthèse staff</button>
      <button type="button" disabled={!canExport} onClick={() => downloadTeamFile("objectifs-saison-bcvb.csv", buildTeamObjectivesCsv(objectives), "text/csv;charset=utf-8")}>Objectifs saison</button>
      <button type="button" disabled={!canExport} onClick={() => downloadTeamFile("documents-lies-bcvb.json", JSON.stringify(documents, null, 2), "application/json;charset=utf-8")}>Documents liés</button>
      <button type="button" disabled={!canExport} onClick={() => downloadTeamFile("fiche-equipe-complete-bcvb.json", fullJson, "application/json;charset=utf-8")}>JSON complet</button>
      {!canExport && <p>Exports réservés aux profils autorisés.</p>}
    </aside>
  );
}
