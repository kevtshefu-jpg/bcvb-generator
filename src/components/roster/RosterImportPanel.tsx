import { useRef, useState } from "react";
import type { RosterImportResult } from "../../types/roster";
import { parseRosterFile } from "../../lib/roster/rosterImport";

export function RosterImportPanel({
  result,
  canImport,
  onImported,
  onError,
}: {
  result: RosterImportResult | null;
  canImport: boolean;
  onImported: (result: RosterImportResult) => void;
  onError: (message: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const hasCriticalErrors = Boolean(result?.invalidRows.length);

  async function handleFile(file: File | null) {
    if (!file || !canImport) return;
    try {
      onError(null);
      onImported(await parseRosterFile(file));
    } catch (error) {
      onError(error instanceof Error ? error.message : "Import impossible.");
    }
  }

  return (
    <section className="bcvb-tool-card roster-import-card">
      <div className="roster-card-title">
        <span>Import CSV / Excel</span>
        <h2>Prévisualiser avant validation</h2>
      </div>
      <div
        className={`roster-dropzone ${dragActive ? "is-active" : ""} ${!canImport ? "is-disabled" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          handleFile(event.dataTransfer.files?.[0] || null);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          hidden
          disabled={!canImport}
          onChange={(event) => handleFile(event.target.files?.[0] || null)}
        />
        <strong>{result?.fileName || "Déposer un fichier effectif"}</strong>
        <p>Formats acceptés : CSV, XLS, XLSX. Aucune donnée n’est enregistrée avant validation autorisée.</p>
        <button className="bcvb-button-primary" type="button" disabled={!canImport} onClick={() => inputRef.current?.click()}>
          Choisir un fichier
        </button>
      </div>
      <div className="roster-import-status">
        <span>{result ? `${result.rowCount} lignes détectées` : "Aucun fichier importé"}</span>
        <span>{hasCriticalErrors ? `${result?.invalidRows.length} erreurs critiques` : "Prêt à valider après contrôle"}</span>
      </div>
    </section>
  );
}
