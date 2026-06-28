import type { ReferentialConfig } from "../../types/admin";

type ReferentialsPanelProps = {
  referentials: ReferentialConfig[];
  onChange: (referentials: ReferentialConfig[]) => void;
};

export default function ReferentialsPanel({ referentials, onChange }: ReferentialsPanelProps) {
  function updateReferential(nextReferential: ReferentialConfig) {
    onChange(referentials.map((referential) => (referential.key === nextReferential.key ? nextReferential : referential)));
  }

  return (
    <section className="admin-settings-panel">
      <div className="admin-settings-panel__head">
        <div>
          <p>Haute priorité</p>
          <h2>Référentiels mobilisables</h2>
          <span>Activer BCVB, FFBB, FIBA, Europe, USA, Canada et sources spécifiques pour guider les productions.</span>
        </div>
        <strong>Cadre de rédaction</strong>
      </div>

      <div className="admin-referential-grid">
        {referentials.map((referential) => (
          <article className={referential.enabled ? "admin-referential-card admin-referential-card--enabled" : "admin-referential-card"} key={referential.key}>
            <header>
              <h3>{referential.label}</h3>
              <span>{referential.enabled ? "Actif" : "Inactif"}</span>
            </header>
            <p>{referential.description}</p>
            <div className="admin-referential-card__switches">
              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={referential.enabled}
                  onChange={(event) => updateReferential({ ...referential, enabled: event.target.checked })}
                />
                <span>Activé</span>
              </label>
              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={referential.injectInPrompt}
                  disabled={!referential.enabled}
                  onChange={(event) => updateReferential({ ...referential, injectInPrompt: event.target.checked })}
                />
                <span>Utiliser dans le cadre de rédaction</span>
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
