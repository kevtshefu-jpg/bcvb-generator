import { useGeneratorStore } from "../hooks/useGeneratorStore";

type Store = ReturnType<typeof useGeneratorStore>;

type Props = {
  store: Store;
};

export function ContentPanels({ store }: Props) {
  const { state, updateMeta } = store;

  return (
    <div className="bcvb-content-grid">
      <div className="bcvb-card">
        <div className="bcvb-card__title">Organisation</div>
        <textarea
          value={state.meta.setup}
          onChange={(e) => updateMeta({ setup: e.target.value })}
          placeholder="Files, départs, matériel, placement..."
          rows={4}
        />
      </div>

      <div className="bcvb-card">
        <div className="bcvb-card__title">Consignes</div>
        <textarea
          value={state.meta.instructions}
          onChange={(e) => updateMeta({ instructions: e.target.value })}
          placeholder="Déroulement, règles, lancement de l'action..."
          rows={4}
        />
      </div>

      <div className="bcvb-card">
        <div className="bcvb-card__title">Critères de réussite</div>
        <textarea
          value={state.meta.successCriteria}
          onChange={(e) => updateMeta({ successCriteria: e.target.value })}
          placeholder="Ce que le coach veut voir apparaître..."
          rows={4}
        />
      </div>

      <div className="bcvb-card">
        <div className="bcvb-card__title">Variables / évolutions</div>
        <textarea
          value={state.meta.variables}
          onChange={(e) => updateMeta({ variables: e.target.value })}
          placeholder="Ajouter un défenseur, réduire l'espace, limiter les dribbles..."
          rows={4}
        />
      </div>
    </div>
  );
}
