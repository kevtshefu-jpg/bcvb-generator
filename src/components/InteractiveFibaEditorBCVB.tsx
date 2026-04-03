import { CourtCanvas } from "./CourtCanvas";
import type { OverlayAction, OverlayElement } from "../diagram/fibaOverlaySvg";
import type { DiagramData } from "../types/session";

type Props = {
	elements: OverlayElement[];
	actions: OverlayAction[];
	onChangeElements: (elements: OverlayElement[]) => void;
	onChangeActions: (actions: OverlayAction[]) => void;
};

export function InteractiveFibaEditorBCVB({
	elements,
	actions,
	onChangeElements,
	onChangeActions,
}: Props) {
	const diagram: DiagramData = {
		courtType: elements.some((element) => element.x > 15) ? "full" : "half",
		elements: elements.map((element) => ({
			id: element.id,
			type:
				element.type === "label" || element.type === "zone"
					? "zone-label"
					: element.type,
			x: element.x,
			y: element.y,
			label: element.label,
		})),
		actions: actions.map((action) => ({
			id: action.id,
			type: action.type,
			from: { x: action.from.x, y: action.from.y },
			to: { x: action.to.x, y: action.to.y },
			label: action.label,
			order: action.order,
		})),
	};

	return (
		<div className="bcvb-panel">
			<div className="bcvb-panel-title">Éditeur terrain</div>
			<div className="bcvb-panel-subtitle">
				Aperçu compatible du terrain avec résumé rapide de la structure du diagramme.
			</div>

			<div className="bcvb-form-stack" style={{ marginTop: 14 }}>
				<div
					className="bcvb-form-box"
					style={{ padding: 0, overflow: "hidden" }}
				>
					<CourtCanvas
						diagram={diagram}
						selectedElementId={null}
						selectedActionId={null}
						actionCreationType=""
						linkMode={false}
						onSelectElement={() => {}}
						onSelectAction={() => {}}
						onCreateAction={() => {}}
						onChange={() => {}}
					/>
				</div>

				<div className="bcvb-form-grid">
					<div className="bcvb-form-box">
						<div className="bcvb-mini-label">Éléments</div>
						<strong>{elements.length}</strong>
					</div>

					<div className="bcvb-form-box">
						<div className="bcvb-mini-label">Actions</div>
						<strong>{actions.length}</strong>
					</div>
				</div>

				<div className="bcvb-button-grid two">
					<button
						type="button"
						className="bcvb-btn secondary"
						onClick={() => onChangeActions([])}
					>
						Vider les actions
					</button>

					<button
						type="button"
						className="bcvb-btn danger"
						onClick={() => {
							onChangeElements([]);
							onChangeActions([]);
						}}
					>
						Réinitialiser
					</button>
				</div>
			</div>
		</div>
	);
}
