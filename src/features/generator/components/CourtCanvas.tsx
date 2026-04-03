import { useRef, useState } from "react";
import type {
	CourtAction,
	CourtNode,
	GeneratorState,
	Position,
} from "../../../types/generator";

type Props = {
	state: GeneratorState;
	onAddNode: (kind: CourtNode["kind"], position: Position) => void;
	onMoveNode: (nodeId: string, position: Position) => void;
	onSelectNode: (nodeId: string | null) => void;
	onSelectAction: (actionId: string | null) => void;
	onNodeAction: (nodeId: string) => void;
};

type ViewBoxPoint = {
	x: number;
	y: number;
};

const HALF_COURT_LENGTH_M = 14;
const FULL_COURT_LENGTH_M = 28;
const COURT_WIDTH_M = 15;

const BASE_HALF_WIDTH = 900;
const BASE_HALF_HEIGHT = (BASE_HALF_WIDTH * COURT_WIDTH_M) / HALF_COURT_LENGTH_M;

const BASE_FULL_WIDTH = 1180;
const BASE_FULL_HEIGHT = (BASE_FULL_WIDTH * COURT_WIDTH_M) / FULL_COURT_LENGTH_M;

const COLORS = {
	red: "#C8102E",
	redDark: "#8F1025",
	black: "#111111",
	dark: "#1A1A1A",
	gray: "#6B7280",
	white: "#FFFFFF",
	court: "#D7A35D",
	courtAlt: "#CF9A54",
	courtSoft: "#E2B777",
	line: "#F8F3EA",
	lineSoft: "rgba(248,243,234,0.58)",
	cone: "#D97706",
	ball: "#EAB308",
	coach: "#14B8A6",
	pass: "#1D4ED8",
	shot: "#15803D",
	dribble: "#C8102E",
	move: "#111111",
};

function clamp(value: number, min: number, max: number) {
	return Math.max(min, Math.min(max, value));
}

function getBaseSize(isFullCourt: boolean) {
	return {
		width: isFullCourt ? BASE_FULL_WIDTH : BASE_HALF_WIDTH,
		height: isFullCourt ? BASE_FULL_HEIGHT : BASE_HALF_HEIGHT,
	};
}

function getPointerInViewBox(
	svg: SVGSVGElement,
	clientX: number,
	clientY: number,
	viewBoxWidth: number,
	viewBoxHeight: number
): ViewBoxPoint {
	const rect = svg.getBoundingClientRect();

	const x = ((clientX - rect.left) / rect.width) * viewBoxWidth;
	const y = ((clientY - rect.top) / rect.height) * viewBoxHeight;

	return {
		x: clamp(x, 0, viewBoxWidth),
		y: clamp(y, 0, viewBoxHeight),
	};
}

function viewBoxToPercentX(x: number, width: number) {
	return (x / width) * 100;
}

function viewBoxToPercentY(y: number, height: number) {
	return (y / height) * 100;
}

function percentToViewBoxX(percent: number, width: number) {
	return (percent / 100) * width;
}

function percentToViewBoxY(percent: number, height: number) {
	return (percent / 100) * height;
}

function snapPercent(value: number, step = 1) {
	return Math.round(value / step) * step;
}

function viewBoxPointToPercentPosition(
	point: ViewBoxPoint,
	viewBoxWidth: number,
	viewBoxHeight: number
): Position {
	return {
		x: clamp(snapPercent(viewBoxToPercentX(point.x, viewBoxWidth), 1), 0, 100),
		y: clamp(snapPercent(viewBoxToPercentY(point.y, viewBoxHeight), 1), 0, 100),
	};
}

function getNodeStyle(kind: CourtNode["kind"]) {
	switch (kind) {
		case "attacker":
			return { fill: "#ffffff", stroke: "#1a1a1a", text: "#9B0B22" };
		case "defender":
			return { fill: "#111111", stroke: "#ffffff", text: "#ffffff" };
		case "coach":
			return { fill: "#14B8A6", stroke: "#1a1a1a", text: "#ffffff" };
		case "cone":
			return { fill: "#D97706", stroke: "#7C2D12", text: "#ffffff" };
		case "ball":
			return { fill: "#EAB308", stroke: "#7C4A00", text: "#1a1a1a" };
	}
}

