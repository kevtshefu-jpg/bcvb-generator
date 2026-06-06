import type { RosterImportRow, RosterPermissionSet } from "../../types/roster";
import { getDuplicateRows } from "../../lib/roster/rosterDuplicate";

export function RosterDuplicatePanel({
  rows,
  permissions,
}: {
  rows: RosterImportRow[];
  permissions: RosterPermissionSet;
}) {
  const duplicates = getDuplicateRows(rows);

  return (
    <section className="bcvb-tool-card roster-section">
      <div className="roster-section-header">
        <div>
          <span>Doublons</span>
          <h2>Scoring et validation admin</h2>
        </div>
        <strong>{duplicates.length} à vérifier</strong>
      </div>
      <div className="bcvb-table-scroll">
        <table className="bcvb-table-premium">
          <thead><tr><th>Joueur</th><th>Ligne</th><th>Score</th><th>Correspondances</th><th>Action</th></tr></thead>
          <tbody>
            {duplicates.map((row) => (
              <tr key={row.id}>
                <td>{row.mapped?.firstName} {row.mapped?.lastName}</td>
                <td>{row.sourceLine}</td>
                <td><strong>{row.duplicateScore}%</strong></td>
                <td>{row.possibleDuplicateIds?.join(", ") || "Import courant"}</td>
                <td>
                  <select disabled={!permissions.canMergeDuplicates}>
                    <option>Vérifier</option>
                    <option>Fusionner</option>
                    <option>Ignorer</option>
                  </select>
                </td>
              </tr>
            ))}
            {duplicates.length === 0 && <tr><td colSpan={5}>Aucun doublon probable détecté.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

