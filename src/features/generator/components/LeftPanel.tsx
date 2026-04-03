import { categories } from "../../../data/categories";
import { themes } from "../../../data/themes";
import type { CategoryId, PedagogicStep, ThemeId } from "../../../types/referentiel";
import type { useGeneratorStore } from "../hooks/useGeneratorStore";
import { ToolPalette } from "./ToolPalette";
import { getSuggestions } from "../utils/suggestions";

type Store = ReturnType<typeof useGeneratorStore>;

interface Props {
  store: Store;
}

const PEDAGOGIC_STEPS: PedagogicStep[] = [
  "Je découvre",
  "Je m'exerce",
  "Je retranscris",
  "Je régule",
];

const MATERIAL_OPTIONS = [
  "Ballons",
  "Cônes",
  "Chasubles",
  "Plots",
  "Échelles",
  "Cerceaux",
];

export function LeftPanel({ store }: Props) {
  const { state, updateMeta } = store;

  const selectedThemeTitle =
    themes.find((theme) => theme.id === state.meta.themeId)?.title ?? "Aucun thème sélectionné";

  const selectedCategory = categories.find((category) => category.id === state.meta.categoryId);

  const suggestionSet = getSuggestions(
    state.meta.categoryId as CategoryId,
    state.meta.themeId as ThemeId,
  );

  const objectiveSuggestions = suggestionSet.objectiveSuggestions ?? [];
  const intentionSuggestions = suggestionSet.intentionSuggestions ?? [];

  const hasObjectiveSuggestions = objectiveSuggestions.length > 0;
  const hasIntentionSuggestions = intentionSuggestions.length > 0;

  function toggleIntention(item: string) {
    const next = state.meta.intentions.includes(item)
      ? state.meta.intentions.filter((value) => value !== item)
      : [...state.meta.intentions, item];

    updateMeta({ intentions: next });
  }

  function toggleMaterial(item: string) {
    const next = state.meta.material.includes(item)
      ? state.meta.material.filter((value) => value !== item)
      : [...state.meta.material, item];

    updateMeta({ material: next });
  }

  return (
    <aside className="bcvb-builder-left">
      <div className="bcvb-side-stack">
        <div className="bcvb-panel">
          <div className="bcvb-panel-title">Repères rapides</div>
          <div className="bcvb-panel-subtitle">
            Renseigne le cadre pédagogique et l’organisation avant de poser la situation.
          </div>

          <div className="bcvb-form-stack" style={{ marginTop: 14 }}>
            <label className="bcvb-label-block">
              <span>Titre</span>
              <input
                className="bcvb-input"
                value={state.meta.title}
                onChange={(event) => updateMeta({ title: event.target.value })}
                placeholder="Nom de la situation"
              />
            </label>

            <div className="bcvb-form-grid">
              <label className="bcvb-label-block">
                <span>Catégorie</span>
                <select
                  className="bcvb-input"
                  value={state.meta.categoryId}
                  onChange={(event) =>
                    updateMeta({ categoryId: event.target.value as CategoryId })
                  }
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bcvb-label-block">
                <span>Thème</span>
                <select
                  className="bcvb-input"
                  value={state.meta.themeId}
                  onChange={(event) => updateMeta({ themeId: event.target.value as ThemeId })}
                >
                  {themes.map((theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="bcvb-form-grid">
              <label className="bcvb-label-block">
                <span>Étape pédagogique</span>
                <select
                  className="bcvb-input"
                  value={state.meta.step}
                  onChange={(event) =>
                    updateMeta({ step: event.target.value as PedagogicStep })
                  }
                >
                  {PEDAGOGIC_STEPS.map((step) => (
                    <option key={step} value={step}>
                      {step}
                    </option>
                  ))}
                </select>
              </label>

              <label className="bcvb-label-block">
                <span>Durée</span>
                <input
                  className="bcvb-input"
                  type="number"
                  min={1}
                  value={state.meta.duration}
                  onChange={(event) =>
                    updateMeta({ duration: Number(event.target.value) || 0 })
                  }
                />
              </label>
            </div>

            <label className="bcvb-label-block">
              <span>Nombre de joueurs</span>
              <input
                className="bcvb-input"
                type="number"
                min={1}
                value={state.meta.players}
                onChange={(event) => updateMeta({ players: Number(event.target.value) || 0 })}
              />
            </label>

            <div className="bcvb-label-block">
              <span>Format terrain</span>
              <div className="bcvb-button-grid two">
                <button
                  type="button"
                  className={`bcvb-btn ${state.meta.baskets === 1 ? "active" : "secondary"}`}
                  onClick={() => updateMeta({ baskets: 1 })}
                >
                  Demi-terrain
                </button>

                <button
                  type="button"
                  className={`bcvb-btn ${state.meta.baskets === 2 ? "active" : "secondary"}`}
                  onClick={() => updateMeta({ baskets: 2 })}
                >
                  Plein terrain
                </button>
              </div>
            </div>

            <label className="bcvb-label-block">
              <span>Objectif</span>
              <textarea
                className="bcvb-textarea"
                value={state.meta.objective}
                onChange={(event) => updateMeta({ objective: event.target.value })}
                placeholder="Exemple : courir large, fixer puis donner, finir vite."
              />
            </label>

            <label className="bcvb-label-block">
              <span>Consignes</span>
              <textarea
                className="bcvb-textarea"
                value={state.meta.instructions}
                onChange={(event) => updateMeta({ instructions: event.target.value })}
                placeholder="Consignes données aux joueurs."
              />
            </label>

            <label className="bcvb-label-block">
              <span>Critères de réussite</span>
              <textarea
                className="bcvb-textarea"
                value={state.meta.successCriteria}
                onChange={(event) => updateMeta({ successCriteria: event.target.value })}
                placeholder="Quels indices montrent que la situation fonctionne ?"
              />
            </label>

            <label className="bcvb-label-block">
              <span>Variables</span>
              <textarea
                className="bcvb-textarea"
                value={state.meta.variables}
                onChange={(event) => updateMeta({ variables: event.target.value })}
                placeholder="Évolutions, contraintes ou simplifications."
              />
            </label>

            <label className="bcvb-label-block">
              <span>Mise en place</span>
              <textarea
                className="bcvb-textarea"
                value={state.meta.setup}
                onChange={(event) => updateMeta({ setup: event.target.value })}
                placeholder="Disposition de départ, files, espaces, matériel."
              />
            </label>

            <div className="bcvb-label-block">
              <span>Matériel</span>
              <div className="bcvb-tag-selector">
                {MATERIAL_OPTIONS.map((item) => {
                  const isActive = state.meta.material.includes(item);

                  return (
                    <button
                      key={item}
                      type="button"
                      className={`bcvb-chip ${isActive ? "bcvb-chip--active" : ""}`}
                      onClick={() => toggleMaterial(item)}
                      aria-pressed={isActive}
                    >
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bcvb-panel">
          <div className="bcvb-panel-title">Outils terrain</div>
          <div className="bcvb-panel-subtitle">
            Choisis un outil puis clique sur le terrain pour construire la situation.
          </div>

          <div className="bcvb-form-stack" style={{ marginTop: 14 }}>
            <ToolPalette selectedTool={state.selectedTool} onSelect={store.setTool} />

            <div className="bcvb-button-grid two">
              <button type="button" className="bcvb-btn secondary" onClick={store.deleteSelected}>
                Supprimer sélection
              </button>

              <button type="button" className="bcvb-btn danger" onClick={store.clearAll}>
                Vider le terrain
              </button>
            </div>
          </div>
        </div>

        <div className="bcvb-panel">
          <div className="bcvb-panel-title">Suggestions BCVB</div>
          <div className="bcvb-panel-subtitle">
            Appuie-toi sur les repères catégorie + thème pour formuler l’intention.
          </div>

          <div className="bcvb-form-stack" style={{ marginTop: 14 }}>
            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Repère catégorie</div>
              <div>{selectedCategory?.finality || "Aucun repère disponible."}</div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Thème sélectionné</div>
              <strong>{selectedThemeTitle}</strong>
            </div>

            <div className="bcvb-label-block">
              <span>Objectifs suggérés</span>

              {hasObjectiveSuggestions ? (
                <div className="bcvb-tag-selector">
                  {objectiveSuggestions.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="bcvb-chip"
                      onClick={() => updateMeta({ objective: item })}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bcvb-empty-box">Aucune suggestion d’objectif disponible.</div>
              )}
            </div>

            <div className="bcvb-label-block">
              <span>Intentions BCVB</span>

              {hasIntentionSuggestions ? (
                <div className="bcvb-tag-selector">
                  {intentionSuggestions.map((item) => {
                    const isActive = state.meta.intentions.includes(item);

                    return (
                      <button
                        key={item}
                        type="button"
                        className={`bcvb-chip ${isActive ? "bcvb-chip--active" : ""}`}
                        onClick={() => toggleIntention(item)}
                        aria-pressed={isActive}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bcvb-empty-box">Aucune intention suggérée pour ce profil.</div>
              )}
            </div>
          </div>
        </div>

        <div className="bcvb-panel">
          <div className="bcvb-panel-title">Vue synthèse</div>
          <div className="bcvb-panel-subtitle">
            Vérifie rapidement les éléments clés avant export ou impression.
          </div>

          <div className="bcvb-form-stack" style={{ marginTop: 14 }}>
            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Situation</div>
              <strong>{state.meta.title || "Nouvelle situation"}</strong>
            </div>

            <div className="bcvb-form-grid">
              <div className="bcvb-form-box">
                <div className="bcvb-mini-label">Catégorie</div>
                <strong>{state.meta.categoryId}</strong>
              </div>

              <div className="bcvb-form-box">
                <div className="bcvb-mini-label">Étape</div>
                <strong>{state.meta.step}</strong>
              </div>
            </div>

            <div className="bcvb-form-grid">
              <div className="bcvb-form-box">
                <div className="bcvb-mini-label">Durée</div>
                <strong>{state.meta.duration} min</strong>
              </div>

              <div className="bcvb-form-box">
                <div className="bcvb-mini-label">Joueurs</div>
                <strong>{state.meta.players}</strong>
              </div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Format</div>
              <div>{state.meta.baskets === 2 ? "Plein terrain" : "Demi-terrain"}</div>
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Intentions sélectionnées</div>
              {state.meta.intentions.length > 0 ? (
                <div className="bcvb-tag-selector" style={{ marginTop: 8 }}>
                  {state.meta.intentions.map((item) => (
                    <span key={item} className="bcvb-chip bcvb-chip--active">
                      {item}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="bcvb-muted">Aucune intention sélectionnée.</div>
              )}
            </div>

            <div className="bcvb-form-box">
              <div className="bcvb-mini-label">Matériel retenu</div>
              <div>
                {state.meta.material.length > 0 ? state.meta.material.join(", ") : "Aucun matériel précisé."}
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
      </div>
    </aside>
  );
}