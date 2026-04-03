import type { useGeneratorStore } from "../hooks/useGeneratorStore";

type Store = ReturnType<typeof useGeneratorStore>;

interface Props {
  store: Store;
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ExportBar({ store }: Props) {
  const { state, clearAll } = store;

  function handleExportJson() {
    try {
      const blob = new Blob([JSON.stringify(state, null, 2)], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeTitle = slugify(state.meta.title || "situation-bcvb");

      a.href = url;
      a.download = `${safeTitle || "situation-bcvb"}.json`;
      a.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur export JSON", error);
      window.alert("Une erreur est survenue pendant l’export JSON.");
    }
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Réinitialiser va vider le terrain et les données en cours. Continuer ?"
    );

    if (!confirmed) return;

    clearAll();
  }

  return (
    <div className="bcvb-panel">
      <div className="bcvb-panel-title">Export & actions</div>
      <div className="bcvb-panel-subtitle">
        Exporte ta situation ou repars d’un terrain vide
      </div>

      <div className="bcvb-form-stack" style={{ marginTop: 14 }}>
        <div className="bcvb-button-grid two">
          <button
            type="button"
            className="bcvb-btn secondary"
            onClick={handleExportJson}
          >
            ↓ Export JSON
          </button>

          <button
            type="button"
            className="bcvb-btn danger"
            onClick={handleReset}
          >
            ↺ Réinitialiser
          </button>
        </div>

        <div className="bcvb-empty-box">
          Le fichier JSON permet de conserver l’état complet de la situation :
          paramètres, joueurs, actions et structure du terrain.
        </div>
      </div>
    </div>
  );
}
