import type {
  FamilyContact,
  PlayerPassport,
  RosterImportResult,
  RosterPermissionSet,
  Team,
} from "../../types/roster";
import {
  exportFamilyContactsCsv,
  exportPlayerPassportJson,
  exportRosterJson,
  exportTeamRosterCsv,
  exportTechnicalTeamSummary,
} from "../../lib/roster/rosterExport";

export function RosterExportPanel({
  result,
  contacts,
  passports,
  selectedPassport,
  team,
  permissions,
}: {
  result: RosterImportResult | null;
  contacts: FamilyContact[];
  passports: PlayerPassport[];
  selectedPassport: PlayerPassport | null;
  team: Partial<Team>;
  permissions: RosterPermissionSet;
}) {
  return (
    <aside className="bcvb-tool-card roster-export-panel">
      <div className="roster-section-header">
        <div>
          <span>Exports</span>
          <h2>CSV / JSON / synthèse</h2>
        </div>
      </div>
      <button type="button" disabled={!result || !permissions.canExport} onClick={() => result && exportTeamRosterCsv(result, permissions)}>CSV effectif équipe</button>
      <button type="button" disabled={!result || !permissions.canExport} onClick={() => result && exportRosterJson(result, permissions)}>JSON source</button>
      <button type="button" disabled={!selectedPassport || !permissions.canExport} onClick={() => selectedPassport && exportPlayerPassportJson(selectedPassport, permissions)}>Fiche joueur JSON</button>
      <button type="button" disabled={!permissions.canExport || !permissions.canViewSensitiveContacts} onClick={() => exportFamilyContactsCsv(contacts, permissions)}>Liste contacts parents</button>
      <button type="button" disabled={!permissions.canExport} onClick={() => exportTechnicalTeamSummary(team, passports, result, permissions)}>Synthèse responsable technique</button>
      {!permissions.canExport && <p>Exports réservés aux profils autorisés.</p>}
    </aside>
  );
}

