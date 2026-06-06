import type { RosterImportRow, RosterPermissionSet } from "../../types/roster";
import { describeDuplicate } from "../../lib/roster/rosterDuplicate";

function rowTone(row: RosterImportRow) {
  if (row.ignored) return "is-muted";
  if (row.errors.length > 0) return "is-error";
  if ((row.duplicateScore || 0) >= 80) return "is-duplicate";
  if (row.warnings.length > 0) return "is-warning";
  return "is-valid";
}

function contactLabel(row: RosterImportRow, index: number) {
  const contact = row.contacts?.[index];
  if (!contact) return "—";
  return [contact.firstName, contact.lastName, contact.email, contact.phone].filter(Boolean).join(" · ") || "—";
}

export function RosterPreviewTable({
  rows,
  permissions,
  onPatchRow,
  onSelectRow,
}: {
  rows: RosterImportRow[];
  permissions: RosterPermissionSet;
  onPatchRow: (rowId: string, patch: Partial<RosterImportRow>) => void;
  onSelectRow: (row: RosterImportRow) => void;
}) {
  return (
    <section className="bcvb-tool-card roster-section">
      <div className="roster-section-header">
        <div>
          <span>Prévisualisation</span>
          <h2>Lignes importées avant validation</h2>
        </div>
        <strong>{rows.length} lignes</strong>
      </div>
      <div className="bcvb-table-scroll">
        <table className="bcvb-table-premium roster-preview-table">
          <thead>
            <tr>
              <th>Statut</th>
              <th>Prénom</th>
              <th>Nom</th>
              <th>Naissance</th>
              <th>Sexe</th>
              <th>Licence</th>
              <th>Catégorie</th>
              <th>Équipe cible</th>
              <th>Contact parent 1</th>
              <th>Contact parent 2</th>
              <th>Erreurs</th>
              <th>Doublon probable</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr className={rowTone(row)} key={row.id}>
                <td><span className="roster-chip">{row.ignored ? "Ignorée" : row.errors.length ? "Erreur" : row.warnings.length ? "Alerte" : "Valide"}</span></td>
                <td>{row.mapped?.firstName || "—"}</td>
                <td>{row.mapped?.lastName || "—"}</td>
                <td>{row.mapped?.birthDate || "—"}</td>
                <td>{row.mapped?.gender || "—"}</td>
                <td>{row.mapped?.licenseNumber || "—"}</td>
                <td>{row.mapped?.category || "—"}</td>
                <td>{row.targetTeamName || "À affecter"}</td>
                <td>{permissions.canViewSensitiveContacts ? contactLabel(row, 0) : "Masqué"}</td>
                <td>{permissions.canViewSensitiveContacts ? contactLabel(row, 1) : "Masqué"}</td>
                <td>{row.errors.join(" ") || row.warnings.join(" ") || "—"}</td>
                <td>{describeDuplicate(row)} · {row.duplicateScore || 0}%</td>
                <td>
                  <div className="roster-row-actions">
                    <button type="button" onClick={() => onSelectRow(row)}>Fiche</button>
                    <button type="button" disabled={permissions.readOnly} onClick={() => onPatchRow(row.id, { validated: true, ignored: false })}>Valider</button>
                    <button type="button" disabled={permissions.readOnly} onClick={() => onPatchRow(row.id, { ignored: true })}>Ignorer</button>
                    <button type="button" disabled={!permissions.canMergeDuplicates || (row.duplicateScore || 0) < 60}>Fusionner</button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={13}>Importe un fichier pour afficher la prévisualisation.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