function CourtWoodBackground({
	width,
	height,
}: {
	width: number;
	height: number;
}) {
	return (
		<>
			<rect
				x="0"
				y="0"
				width={width}
				height={height}
				rx="20"
				fill={COLORS.courtSoft}
			/>
			{Array.from({ length: 22 }).map((_, i) => {
				const stripWidth = width / 22;
				return (
					<rect
						key={`strip-${i}`}
						x={i * stripWidth}
						y="0"
						width={stripWidth}
						height={height}
						fill={i % 2 === 0 ? COLORS.court : COLORS.courtAlt}
						opacity="0.28"
					/>
				);
			})}
			{Array.from({ length: 7 }).map((_, i) => {
				const h = height / 7;
				return (
					<rect
						key={`band-${i}`}
						x="0"
						y={i * h}
						width={width}
						height={h}
						fill={i % 2 === 0 ? "#ffffff" : "#000000"}
						opacity="0.025"
					/>
				);
			})}
		</>
	);
}

function CourtTitleBadge({
	width,
	label,
}: {
	width: number;
	label: string;
}) {
	const badgeWidth = Math.min(280, width * 0.42);
	const badgeHeight = 42;
	const x = width / 2 - badgeWidth / 2;
	const y = 18;

	return (
		<g>
			<rect
				x={x}
				y={y}
				width={badgeWidth}
				height={badgeHeight}
				rx="12"
				fill="rgba(20,20,20,0.88)"
			/>
			<rect
				x={x + 8}
				y={y + 7}
				width="6"
				height={badgeHeight - 14}
				rx="3"
				fill={COLORS.red}
			/>
			<text
				x={x + badgeWidth / 2}
				y={y + 26}
				textAnchor="middle"
				fontSize="14"
				fontWeight="700"
				fill={COLORS.white}
			>
				{label}
			</text>
		</g>
	);
}

function ClippedCircleArc({
	cx,
	cy,
	r,
	stroke,
	strokeWidth,
	clipId,
	clipX,
	clipY,
	clipWidth,
	clipHeight,
}: {
	cx: number;
	cy: number;
	r: number;
	stroke: string;
	strokeWidth: number | string;
	clipId: string;
	clipX: number;
	clipY: number;
	clipWidth: number;
	clipHeight: number;
}) {
	return (
		<g>
			<defs>
				<clipPath id={clipId}>
					<rect x={clipX} y={clipY} width={clipWidth} height={clipHeight} />
				</clipPath>
			</defs>
			<circle
				cx={cx}
				cy={cy}
				r={r}
				fill="none"
				stroke={stroke}
				strokeWidth={strokeWidth}
				clipPath={`url(#${clipId})`}
			/>
		</g>
	);
}

