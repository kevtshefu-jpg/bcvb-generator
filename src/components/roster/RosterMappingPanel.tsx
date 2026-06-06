import type { RosterImportColumnMapping, RosterImportResult } from "../../types/roster";
import { ROSTER_MAPPING_FIELDS } from "../../lib/roster/rosterMapping";

export function RosterMappingPanel({
  result,
  onChange,
}: {
  result: RosterImportResult | null;
  onChange: (mapping: RosterImportColumnMapping) => void;
}) {
  if (!result) {
    return (
      <section className="bcvb-tool-card roster-section">
        <div className="roster-section-header">
          <div>
            <span>Mapping</span>
            <h2>Colonnes détectées</h2>
          </div>
        </div>
        <p>Importe un fichier pour mapper les colonnes.</p>
      </section>
    );
  }

  return (
    <section className="bcvb-tool-card roster-section">
      <div className="roster-section-header">
        <div>
          <span>Mapping</span>
          <h2>Colonnes détectées</h2>
        </div>
        <p>{result.columns.length} colonnes · {result.invalidRows.length} lignes à corriger</p>
      </div>
      <div className="bcvb-mapping-grid">
        {ROSTER_MAPPING_FIELDS.map((field) => (
          <label key={field.key}>
            <span>{field.label}{field.required ? " *" : ""}</span>
            <select
              value={result.mapping[field.key] || ""}
              onChange={(event) => onChange({ ...result.mapping, [field.key]: event.target.value || undefined })}
            >
              <option value="">Non mappé</option>
              {result.columns.map((column) => <option key={column} value={column}>{column}</option>)}
            </select>
          </label>
        ))}
      </div>
    </section>
  );
}

