import { forwardRef } from "react";
import type { OverlayAction, OverlayElement } from "../diagram/fibaOverlaySvg";
import { CourtCanvas } from "./CourtCanvas";
import type { DiagramData } from "../types/session";

type Props = {
	title: string;
	category: string;
	theme: string;
	duration: string;
	objective: string;
	instructions: string[];
	coachingPoints: string[];
	variables: string[];
	successCriteria: string[];
	elements: OverlayElement[];
	actions: OverlayAction[];
};

function renderList(items: string[]) {
	if (items.length === 0) {
		return <div className="bcvb-muted">Non renseigné</div>;
	}

	return (
		<ul className="bcvb-list">
			{items.map((item) => (
				<li key={item} className="bcvb-list-item">
					<span>{item}</span>
				</li>
			))}
		</ul>
	);
}

function buildDiagram(elements: OverlayElement[], actions: OverlayAction[]): DiagramData {
	return {
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
}

export const BCVBSessionExportCard = forwardRef<HTMLDivElement, Props>(function BCVBSessionExportCard(
	{
		title,
		category,
		theme,
		duration,
		objective,
		instructions,
		coachingPoints,
		variables,
		successCriteria,
		elements,
		actions,
	},
	ref,
) {
	const diagram = buildDiagram(elements, actions);

	return (
		<div ref={ref} className="bcvb-panel">
			<div className="bcvb-panel-title">Fiche export</div>
			<div className="bcvb-panel-subtitle">Aperçu structuré de la situation prête à exporter.</div>

			<div className="bcvb-form-stack" style={{ marginTop: 14 }}>
				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Titre</div>
					<strong>{title}</strong>
				</div>
				<div className="bcvb-form-box" style={{ padding: 0, overflow: "hidden" }}>
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
						<div className="bcvb-mini-label">Catégorie</div>
						<strong>{category}</strong>
					</div>
					<div className="bcvb-form-box">
						<div className="bcvb-mini-label">Thème</div>
						<strong>{theme}</strong>
					</div>
				</div>
				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Durée</div>
					<div>{duration}</div>
				</div>
				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Objectif</div>
					<div>{objective}</div>
				</div>
				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Consignes</div>
					{renderList(instructions)}
				</div>
				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Coaching</div>
					{renderList(coachingPoints)}
				</div>
				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Variables</div>
					{renderList(variables)}
				</div>
				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Critères de réussite</div>
					{renderList(successCriteria)}
				</div>
				<div className="bcvb-form-box">
					<div className="bcvb-mini-label">Terrain</div>
					<div className="bcvb-muted">{elements.length} éléments · {actions.length} actions · {diagram.courtType === "full" ? "plein terrain" : "demi-terrain"}</div>
				</div>
			</div>
		</div>
	);
});