function PremiumCourtLines({
  isFullCourt,
  width,
  height,
}: {
  isFullCourt: boolean;
  width: number;
  height: number;
}) {
  const courtLengthM = isFullCourt ? FULL_COURT_LENGTH_M : HALF_COURT_LENGTH_M;

  const margin = 26;
  const innerWidth = width - margin * 2;
  const innerHeight = height - margin * 2;

  const pxPerMeterX = innerWidth / courtLengthM;
  const pxPerMeterY = innerHeight / COURT_WIDTH_M;
  const pxPerMeter = Math.min(pxPerMeterX, pxPerMeterY);

  const courtWidthPx = courtLengthM * pxPerMeter;
  const courtHeightPx = COURT_WIDTH_M * pxPerMeter;

  const offsetX = (width - courtWidthPx) / 2;
  const offsetY = (height - courtHeightPx) / 2;

  const centerX = offsetX + courtWidthPx / 2;
  const baselineBottomY = offsetY + courtHeightPx;
  const topY = offsetY;

  if (isFullCourt) {
    const midX = offsetX + courtWidthPx / 2;
    const centerCircleRadius = 1.8 * pxPerMeter;

    return (
      <g>
        <rect
          x={offsetX}
          y={offsetY}
          width={courtWidthPx}
          height={courtHeightPx}
          rx="16"
          fill="none"
          stroke={COLORS.line}
          strokeWidth="3"
        />

        <line
          x1={midX}
          y1={topY}
          x2={midX}
          y2={baselineBottomY}
          stroke={COLORS.line}
          strokeWidth="2.2"
        />

        <circle
          cx={midX}
          cy={offsetY + courtHeightPx / 2}
          r={centerCircleRadius}
          fill="none"
          stroke={COLORS.line}
          strokeWidth="2.2"
        />

        <CourtTitleBadge width={width} label="TERRAIN BCVB" />
      </g>
    );
  }

  // --- Géométrie FIBA demi-terrain ---
  const rimOffsetM = 1.575;
  const boardOffsetM = 1.2;
  const rimRadiusM = 0.225;
  const boardWidthM = 1.8;

  const rimY = baselineBottomY - rimOffsetM * pxPerMeter;
  const boardY = baselineBottomY - boardOffsetM * pxPerMeter;
  const rimRadius = rimRadiusM * pxPerMeter;
  const boardHalfWidth = (boardWidthM * pxPerMeter) / 2;

  const keyWidthM = 4.9;
  const keyDepthM = 5.8;
  const keyWidth = keyWidthM * pxPerMeter;
  const keyDepth = keyDepthM * pxPerMeter;
  const keyX = centerX - keyWidth / 2;
  const keyY = baselineBottomY - keyDepth;

  const ftRadiusM = 1.8;
  const ftRadius = ftRadiusM * pxPerMeter;
  const ftCenterY = keyY;

  const restrictedRadiusM = 1.25;
  const restrictedRadius = restrictedRadiusM * pxPerMeter;

  const threeRadiusM = 6.75;
  const threeRadius = threeRadiusM * pxPerMeter;

  const cornerOffsetM = 0.9;
  const sideOffset = cornerOffsetM * pxPerMeter;

  const leftCornerX = offsetX + sideOffset;
  const rightCornerX = offsetX + courtWidthPx - sideOffset;

  // Raccord exact entre segments verticaux et arc 3 pts
  const dx = centerX - leftCornerX;
  const dy = Math.sqrt(Math.max(0, threeRadius * threeRadius - dx * dx));
  const threeArcJoinY = rimY - dy;

  return (
    <g>
      {/* Contour terrain */}
      <rect
        x={offsetX}
        y={offsetY}
        width={courtWidthPx}
        height={courtHeightPx}
        rx="16"
        fill="none"
        stroke={COLORS.line}
        strokeWidth="3"
      />

      {/* Segments droits 3 points */}
      <line
        x1={leftCornerX}
        y1={baselineBottomY}
        x2={leftCornerX}
        y2={threeArcJoinY}
        stroke={COLORS.line}
        strokeWidth="2.3"
      />
      <line
        x1={rightCornerX}
        y1={baselineBottomY}
        x2={rightCornerX}
        y2={threeArcJoinY}
        stroke={COLORS.line}
        strokeWidth="2.3"
      />

      {/* Arc 3 points FIBA, raccord propre */}
      <ClippedCircleArc
        cx={centerX}
        cy={rimY}
        r={threeRadius}
        stroke={COLORS.line}
        strokeWidth="2.3"
        clipId="bcvb-three-arc"
        clipX={leftCornerX}
        clipY={0}
        clipWidth={rightCornerX - leftCornerX}
        clipHeight={threeArcJoinY}
      />

      {/* Raquette */}
      <rect
        x={keyX}
        y={keyY}
        width={keyWidth}
        height={keyDepth}
        fill="none"
        stroke={COLORS.line}
        strokeWidth="2.3"
      />

      {/* Demi-cercle lancer franc : seulement la partie haute */}
      <ClippedCircleArc
        cx={centerX}
        cy={ftCenterY}
        r={ftRadius}
        stroke={COLORS.line}
        strokeWidth="2.3"
        clipId="bcvb-ft-upper"
        clipX={0}
        clipY={0}
        clipWidth={width}
        clipHeight={ftCenterY}
      />

      {/* Panneau */}
      <line
        x1={centerX - boardHalfWidth}
        y1={boardY}
        x2={centerX + boardHalfWidth}
        y2={boardY}
        stroke={COLORS.line}
        strokeWidth="4"
      />

      {/* Panier */}
      <circle
        cx={centerX}
        cy={rimY}
        r={rimRadius}
        fill="none"
        stroke={COLORS.line}
        strokeWidth="2.3"
      />

      {/* Arc de non-charge UNIQUE, orienté vers le terrain */}
      <ClippedCircleArc
        cx={centerX}
        cy={rimY}
        r={restrictedRadius}
        stroke={COLORS.line}
        strokeWidth="2.3"
        clipId="bcvb-restricted-upper"
        clipX={0}
        clipY={0}
        clipWidth={width}
        clipHeight={rimY}
      />

      <CourtTitleBadge width={width} label="DEMI-TERRAIN BCVB" />
    </g>
  );
}

