import type { BCVBDiagramSnapshot } from "../diagram/fibaOverlaySvg";

type Props = {
	items: BCVBDiagramSnapshot[];
	currentId: string;
	onOpen: (item: BCVBDiagramSnapshot) => void;
	onDelete: (id: string) => void;
	onExport: (item: BCVBDiagramSnapshot) => void;
};

export function LibraryPanelBCVB({ items, currentId, onOpen, onDelete, onExport }: Props) {
	return (
		<div className="bcvb-panel">
			<div className="bcvb-panel-title">Bibliothèque</div>
			<div className="bcvb-panel-subtitle">Diagrammes enregistrés localement avec ouverture, export et suppression.</div>

			<div className="bcvb-form-stack" style={{ marginTop: 14 }}>
				<div className="bcvb-form-grid">
					<div className="bcvb-form-box">
						<div className="bcvb-mini-label">Entrées</div>
						<strong>{items.length}</strong>
					</div>

					<div className="bcvb-form-box">
						<div className="bcvb-mini-label">Sélection</div>
						<strong>{items.find((item) => item.id === currentId)?.title || "Aucune"}</strong>
					</div>
				</div>

				{items.length === 0 ? (
					<div className="bcvb-empty-box">Aucun diagramme enregistré.</div>
				) : (
					items.map((item) => (
						<div
							key={item.id}
							className="bcvb-form-box"
							style={{
								borderColor: item.id === currentId ? "rgba(200, 16, 46, 0.35)" : undefined,
								boxShadow: item.id === currentId ? "0 0 0 1px rgba(200, 16, 46, 0.12) inset" : undefined,
							}}
						>
							<div className="bcvb-mini-label">{item.id === currentId ? "Courant" : "Enregistré"}</div>
							<strong>{item.title}</strong>
							<div className="bcvb-muted">{item.category || "-"} · {item.theme || "-"}</div>
							<div className="bcvb-muted">{item.elements.length} éléments · {item.actions.length} actions</div>
							<div className="bcvb-button-grid two">
								<button type="button" className="bcvb-btn secondary" onClick={() => onOpen(item)}>
									Ouvrir
								</button>
								<button type="button" className="bcvb-btn secondary" onClick={() => onExport(item)}>
									Export
								</button>
							</div>
							<button type="button" className="bcvb-btn danger" onClick={() => onDelete(item.id)}>
								Supprimer
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
}
