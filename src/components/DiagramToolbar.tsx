import type {
  DiagramActionType,
  DiagramData,
  DiagramElementType,
} from "../types/session";

interface Props {
  diagram: DiagramData;
  selectedElementId: string | null;
  selectedActionId: string | null;
  actionCreationType: DiagramActionType | "";
  linkMode: boolean;

  onAddElement: (type: DiagramElementType) => void;
  onDeleteSelectedElement: () => void;
  onRenameSelectedElement: (label: string) => void;

  onStartAddAction: (type: DiagramActionType) => void;
  onCancelAddAction: () => void;
  onDeleteSelectedAction: () => void;
  onRenameSelectedAction: (label: string) => void;

  onToggleLinkMode: () => void;

  onMoveSelectedActionForward: () => void;
  onMoveSelectedActionBackward: () => void;
}

export function DiagramToolbar({
  diagram,
  selectedElementId,
  selectedActionId,
  actionCreationType,
  linkMode,
  onAddElement,
  onDeleteSelectedElement,
  onRenameSelectedElement,
  onStartAddAction,
  onCancelAddAction,
  onDeleteSelectedAction,
  onRenameSelectedAction,
  onToggleLinkMode,
  onMoveSelectedActionForward,
  onMoveSelectedActionBackward,
}: Props) {
  const selectedElement = diagram.elements.find((e) => e.id === selectedElementId);
  const selectedAction = diagram.actions.find((a) => a.id === selectedActionId);

  return (
    <div className="diagram-toolbar">
      {/* ========================= */}
      {/* AJOUT ÉLÉMENTS */}
      {/* ========================= */}
      <div className="diagram-toolbar-block">
        <div className="diagram-toolbar-title">Éléments</div>

        <div className="diagram-toolbar-row">
          <button onClick={() => onAddElement("attacker")}>+ Attaquant</button>
          <button onClick={() => onAddElement("defender")}>+ Défenseur</button>
          <button onClick={() => onAddElement("coach")}>+ Coach</button>
          <button onClick={() => onAddElement("cone")}>+ Plot</button>
          <button onClick={() => onAddElement("ball")}>+ Ballon</button>
        </div>

        {selectedElement && (
          <div className="diagram-toolbar-row">
            <input
              type="text"
              value={selectedElement.label || ""}
              placeholder="Nom de l'élément"
              onChange={(e) => onRenameSelectedElement(e.target.value)}
            />
            <button onClick={onDeleteSelectedElement}>Supprimer</button>
          </div>
        )}
      </div>

      {/* ========================= */}
      {/* ACTIONS */}
      {/* ========================= */}
      <div className="diagram-toolbar-block">
        <div className="diagram-toolbar-title">Actions</div>

        <div className="diagram-toolbar-row">
          <button
            onClick={() => onStartAddAction("move")}
            className={actionCreationType === "move" ? "active-tool" : ""}
          >
            Déplacement
          </button>

          <button
            onClick={() => onStartAddAction("pass")}
            className={actionCreationType === "pass" ? "active-tool" : ""}
          >
            Passe
          </button>

          <button
            onClick={() => onStartAddAction("dribble")}
            className={actionCreationType === "dribble" ? "active-tool" : ""}
          >
            Dribble
          </button>

          <button
            onClick={() => onStartAddAction("cut")}
            className={actionCreationType === "cut" ? "active-tool" : ""}
          >
            Coupe
          </button>

          <button
            onClick={() => onStartAddAction("shot")}
            className={actionCreationType === "shot" ? "active-tool" : ""}
          >
            Tir
          </button>

          {actionCreationType && (
            <button onClick={onCancelAddAction}>Annuler</button>
          )}
        </div>

        {selectedAction && (
          <div className="diagram-toolbar-row">
            <input
              type="text"
              value={selectedAction.label || ""}
              onChange={(e) => onRenameSelectedAction(e.target.value)}
            />

            <button onClick={onDeleteSelectedAction}>Supprimer</button>

            <button onClick={onMoveSelectedActionBackward}>↑</button>
            <button onClick={onMoveSelectedActionForward}>↓</button>
          </div>
        )}
      </div>

      {/* ========================= */}
      {/* OPTIONS */}
      {/* ========================= */}
      <div className="diagram-toolbar-block">
        <div className="diagram-toolbar-title">Options</div>

        <div className="diagram-toolbar-row">
          <button onClick={onToggleLinkMode}>
            {linkMode ? "Mode lien activé" : "Activer mode lien"}
          </button>
        </div>

        <div className="diagram-toolbar-hint">
          • Clique sur un élément pour le sélectionner  
          • Clique sur deux points pour créer une action  
          • Utilise les flèches pour organiser les étapes
        </div>
      </div>
    </div>
  );
}
