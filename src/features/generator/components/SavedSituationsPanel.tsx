import type { GeneratorState } from "../../../types/generator";
import {
  type SavedSituationItem
} from "../utils/generatorPersistence";

type Props = {
  items: SavedSituationItem[];
  onLoadItem: (item: SavedSituationItem) => void;
  onDeleteItem: (id: string) => void;
  onDuplicateItem: (id: string) => void;
  onSaveCurrent: () => void;
  onSendToSession: (item: SavedSituationItem) => void;
  currentState: GeneratorState;
};

export function SavedSituationsPanel({
  items,
  onLoadItem,
  onDeleteItem,
  onDuplicateItem,
  onSaveCurrent,
  onSendToSession
}: Props) {
  return (
    <div className="bcvb-card">
      <div className="bcvb-card__title">Mes situations BCVB</div>

      <div className="bcvb-stack" style={{ marginBottom: 12 }}>
        <button type="button" className="bcvb-primary-btn" onClick={onSaveCurrent}>
          Sauvegarder la situation actuelle
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bcvb-muted">Aucune situation sauvegardée.</div>
      ) : (
        <div className="bcvb-stack">
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: 12
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6 }}>{item.title}</div>
              <div style={{ fontSize: "0.82rem", color: "#666", marginBottom: 10 }}>
                {item.state.meta.categoryId} · {item.state.meta.themeId} · mis à jour le{" "}
                {new Date(item.updatedAt).toLocaleDateString("fr-FR")}
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="bcvb-secondary"
                  onClick={() => onLoadItem(item)}
                >
                  Charger
                </button>

                <button
                  type="button"
                  className="bcvb-secondary"
                  onClick={() => onDuplicateItem(item.id)}
                >
                  Dupliquer
                </button>

                <button
                  type="button"
                  className="bcvb-secondary"
                  onClick={() => onSendToSession(item)}
                >
                  Envoyer vers la séance
                </button>

                <button
                  type="button"
                  className="bcvb-danger"
                  onClick={() => onDeleteItem(item.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