function NodeGlyph({
	node,
	selected,
	viewBoxWidth,
	viewBoxHeight,
	onPointerDown,
	onClick,
}: {
	node: CourtNode;
	selected: boolean;
	viewBoxWidth: number;
	viewBoxHeight: number;
	onPointerDown: (e: React.PointerEvent) => void;
	onClick: () => void;
}) {
	const style = getNodeStyle(node.kind);
	const x = percentToViewBoxX(node.position.x, viewBoxWidth);
	const y = percentToViewBoxY(node.position.y, viewBoxHeight);

	if (node.kind === "cone") {
		return (
			<g transform={`translate(${x}, ${y})`} onPointerDown={onPointerDown} onClick={onClick}>
				<polygon
					points="-10,8 10,8 0,-12"
					fill={style.fill}
					stroke={selected ? COLORS.red : style.stroke}
					strokeWidth={3}
				/>
			</g>
		);
	}

	if (node.kind === "ball") {
		return (
			<g transform={`translate(${x}, ${y})`} onPointerDown={onPointerDown} onClick={onClick}>
				<circle
					r="6"
					fill={style.fill}
					stroke={selected ? COLORS.red : style.stroke}
					strokeWidth={2}
				/>
			</g>
		);
	}

	return (
		<g transform={`translate(${x}, ${y})`} onPointerDown={onPointerDown} onClick={onClick}>
			<circle
				r="16"
				fill={style.fill}
				stroke={selected ? COLORS.red : style.stroke}
				strokeWidth={3}
			/>
			{node.label ? (
				<text
					x="0"
					y="5"
					textAnchor="middle"
					fontSize="11"
					fontWeight="700"
					fill={style.text}
					style={{ userSelect: "none" }}
				>
					{node.label}
				</text>
			) : null}
		</g>
	);
}

function ActionGlyph({
	action,
	nodes,
	selected,
	viewBoxWidth,
	viewBoxHeight,
	onClick,
}: {
	action: CourtAction;
	nodes: CourtNode[];
	selected: boolean;
	viewBoxWidth: number;
	viewBoxHeight: number;
	onClick: () => void;
}) {
	const fromNode = nodes.find((n) => n.id === action.fromNodeId);
	const toNode = nodes.find((n) => n.id === action.toNodeId);

	if (!fromNode || !toNode) return null;

	const x1 = percentToViewBoxX(fromNode.position.x, viewBoxWidth);
	const y1 = percentToViewBoxY(fromNode.position.y, viewBoxHeight);
	const x2 = percentToViewBoxX(toNode.position.x, viewBoxWidth);
	const y2 = percentToViewBoxY(toNode.position.y, viewBoxHeight);

	const color =
		action.kind === "pass"
			? COLORS.pass
			: action.kind === "dribble"
			? COLORS.dribble
			: action.kind === "shot"
			? COLORS.shot
			: selected
			? COLORS.red
			: COLORS.move;

	const dash =
		action.kind === "pass"
			? "10 6"
			: action.kind === "dribble"
			? "4 5"
			: action.kind === "shot"
			? "4 6"
			: undefined;

	return (
		<line
			x1={x1}
			y1={y1}
			x2={x2}
			y2={y2}
			stroke={color}
			strokeWidth={selected ? 4.5 : 3.6}
			strokeDasharray={dash}
			markerEnd="url(#arrowhead)"
			strokeLinecap="round"
			onClick={onClick}
		/>
	);
}

