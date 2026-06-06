import type { CourtObject, MotionKind, MotionPath, ZoneObject, ZoneShape } from "../../types/court";

type CourtPropertiesPanelProps = {
  selectedObject?: CourtObject;
  selectedMotion?: MotionPath;
  onObjectChange: (object: CourtObject) => void;
  onMotionChange: (motion: MotionPath) => void;
  onDeleteObject: (id: string) => void;
  onDeleteMotion: (id: string) => void;
  onClearSelection: () => void;
};

function toNumber(value: string, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function isZoneObject(object?: CourtObject): object is ZoneObject {
  return object?.kind === "zone";
}

function getObjectLabelValue(object: CourtObject) {
  if (object.kind === "text") return object.text || object.label || "";
  if (object.kind === "player" || object.kind === "defender" || object.kind === "coach") {
    return object.number || object.label || "";
  }
  return object.label || "";
}

function setObjectLabelValue(object: CourtObject, value: string): CourtObject {
  if (object.kind === "text") return { ...object, text: value, label: value };
  if (object.kind === "player" || object.kind === "defender" || object.kind === "coach") {
    return { ...object, label: value, number: value };
  }
  return { ...object, label: value } as CourtObject;
}

export function CourtPropertiesPanel({
  selectedObject,
  selectedMotion,
  onObjectChange,
  onMotionChange,
  onDeleteObject,
  onDeleteMotion,
  onClearSelection,
}: CourtPropertiesPanelProps) {
  const hasSelection = selectedObject || selectedMotion;

  return (
    <aside className="fastdraw-properties" aria-label="Proprietes terrain">
      <div className="fastdraw-properties__header">
        <div>
          <span>Selection</span>
          <strong>{selectedObject ? selectedObject.kind : selectedMotion ? selectedMotion.kind : "Aucune"}</strong>
        </div>
        {hasSelection && <button type="button" onClick={onClearSelection}>Fermer</button>}
      </div>

      {!hasSelection && (
        <div className="fastdraw-properties__empty">
          Selectionne un joueur, une zone ou une fleche pour modifier ses proprietes.
        </div>
      )}

      {selectedObject && !isZoneObject(selectedObject) && (
        <div className="fastdraw-properties__form">
          <label>
            Libelle
            <input
              value={getObjectLabelValue(selectedObject)}
              onChange={(event) => {
                const value = event.target.value;
                onObjectChange(setObjectLabelValue(selectedObject, value));
              }}
            />
          </label>
          <label>
            Couleur
            <input
              type="color"
              value={selectedObject.color || (selectedObject.kind === "defender" ? "#101827" : "#b5122b")}
              onChange={(event) => onObjectChange({ ...selectedObject, color: event.target.value } as CourtObject)}
            />
          </label>
          <div className="fastdraw-properties__grid">
            <label>
              X
              <input type="number" step="0.1" value={selectedObject.x} onChange={(event) => onObjectChange({ ...selectedObject, x: toNumber(event.target.value, selectedObject.x) } as CourtObject)} />
            </label>
            <label>
              Y
              <input type="number" step="0.1" value={selectedObject.y} onChange={(event) => onObjectChange({ ...selectedObject, y: toNumber(event.target.value, selectedObject.y) } as CourtObject)} />
            </label>
          </div>
          {selectedObject.kind === "text" && (
            <label>
              Taille texte
              <input
                type="number"
                min="14"
                max="70"
                value={selectedObject.fontSize || 30}
                onChange={(event) => onObjectChange({ ...selectedObject, fontSize: toNumber(event.target.value, selectedObject.fontSize || 30) })}
              />
            </label>
          )}
          <button type="button" className="fastdraw-danger" onClick={() => onDeleteObject(selectedObject.id)}>Supprimer objet</button>
        </div>
      )}

      {selectedObject && isZoneObject(selectedObject) && (
        <div className="fastdraw-properties__form">
          <label>
            Nom zone
            <input value={selectedObject.label || ""} onChange={(event) => onObjectChange({ ...selectedObject, label: event.target.value })} />
          </label>
          <label>
            Forme
            <select value={selectedObject.shape} onChange={(event) => onObjectChange({ ...selectedObject, shape: event.target.value as ZoneShape })}>
              <option value="rounded-rect">Rectangle arrondi</option>
              <option value="rect">Rectangle</option>
              <option value="ellipse">Ellipse</option>
              <option value="polygon">Polygone</option>
            </select>
          </label>
          <div className="fastdraw-properties__grid">
            <label>
              X
              <input type="number" step="0.1" value={selectedObject.x} onChange={(event) => onObjectChange({ ...selectedObject, x: toNumber(event.target.value, selectedObject.x) })} />
            </label>
            <label>
              Y
              <input type="number" step="0.1" value={selectedObject.y} onChange={(event) => onObjectChange({ ...selectedObject, y: toNumber(event.target.value, selectedObject.y) })} />
            </label>
            <label>
              Largeur
              <input type="number" step="0.1" value={selectedObject.width} onChange={(event) => onObjectChange({ ...selectedObject, width: toNumber(event.target.value, selectedObject.width) })} />
            </label>
            <label>
              Hauteur
              <input type="number" step="0.1" value={selectedObject.height} onChange={(event) => onObjectChange({ ...selectedObject, height: toNumber(event.target.value, selectedObject.height) })} />
            </label>
          </div>
          <label>
            Couleur zone
            <input type="color" value={selectedObject.fill} onChange={(event) => onObjectChange({ ...selectedObject, fill: event.target.value })} />
          </label>
          <label>
            Opacite
            <input
              type="range"
              min="0.08"
              max="0.55"
              step="0.01"
              value={selectedObject.fillOpacity}
              onChange={(event) => onObjectChange({ ...selectedObject, fillOpacity: toNumber(event.target.value, selectedObject.fillOpacity) })}
            />
          </label>
          <button type="button" className="fastdraw-danger" onClick={() => onDeleteObject(selectedObject.id)}>Supprimer zone</button>
        </div>
      )}

      {selectedMotion && (
        <div className="fastdraw-properties__form">
          <label>
            Type action
            <select value={selectedMotion.kind} onChange={(event) => onMotionChange({ ...selectedMotion, kind: event.target.value as MotionKind })}>
              <option value="move">Course</option>
              <option value="pass">Passe</option>
              <option value="dribble">Dribble</option>
              <option value="screen">Ecran</option>
            </select>
          </label>
          <label>
            Couleur
            <input type="color" value={selectedMotion.color || "#b5122b"} onChange={(event) => onMotionChange({ ...selectedMotion, color: event.target.value })} />
          </label>
          <div className="fastdraw-properties__grid">
            <label>
              Depart X
              <input type="number" step="0.1" value={selectedMotion.from.x} onChange={(event) => onMotionChange({ ...selectedMotion, from: { ...selectedMotion.from, x: toNumber(event.target.value, selectedMotion.from.x) } })} />
            </label>
            <label>
              Depart Y
              <input type="number" step="0.1" value={selectedMotion.from.y} onChange={(event) => onMotionChange({ ...selectedMotion, from: { ...selectedMotion.from, y: toNumber(event.target.value, selectedMotion.from.y) } })} />
            </label>
            <label>
              Arrivee X
              <input type="number" step="0.1" value={selectedMotion.to.x} onChange={(event) => onMotionChange({ ...selectedMotion, to: { ...selectedMotion.to, x: toNumber(event.target.value, selectedMotion.to.x) } })} />
            </label>
            <label>
              Arrivee Y
              <input type="number" step="0.1" value={selectedMotion.to.y} onChange={(event) => onMotionChange({ ...selectedMotion, to: { ...selectedMotion.to, y: toNumber(event.target.value, selectedMotion.to.y) } })} />
            </label>
          </div>
          <label className="fastdraw-checkbox">
            <input type="checkbox" checked={Boolean(selectedMotion.curved)} onChange={(event) => onMotionChange({ ...selectedMotion, curved: event.target.checked })} />
            Courbe
          </label>
          <button type="button" className="fastdraw-danger" onClick={() => onDeleteMotion(selectedMotion.id)}>Supprimer action</button>
        </div>
      )}
    </aside>
  );
}
