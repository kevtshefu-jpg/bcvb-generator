import type { ExportConfig } from "../../types/admin";
import { documentFamilyLabels } from "../../lib/admin/documentStandards";

type ExportSettingsPanelProps = {
  exports: ExportConfig[];
  onChange: (exports: ExportConfig[]) => void;
};

const marginFields: Array<{
  key: keyof Pick<ExportConfig, "marginTopMm" | "marginRightMm" | "marginBottomMm" | "marginLeftMm">;
  label: string;
}> = [
  { key: "marginTopMm", label: "Haut" },
  { key: "marginRightMm", label: "Droite" },
  { key: "marginBottomMm", label: "Bas" },
  { key: "marginLeftMm", label: "Gauche" },
];

const toggleFields: Array<{
  key: keyof Pick<ExportConfig, "includeLogo" | "includeFooter" | "includePageNumbers" | "includeSourceMarkdown">;
  label: string;
}> = [
  { key: "includeLogo", label: "Logo BCVB" },
  { key: "includeFooter", label: "Pied de page" },
  { key: "includePageNumbers", label: "Numéros pages" },
  { key: "includeSourceMarkdown", label: "Source Markdown" },
];

export default function ExportSettingsPanel({ exports, onChange }: ExportSettingsPanelProps) {
  function updateExport(nextExport: ExportConfig) {
    onChange(exports.map((exportConfig) => (exportConfig.family === nextExport.family ? nextExport : exportConfig)));
  }

  return (
    <section className="admin-settings-panel">
      <div className="admin-settings-panel__head">
        <div>
          <p>Priorité moyenne</p>
          <h2>Exports PDF, source et formats</h2>
          <span>Uniformiser les sorties documents : format, marges, logo, pied de page et source Markdown.</span>
        </div>
        <strong>Charte export</strong>
      </div>

      <div className="admin-export-grid">
        {exports.map((exportConfig) => (
          <article className="admin-export-card" key={exportConfig.family}>
            <header>
              <h3>{documentFamilyLabels[exportConfig.family]}</h3>
              <select
                value={exportConfig.format}
                onChange={(event) =>
                  updateExport({
                    ...exportConfig,
                    format: event.target.value as ExportConfig["format"],
                  })
                }
              >
                <option value="a4_portrait">A4 portrait</option>
                <option value="a4_landscape">A4 paysage</option>
                <option value="custom">Personnalisé</option>
              </select>
            </header>

            <div className="admin-margin-grid">
              {marginFields.map((field) => (
                <label key={`${exportConfig.family}-${field.key}`}>
                  <span>{field.label}</span>
                  <input
                    type="number"
                    min={0}
                    value={exportConfig[field.key]}
                    onChange={(event) =>
                      updateExport({
                        ...exportConfig,
                        [field.key]: Math.max(0, Number(event.target.value)),
                      })
                    }
                  />
                </label>
              ))}
            </div>

            <div className="admin-standard-toggles">
              {toggleFields.map((field) => (
                <label className="admin-switch" key={`${exportConfig.family}-${field.key}`}>
                  <input
                    type="checkbox"
                    checked={exportConfig[field.key]}
                    onChange={(event) => updateExport({ ...exportConfig, [field.key]: event.target.checked })}
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
