export type OverlayElementType =
	| "attacker"
	| "defender"
	| "coach"
	| "cone"
	| "ball"
	| "label"
	| "zone";

export type OverlayPosition = {
	x: number;
	y: number;
};

export interface OverlayElement {
	id: string;
	type: OverlayElementType;
	x: number;
	y: number;
	label?: string;
	width?: number;
	height?: number;
	color?: string;
}

export type OverlayActionType = "move" | "pass" | "dribble" | "cut" | "shot" | "screen";

export interface OverlayAction {
	id: string;
	type: OverlayActionType;
	from: OverlayPosition;
	to: OverlayPosition;
	label?: string;
	order?: number;
}

export interface BCVBDiagramSnapshot {
	id: string;
	title: string;
	category?: string;
	theme?: string;
	createdAt: string;
	updatedAt: string;
	elements: OverlayElement[];
	actions: OverlayAction[];
}
