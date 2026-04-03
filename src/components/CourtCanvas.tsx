import type { DiagramActionType, DiagramData } from "../types/session";

type Anchor = {
  x: number;
  y: number;
  elementId?: string | null;
};

type Props = {
  diagram: DiagramData;
  selectedElementId: string | null;
  selectedActionId: string | null;
  actionCreationType: DiagramActionType | "";
  linkMode: boolean;
  onSelectElement: (elementId: string | null) => void;
  onSelectAction: (actionId: string | null) => void;
  onCreateAction: (type: DiagramActionType, from: Anchor, to: Anchor) => void;
  onChange: (diagram: DiagramData) => void;
};

function getCourtDimensions(diagram: DiagramData) {
  return diagram.courtType === "full"
    ? { width: 28, height: 15 }
    : { width: 15, height: 14 };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildScale(diagram: DiagramData) {
  const { width, height } = getCourtDimensions(diagram);
  const padding = 6;
  const innerWidth = 100 - padding * 2;
  const innerHeight = 60 - padding * 2;

  return {
    x(value: number) {
      return padding + (clamp(value, 0, width) / width) * innerWidth;
    },
    y(value: number) {
      return padding + (clamp(value, 0, height) / height) * innerHeight;
    },
    w(value: number) {
      return (value / width) * innerWidth;
    },
    h(value: number) {
      return (value / height) * innerHeight;
    },
  };
}

export function CourtCanvas({
  diagram,
  selectedElementId,
  selectedActionId,
  actionCreationType,
  linkMode,
  onSelectElement,
  onSelectAction,
  onCreateAction,
  onChange,
}: Props) {
  void linkMode;
  void onCreateAction;
  void onChange;

  const scale = buildScale(diagram);
  const isFullCourt = diagram.courtType === "full";

  return (
    <svg
      viewBox="0 0 100 60"
      role="img"
      aria-label="Diagramme de terrain"
      style={{ width: "100%", height: "auto", display: "block", borderRadius: 18 }}
      onClick={() => {
        onSelectElement(null);
        onSelectAction(null);
      }}
    >
      <defs>
        <marker id="legacy-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#111827" />
        </marker>
        <linearGradient id="legacy-court-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f7e7be" />
          <stop offset="100%" stopColor="#e0b977" />
        </linearGradient>
      </defs>

      <rect x="1.5" y="1.5" width="97" height="57" rx="5" fill="#7c4a1d" opacity="0.28" />
      <rect x="3" y="3" width="94" height="54" rx="4" fill="url(#legacy-court-wood)" stroke="#7c4a1d" strokeWidth="1.2" />
      <rect x="6" y="6" width="88" height="48" rx="2.5" fill="none" stroke="#ffffff" strokeWidth="0.9" opacity="0.9" />

      {isFullCourt ? (
        <>
          <line x1="50" y1="6" x2="50" y2="54" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
          <circle cx="50" cy="30" r="7" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
        </>
      ) : (
        <>
          <rect x="6" y="17" width="19" height="26" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
          <rect x="6" y="22.8" width="8.5" height="14.4" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
          <circle cx="12.4" cy="30" r="0.9" fill="#ffffff" opacity="0.9" />
          <path d="M14.6,20 A11.5,11.5 0 0 1 14.6,40" fill="none" stroke="#ffffff" strokeWidth="0.8" opacity="0.9" />
        </>
      )}

      {diagram.actions.map((action) => {
        const isSelected = action.id === selectedActionId;
        const x1 = scale.x(action.from.x);
        const y1 = scale.y(action.from.y);
        const x2 = scale.x(action.to.x);
        const y2 = scale.y(action.to.y);
        const strokeColor = isSelected ? "#c8102e" : action.type === "shot" ? "#0f766e" : "#111827";
        const dasharray =
          action.type === "pass"
            ? "2.8 2.8"
            : action.type === "dribble"
              ? "1.6 1.8"
              : action.type === "screen"
                ? "5 2"
                : undefined;

        return (
          <g
            key={action.id}
            onClick={(event) => {
              event.stopPropagation();
              onSelectAction(action.id);
              onSelectElement(null);
            }}
          >
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={strokeColor}
              strokeWidth={isSelected ? 1.4 : 1}
              strokeDasharray={dasharray}
              markerEnd="url(#legacy-arrowhead)"
            />
            {action.label ? (
              <text
                x={(x1 + x2) / 2}
                y={(y1 + y2) / 2 - 1.7}
                fontSize="2.4"
                textAnchor="middle"
                fill="#111827"
              >
                {action.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {diagram.elements.map((element) => {
        const isSelected = element.id === selectedElementId;
        const fill =
          element.type === "defender"
            ? "#111827"
            : element.type === "coach"
              ? "#2563eb"
              : element.type === "cone"
                ? "#d97706"
                : element.type === "ball"
                  ? "#b45309"
                  : "#ffffff";
        const stroke = isSelected ? "#c8102e" : "#111827";

        if (element.type === "zone-label") {
          return (
            <g
              key={element.id}
              onClick={(event) => {
                event.stopPropagation();
                onSelectElement(element.id);
                onSelectAction(null);
              }}
            >
              <rect
                x={scale.x(element.x) - 6}
                y={scale.y(element.y) - 3}
                width="12"
                height="6"
                rx="2"
                fill="rgba(37, 99, 235, 0.12)"
                stroke={stroke}
                strokeWidth="0.7"
              />
              <text x={scale.x(element.x)} y={scale.y(element.y) + 0.8} fontSize="2.5" textAnchor="middle" fill="#111827">
                {element.label || "Zone"}
              </text>
            </g>
          );
        }

        return (
          <g
            key={element.id}
            onClick={(event) => {
              event.stopPropagation();
              onSelectElement(element.id);
              onSelectAction(null);
            }}
          >
            <circle cx={scale.x(element.x)} cy={scale.y(element.y)} r="3.2" fill={fill} stroke={stroke} strokeWidth={isSelected ? 1.2 : 0.8} />
            {element.label ? (
              <text
                x={scale.x(element.x)}
                y={scale.y(element.y) + 0.9}
                fontSize="2.5"
                textAnchor="middle"
                fill={element.type === "defender" ? "#ffffff" : "#111827"}
              >
                {element.label}
              </text>
            ) : null}
          </g>
        );
      })}

      {actionCreationType ? (
        <text x="50" y="56" fontSize="2.8" textAnchor="middle" fill="#c8102e">
          Outil action actif : {actionCreationType}
        </text>
      ) : null}

      {linkMode ? (
        <text x="11" y="10" fontSize="2.3" fill="#c8102e">
          mode liaison
        </text>
      ) : null}
    </svg>
  );
}