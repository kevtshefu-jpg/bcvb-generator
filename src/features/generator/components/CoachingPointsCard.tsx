import type { useGeneratorStore } from "../hooks/useGeneratorStore";
import { getSuggestions } from "../utils/suggestions";
import type { CategoryId, ThemeId } from "../../../types/referentiel";

type Store = ReturnType<typeof useGeneratorStore>;

interface Props {
  store: Store;
}

export function CoachingPointsCard({ store }: Props) {
  const { state, updateMeta } = store;

  const suggestionSet = getSuggestions(
    state.meta.categoryId as CategoryId,
    state.meta.themeId as ThemeId
  );

  const suggestions = suggestionSet.coachingSuggestions ?? [];

  function toggle(point: string) {
    const current = state.meta.coachingPoints;
    const next = current.includes(point)
      ? current.filter((p) => p !== point)
      : [...current, point];

    updateMeta({ coachingPoints: next });
  }

  function clearAll() {
    updateMeta({ coachingPoints: [] });
  }

  return (
    <div className="bcvb-panel">
      <div className="bcvb-panel-title">Points de coaching</div>
      <div className="bcvb-panel-subtitle">
        Sélectionne les repères que tu veux mettre en avant pour la situation
      </div>

      <div className="bcvb-form-stack" style={{ marginTop: 14 }}>
        <div className="bcvb-label-block">
          <span>Suggestions</span>

          {suggestions.length > 0 ? (
            <div className="bcvb-tag-selector">
              {suggestions.map((item) => {
                const isActive = state.meta.coachingPoints.includes(item);

                return (
                  <button
                    key={item}
                    type="button"
                    className={`bcvb-chip ${
                      isActive ? "bcvb-chip--active" : ""
                    }`}
                    onClick={() => toggle(item)}
                    aria-pressed={isActive}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bcvb-empty-box">
              Aucune suggestion disponible pour cette catégorie et ce thème.
            </div>
          )}
        </div>

        <div className="bcvb-label-block">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span>Points sélectionnés</span>

            {state.meta.coachingPoints.length > 0 ? (
              <button
                type="button"
                className="bcvb-ghost-btn"
                onClick={clearAll}
              >
                Tout retirer
              </button>
            ) : null}
          </div>

          {state.meta.coachingPoints.length === 0 ? (
            <p className="bcvb-empty-hint">
              Aucun point sélectionné pour l’instant.
            </p>
          ) : (
            <ul className="bcvb-list">
              {state.meta.coachingPoints.map((point) => (
                <li key={point} className="bcvb-list-item">
                  <span>{point}</span>

                  <button
                    type="button"
                    className="bcvb-remove-btn"
                    onClick={() => toggle(point)}
                    aria-label={`Retirer "${point}"`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
