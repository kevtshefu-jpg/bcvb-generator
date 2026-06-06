import type { SeasonConfig } from "../../types/admin";
import { archiveSeason, createNextSeason, setActiveSeason } from "../../lib/admin/seasonSettings";

type SeasonManagerPanelProps = {
  seasons: SeasonConfig[];
  onChange: (seasons: SeasonConfig[]) => void;
};

export default function SeasonManagerPanel({ seasons, onChange }: SeasonManagerPanelProps) {
  const activeSeason = seasons.find((season) => season.active);

  return (
    <section className="admin-settings-panel">
      <div className="admin-settings-panel__head">
        <div>
          <p>Haute priorité</p>
          <h2>Saisons sportives</h2>
          <span>Structurer documents, équipes, planifications, effectifs et évaluations par saison.</span>
        </div>
        <button type="button" onClick={() => onChange(createNextSeason(seasons))}>
          Créer saison suivante
        </button>
      </div>

      <div className="admin-season-summary">
        <span>Saison active</span>
        <strong>{activeSeason?.label ?? "Aucune saison active"}</strong>
        <p>Évolution prévue : ajouter season_id aux documents, équipes, présences, planifications et imports.</p>
      </div>

      <div className="admin-season-list">
        {seasons.map((season) => (
          <article className={season.active ? "admin-season-card admin-season-card--active" : "admin-season-card"} key={season.id}>
            <div>
              <h3>{season.label}</h3>
              <p>
                {new Date(season.startDate).toLocaleDateString("fr-FR")} ·{" "}
                {new Date(season.endDate).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="admin-season-card__actions">
              <span>{season.archived ? "Archivée" : season.active ? "Active" : "Préparée"}</span>
              <button type="button" onClick={() => onChange(setActiveSeason(seasons, season.id))} disabled={season.active}>
                Activer
              </button>
              <button type="button" onClick={() => onChange(archiveSeason(seasons, season.id))} disabled={season.archived}>
                Archiver
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
