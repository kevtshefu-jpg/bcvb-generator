import type { DocumentStandardConfig } from "../../types/admin";
import { updateDocumentStandardNumber } from "../../lib/admin/documentStandards";

type DocumentStandardsPanelProps = {
  standards: DocumentStandardConfig[];
  onChange: (standards: DocumentStandardConfig[]) => void;
};

const numericFields: Array<{
  key: keyof Pick<
    DocumentStandardConfig,
    "minQualityScore" | "minTables" | "minSituations" | "minDiagrams" | "minBcvbBlocks"
  >;
  label: string;
}> = [
  { key: "minQualityScore", label: "Score min." },
  { key: "minTables", label: "Tableaux" },
  { key: "minSituations", label: "Situations" },
  { key: "minDiagrams", label: "Schémas" },
  { key: "minBcvbBlocks", label: "Blocs BCVB" },
];

const booleanFields: Array<{
  key: keyof Pick<
    DocumentStandardConfig,
    "requiresCover" | "requiresSummary" | "requiresEvaluationGrid" | "requiresExport"
  >;
  label: string;
}> = [
  { key: "requiresCover", label: "Couverture" },
  { key: "requiresSummary", label: "Résumé" },
  { key: "requiresEvaluationGrid", label: "Grille évaluation" },
  { key: "requiresExport", label: "Export requis" },
];

export default function DocumentStandardsPanel({ standards, onChange }: DocumentStandardsPanelProps) {
  function updateStandard(nextStandard: DocumentStandardConfig) {
    onChange(standards.map((standard) => (standard.family === nextStandard.family ? nextStandard : standard)));
  }

  return (
    <section className="admin-settings-panel">
      <div className="admin-settings-panel__head">
        <div>
          <p>Haute priorité</p>
          <h2>Standards documentaires</h2>
          <span>Configurer les exigences qualité par famille documentaire : score, tableaux, situations, schémas et blocs.</span>
        </div>
        <strong>JSON par famille</strong>
      </div>

      <div className="admin-standards-grid">
        {standards.map((standard) => (
          <article className="admin-standard-card" key={standard.family}>
            <header>
              <h3>{standard.label}</h3>
              <span>{standard.layoutSignature}</span>
            </header>

            <div className="admin-number-grid">
              {numericFields.map((field) => (
                <label key={`${standard.family}-${field.key}`}>
                  <span>{field.label}</span>
                  <input
                    type="number"
                    min={0}
                    max={field.key === "minQualityScore" ? 100 : undefined}
                    value={standard[field.key]}
                    onChange={(event) => updateStandard(updateDocumentStandardNumber(standard, field.key, Number(event.target.value)))}
                  />
                </label>
              ))}
            </div>

            <div className="admin-standard-toggles">
              {booleanFields.map((field) => (
                <label className="admin-switch" key={`${standard.family}-${field.key}`}>
                  <input
                    type="checkbox"
                    checked={standard[field.key]}
                    onChange={(event) => updateStandard({ ...standard, [field.key]: event.target.checked })}
                  />
                  <span>{field.label}</span>
                </label>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
