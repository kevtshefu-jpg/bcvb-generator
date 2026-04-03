import type { GeneratorState } from "../../../types/generator";

export function toSessionText(state: GeneratorState): string {
	const lines: string[] = [];

	lines.push(`# ${state.meta.title || "Situation BCVB"}`);
	lines.push(`Catégorie : ${state.meta.categoryId || "-"}`);
	lines.push(`Thème : ${state.meta.themeId || "-"}`);
	lines.push(`Étape pédagogique : ${state.meta.step || "-"}`);
	lines.push(`Durée : ${state.meta.duration || 0} min`);
	lines.push(`Joueurs : ${state.meta.players || 0}`);
	lines.push(
		`Format terrain : ${state.meta.baskets === 2 ? "Plein terrain" : "Demi-terrain"}`
	);
	lines.push("");

	lines.push("OBJECTIF");
	lines.push(state.meta.objective || "-");
	lines.push("");

	lines.push("INTENTIONS BCVB");
	if (!state.meta.intentions || state.meta.intentions.length === 0) {
		lines.push("- Aucune");
	} else {
		state.meta.intentions.forEach((item) => lines.push(`- ${item}`));
	}
	lines.push("");

	lines.push("CONSIGNES");
	lines.push(state.meta.instructions || "-");
	lines.push("");

	lines.push("CRITÈRES DE RÉUSSITE");
	lines.push(state.meta.successCriteria || "-");
	lines.push("");

	lines.push("VARIABLES");
	lines.push(state.meta.variables || "-");
	lines.push("");

	lines.push("POINTS DE COACHING");
	if (!state.meta.coachingPoints || state.meta.coachingPoints.length === 0) {
		lines.push("- Aucun");
	} else {
		state.meta.coachingPoints.forEach((item) => lines.push(`- ${item}`));
	}
	lines.push("");

	lines.push("MATÉRIEL");
	if (!state.meta.material || state.meta.material.length === 0) {
		lines.push("- Aucun");
	} else {
		state.meta.material.forEach((item) => lines.push(`- ${item}`));
	}
	lines.push("");

	lines.push("MISE EN PLACE");
	lines.push(state.meta.setup || "-");
	lines.push("");

	lines.push("DONNÉES TERRAIN");
	lines.push(`- Éléments placés : ${state.nodes.length}`);
	lines.push(`- Actions tracées : ${state.actions.length}`);

	return lines.join("\n");
}
