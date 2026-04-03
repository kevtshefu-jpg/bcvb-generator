import type { GeneratorState } from "../../../types/generator";

function escapeHtml(value: string) {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function createDiagramSnapshotFromGeneratorState(state: GeneratorState) {
	const width = state.meta.baskets === 2 ? 1180 : 900;
	const height = state.meta.baskets === 2 ? 632 : 964;

	const nodeMarkup = state.nodes
		.map((node) => {
			const fill =
				node.kind === "defender"
					? "#111827"
					: node.kind === "coach"
						? "#2563eb"
						: node.kind === "cone"
							? "#d97706"
							: node.kind === "ball"
								? "#b45309"
								: "#ffffff";

			return `<g>
				<circle cx="${node.position.x}" cy="${node.position.y}" r="16" fill="${fill}" stroke="#111827" stroke-width="2" />
				<text x="${node.position.x}" y="${node.position.y + 5}" text-anchor="middle" font-size="11" fill="${node.kind === "defender" ? "#ffffff" : "#111827"}">${escapeHtml(node.label || "")}</text>
			</g>`;
		})
		.join("");

	const actionMarkup = state.actions
		.map((action) => {
			const fromNode = state.nodes.find((node) => node.id === action.fromNodeId);
			const toNode = state.nodes.find((node) => node.id === action.toNodeId);

			if (!fromNode || !toNode) {
				return "";
			}

			return `<line x1="${fromNode.position.x}" y1="${fromNode.position.y}" x2="${toNode.position.x}" y2="${toNode.position.y}" stroke="#111827" stroke-width="3" stroke-dasharray="${action.kind === "pass" ? "8 6" : "0"}" />`;
		})
		.join("");

	return {
		svgMarkup: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" height="100%"><rect x="6" y="6" width="${width - 12}" height="${height - 12}" rx="14" fill="#f6e7bf" stroke="#7c4a1d" stroke-width="6" />${actionMarkup}${nodeMarkup}</svg>`,
	};
}
