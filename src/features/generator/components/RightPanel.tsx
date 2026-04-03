import type { useGeneratorStore } from "../hooks/useGeneratorStore";
import { CoachingPointsCard } from "./CoachingPointsCard";
import { ExportBar } from "./ExportBar";

type Store = ReturnType<typeof useGeneratorStore>;

interface Props {
  store: Store;
}

export function RightPanel({ store }: Props) {
  const { state } = store;

  return (
    <aside className="bcvb-builder-right">
      <div className="bcvb-side-stack">
        <div className="bcvb-panel">
          <div className="bcvb-panel-title">Vue coach</div>
          <div className="bcvb-panel-subtitle">
            Lecture rapide et opérationnelle de la situation en cours
          </div>

          <div className="bcvb-form-stack" style={{ marginTop: 14 }}>
            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Titre</div>
              <strong>{state.meta.title || "Nouvelle situation"}</strong>
            </div>

            <div className="bcvb-form-grid">
              <div className="bcvb-form-box">
                <div className="bcvb-mini-label">Catégorie</div>
                <strong>{state.meta.categoryId || "—"}</strong>
              </div>

              <div className="bcvb-form-box">
                <div className="bcvb-mini-label">Étape</div>
                <strong>{state.meta.step || "—"}</strong>
              </div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Thème</div>
              <strong>{state.meta.themeId || "—"}</strong>
            </div>

            <div className="bcvb-form-grid">
              <div className="bcvb-form-box">
                <div className="bcvb-mini-label">Durée</div>
                <strong>
                  {state.meta.duration ? `${state.meta.duration} min` : "—"}
                </strong>
              </div>

              <div className="bcvb-form-box">
                <div className="bcvb-mini-label">Joueurs</div>
                <strong>{state.meta.players || "—"}</strong>
              </div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Format terrain</div>
              <strong>
                {state.meta.baskets === 2 ? "Plein terrain" : "Demi-terrain"}
              </strong>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Objectif</div>
              <div>{state.meta.objective || "Aucun objectif défini."}</div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Intentions BCVB</div>
              {state.meta.intentions.length > 0 ? (
                <div className="bcvb-tag-selector" style={{ marginTop: 8 }}>
                  {state.meta.intentions.map((item) => (
                    <span key={item} className="bcvb-chip bcvb-chip--active">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="bcvb-muted">Aucune intention renseignée.</div>
              )}
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Consignes</div>
              <div>
                {state.meta.instructions.trim().length > 0
                  ? state.meta.instructions
                  : "Aucune consigne rédigée."}
              </div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Critères de réussite</div>
              <div>
                {state.meta.successCriteria.trim().length > 0
                  ? state.meta.successCriteria
                  : "Aucun critère de réussite défini."}
              </div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Variables</div>
              <div>
                {state.meta.variables.trim().length > 0
                  ? state.meta.variables
                  : "Aucune variable définie."}
              </div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Mise en place</div>
              <div>
                {state.meta.setup.trim().length > 0
                  ? state.meta.setup
                  : "Aucune mise en place précisée."}
              </div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Lecture terrain</div>
              <div className="bcvb-muted">
                {state.nodes.length} élément(s) placés · {state.actions.length} action(s)
              </div>
            </div>
          </div>
        </div>

        <CoachingPointsCard store={store} />
        <ExportBar store={store} />
      </div>
    </aside>
  );
}
