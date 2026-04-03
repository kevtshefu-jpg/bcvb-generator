import type { ToolType } from "../../../types/generator";

type Props = {
	selectedTool: ToolType;
	onSelect: (tool: ToolType) => void;
};

const tools: { key: ToolType; label: string }[] = [
	{ key: "select", label: "Sélection" },
	{ key: "attacker", label: "Attaquant" },
	{ key: "defender", label: "Défenseur" },
	{ key: "coach", label: "Coach" },
	{ key: "cone", label: "Cône" },
	{ key: "ball", label: "Ballon" },
	{ key: "move", label: "Déplacement" },
	{ key: "pass", label: "Passe" },
	{ key: "dribble", label: "Dribble" },
	{ key: "screen", label: "Écran" },
	{ key: "shot", label: "Tir" }
];

export function ToolPalette({ selectedTool, onSelect }: Props) {
	return (
		<div className="bcvb-card">
			<div className="bcvb-card__title">Outils terrain</div>
			<div className="bcvb-tool-grid">
				{tools.map((tool) => (
					<button
						key={tool.key}
						type="button"
						className={`bcvb-tool ${selectedTool === tool.key ? "is-active" : ""}`}
						onClick={() => onSelect(tool.key)}
					>
						{tool.label}
					</button>
				))}
			</div>
		</div>
	);
}
