import type { RosterImportRow, RosterPermissionSet } from "../../types/roster";
import { getDuplicateRows } from "../../lib/roster/rosterDuplicate";
import { MobileDetailCard, ResponsiveDataList } from "../ui/ResponsiveDataView";

export function RosterDuplicatePanel({
  rows,
  permissions,
}: {
  rows: RosterImportRow[];
  permissions: RosterPermissionSet;
}) {
  const duplicates = getDuplicateRows(rows);
  const renderAction = () => (
    <select disabled={!permissions.canMergeDuplicates}>
      <option>Vérifier</option>
      <option>Fusionner</option>
      <option>Ignorer</option>
    </select>
  );

  return (
    <section className="bcvb-tool-card roster-section">
      <div className="roster-section-header">
        <div>
          <span>Doublons</span>
          <h2>Scoring et validation admin</h2>
        </div>
        <strong>{duplicates.length} à vérifier</strong>
      </div>
      <div className="bcvb-table-scroll responsive-data-table">
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
                  {renderAction()}
                </td>
              </tr>
            ))}
            {duplicates.length === 0 && <tr><td colSpan={5}>Aucun doublon probable détecté.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile">
        <ResponsiveDataList empty={<p>Aucun doublon probable détecté.</p>}>
          {duplicates.map((row) => (
            <MobileDetailCard
              key={row.id}
              tone="is-duplicate"
              eyebrow={`Ligne ${row.sourceLine}`}
              title={`${row.mapped?.firstName || "Prénom manquant"} ${row.mapped?.lastName || "Nom manquant"}`}
              badge={<span className="roster-chip">{row.duplicateScore}%</span>}
              items={[
                { label: "Score", value: `${row.duplicateScore}%` },
                { label: "Correspondances", value: row.possibleDuplicateIds?.join(", ") || "Import courant", full: true },
              ]}
              actions={renderAction()}
            />
          ))}
        </ResponsiveDataList>
      </div>
    </section>
  );
}
