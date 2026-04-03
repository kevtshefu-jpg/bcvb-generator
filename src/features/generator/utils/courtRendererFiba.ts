import type { CourtAction, CourtNode } from "../../../types/generator";
import {
  getCourtMeters,
  getCourtScale
} from "./courtGeometry";
import {
  renderFullCourtMarkupFiba,
  renderHalfCourtMarkupFiba
} from "./courtMarkupFiba";

export type CourtRenderMode = "half" | "full";

type RenderOptions = {
  mode: CourtRenderMode;
  targetHeightPx?: number;
  outerPaddingPx?: number;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getNodeStyle(kind: CourtNode["kind"]) {
  switch (kind) {
    case "attacker":
      return { fill: "#ffffff", stroke: "#1a1a1a", text: "#9B0B22" };
    case "defender":
      return { fill: "#111111", stroke: "#ffffff", text: "#ffffff" };
    case "coach":
      return { fill: "#7DE2D1", stroke: "#1a1a1a", text: "#1a1a1a" };
    case "cone":
      return { fill: "#D97706", stroke: "#7C2D12", text: "#ffffff" };
    case "ball":
      return { fill: "#F4B400", stroke: "#7C4A00", text: "#1a1a1a" };
  }
}

function renderNode(node: CourtNode, widthPx: number, heightPx: number) {
  const style = getNodeStyle(node.kind);
  const x = (node.position.x / 100) * widthPx;
  const y = (node.position.y / 100) * heightPx;

  if (node.kind === "cone") {
    return `
      <g transform="translate(${x}, ${y})">
        <polygon points="-10,8 10,8 0,-12" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2.4" />
      </g>
    `;
  }

  if (node.kind === "ball") {
    return `
      <g transform="translate(${x}, ${y})">
        <circle r="6" fill="${style.fill}" stroke="${style.stroke}" stroke-width="2" />
      </g>
    `;
  }

  return `
    <g transform="translate(${x}, ${y})">
      <circle r="16" fill="${style.fill}" stroke="${style.stroke}" stroke-width="3" />
      ${
        node.label
          ? `<text x="0" y="5" text-anchor="middle" font-size="11" font-weight="700" fill="${style.text}">
              ${escapeXml(node.label)}
            </text>`
          : ""
      }
    </g>
  `;
}

function renderAction(action: CourtAction, nodes: CourtNode[], widthPx: number, heightPx: number) {
  const fromNode = nodes.find((n) => n.id === action.fromNodeId);
  const toNode = nodes.find((n) => n.id === action.toNodeId);
  if (!fromNode || !toNode) return "";

  const x1 = (fromNode.position.x / 100) * widthPx;
  const y1 = (fromNode.position.y / 100) * heightPx;
  const x2 = (toNode.position.x / 100) * widthPx;
  const y2 = (toNode.position.y / 100) * heightPx;

  const color =
    action.kind === "pass"
      ? "#1D4ED8"
      : action.kind === "dribble"
      ? "#C8102E"
      : action.kind === "shot"
      ? "#15803D"
      : "#1A1A1A";

  const dash =
    action.kind === "pass"
      ? `stroke-dasharray="10 6"`
      : action.kind === "dribble"
      ? `stroke-dasharray="4 5"`
      : "";

  return `
    <line
      x1="${x1}"
      y1="${y1}"
      x2="${x2}"
      y2="${y2}"
      stroke="${color}"
      stroke-width="4.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      ${dash}
      marker-end="url(#arrowhead)"
    />
  `;
}

export function renderCourtSvgMarkupFiba(
  nodes: CourtNode[],
  actions: CourtAction[],
  options: RenderOptions
): string {
  const mode = options.mode;
  const targetHeightPx = options.targetHeightPx ?? 760;
  const padding = options.outerPaddingPx ?? 18;

  const scale = getCourtScale(mode, targetHeightPx);
  const size = getCourtMeters(mode);

  const innerWidth = scale.widthPx;
  const innerHeight = scale.heightPx;

  const svgWidth = innerWidth + padding * 2;
  const svgHeight = innerHeight + padding * 2;

  const woodId = `wood-${Math.random().toString(36).slice(2, 10)}`;

  const actionsMarkup = actions
    .map((action) => renderAction(action, nodes, innerWidth, innerHeight))
    .join("");

  const nodesMarkup = nodes
    .map((node) => renderNode(node, innerWidth, innerHeight))
    .join("");

  const courtMarkup =
    mode === "full"
      ? renderFullCourtMarkupFiba(innerWidth, innerHeight, scale.pxPerMeter)
      : renderHalfCourtMarkupFiba(innerWidth, innerHeight, scale.pxPerMeter);

  return `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${svgWidth} ${svgHeight}"
      width="${svgWidth}"
      height="${svgHeight}"
      role="img"
      aria-label="Terrain FIBA ${size.lengthM} x ${size.widthM}"
    >
      <defs>
        <linearGradient id="${woodId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#D8A35D" />
          <stop offset="50%" stop-color="#CD9855" />
          <stop offset="100%" stop-color="#C58945" />
        </linearGradient>

        <pattern id="${woodId}-wood" patternUnits="userSpaceOnUse" width="80" height="80">
          <rect width="80" height="80" fill="url(#${woodId})" />
          <path d="M0 0 H80" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
          <path d="M0 20 H80" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
          <path d="M0 40 H80" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
          <path d="M0 60 H80" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
          <path d="M0 0 V80" stroke="rgba(0,0,0,0.04)" stroke-width="1" />
          <path d="M20 0 V80" stroke="rgba(0,0,0,0.03)" stroke-width="1" />
          <path d="M40 0 V80" stroke="rgba(0,0,0,0.04)" stroke-width="1" />
          <path d="M60 0 V80" stroke="rgba(0,0,0,0.03)" stroke-width="1" />
        </pattern>

        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
          <polygon points="0 0, 10 5, 0 10" fill="#1A1A1A" />
        </marker>
      </defs>

      <rect x="0" y="0" width="${svgWidth}" height="${svgHeight}" rx="18" fill="#ffffff" />

      <g transform="translate(${padding}, ${padding})">
        <rect x="0" y="0" width="${innerWidth}" height="${innerHeight}" rx="12" fill="url(#${woodId}-wood)" />

        ${courtMarkup}
        ${actionsMarkup}
        ${nodesMarkup}
      </g>
    </svg>
  `;
}