export function CourtCanvas({
	state,
	onAddNode,
	onMoveNode,
	onSelectNode,
	onSelectAction,
	onNodeAction,
}: Props) {
	const svgRef = useRef<SVGSVGElement | null>(null);
	const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

	const isFullCourt = state.meta.baskets === 2;
	const { width: viewBoxWidth, height: viewBoxHeight } = getBaseSize(isFullCourt);

	const actionTools = ["move", "pass", "dribble", "screen", "shot"];

	const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
		if (!svgRef.current) return;

		if (state.selectedTool === "select" || actionTools.includes(state.selectedTool)) {
			onSelectNode(null);
			onSelectAction(null);
			return;
		}

		const point = getPointerInViewBox(
			svgRef.current,
			e.clientX,
			e.clientY,
			viewBoxWidth,
			viewBoxHeight
		);

		const position = viewBoxPointToPercentPosition(point, viewBoxWidth, viewBoxHeight);

		const toolMap = {
			attacker: "attacker",
			defender: "defender",
			coach: "coach",
			cone: "cone",
			ball: "ball",
		} as const;

		const kind = toolMap[state.selectedTool as keyof typeof toolMap];
		if (kind) onAddNode(kind, position);
	};

	const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
		if (!draggedNodeId || !svgRef.current) return;

		const point = getPointerInViewBox(
			svgRef.current,
			e.clientX,
			e.clientY,
			viewBoxWidth,
			viewBoxHeight
		);

		const position = viewBoxPointToPercentPosition(point, viewBoxWidth, viewBoxHeight);
		onMoveNode(draggedNodeId, position);
	};

	return (
		<div className="court-shell">
			<div className="court-header">
				<div>
					<h3>Diagramme terrain FIBA</h3>
					<p>
						{isFullCourt ? "Plein terrain 28 x 15 m" : "Demi-terrain 14 x 15 m"} ·
						place · glisse · relie
					</p>
				</div>
			</div>

			<div className="court-stage-wrap">
				<svg
					ref={svgRef}
					viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
					className="generator-court-svg"
					onClick={handleSvgClick}
					onPointerMove={handlePointerMove}
					onPointerUp={() => setDraggedNodeId(null)}
				>
					<defs>
						<marker
							id="arrowhead"
							markerWidth="10"
							markerHeight="10"
							refX="8"
							refY="5"
							orient="auto"
						>
							<polygon points="0 0, 10 5, 0 10" fill={COLORS.dark} />
						</marker>
					</defs>

					<CourtWoodBackground width={viewBoxWidth} height={viewBoxHeight} />
					<PremiumCourtLines isFullCourt={isFullCourt} width={viewBoxWidth} height={viewBoxHeight} />

					{state.actions.map((action) => (
						<ActionGlyph
							key={action.id}
							action={action}
							nodes={state.nodes}
							selected={state.selectedActionId === action.id}
							viewBoxWidth={viewBoxWidth}
							viewBoxHeight={viewBoxHeight}
							onClick={() => onSelectAction(action.id)}
						/>
					))}

					{state.nodes.map((node) => (
						<NodeGlyph
							key={node.id}
							node={node}
							selected={state.selectedNodeId === node.id}
							viewBoxWidth={viewBoxWidth}
							viewBoxHeight={viewBoxHeight}
							onPointerDown={(e) => {
								e.stopPropagation();
								setDraggedNodeId(node.id);
							}}
							onClick={() => onNodeAction(node.id)}
						/>
					))}
				</svg>
			</div>

			<div className="court-legend-premium">
				{[
					{ label: "Attaquant", color: COLORS.red },
					{ label: "Défenseur", color: COLORS.black },
					{ label: "Coach", color: COLORS.coach },
					{ label: "Cône", color: COLORS.cone },
					{ label: "Ballon", color: COLORS.ball },
				].map((item) => (
					<div key={item.label} className="legend-chip">
						<span className="legend-dot" style={{ background: item.color }} />
						{item.label}
					</div>
				))}
			</div>
		</div>
	);
}
