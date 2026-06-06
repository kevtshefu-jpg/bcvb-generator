import type { PointerEvent } from "react";
import type { CourtMode, MotionPath } from "../../types/court";
import { clientPointToCourtPoint, toSvgPoint } from "../../lib/courtGeometry";
import { buildMotionPath, getMotionColor, getMotionStrokeDash, getMotionStrokeWidth } from "../../lib/courtPaths";

type MotionLayerProps = {
  mode: CourtMode;
  motions: MotionPath[];
  selectedId?: string;
  markerId: string;
  editable?: boolean;
  onSelect?: (id: string) => void;
  onMotionChange?: (motion: MotionPath) => void;
};

function getMotionLabel(kind: MotionPath["kind"]) {
  if (kind === "pass") return "Passe";
  if (kind === "dribble") return "Dribble";
  if (kind === "screen") return "Ecran";
  return "Course";
}

function getScreenBar(from: { x: number; y: number }, to: { x: number; y: number }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  const halfLength = 38;
  return {
    x1: to.x - normal.x * halfLength,
    y1: to.y - normal.y * halfLength,
    x2: to.x + normal.x * halfLength,
    y2: to.y + normal.y * halfLength,
  };
}

export function MotionLayer({ mode, motions, selectedId, markerId, editable = false, onSelect, onMotionChange }: MotionLayerProps) {
  function updateEndpoint(motion: MotionPath, pointName: "from" | "to", event: PointerEvent<SVGCircleElement>) {
    if (!editable || !onMotionChange || event.buttons !== 1) return;
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    onMotionChange({
      ...motion,
      [pointName]: clientPointToCourtPoint(svg, event.clientX, event.clientY, mode),
    });
  }

  return (
    <g className="fastdraw-motion-layer">
      <defs>
        {(["move", "pass", "dribble"] as const).map((kind) => (
          <marker
            key={kind}
            id={`fastdraw-arrow-${kind}-${markerId}`}
            markerWidth="13"
            markerHeight="13"
            refX="11"
            refY="6.5"
            orient="auto"
          >
            <path d="M0,0 L13,6.5 L0,13 z" fill={getMotionColor(kind)} />
          </marker>
        ))}
      </defs>

      {motions.map((motion) => {
        const selected = selectedId === motion.id;
        const color = getMotionColor(motion.kind, motion.color);
        const from = toSvgPoint(motion.from, mode);
        const to = toSvgPoint(motion.to, mode);
        const markerEnd = motion.kind === "screen" ? undefined : `url(#fastdraw-arrow-${motion.kind}-${markerId})`;
        const screenBar = getScreenBar(from, to);

        return (
          <g
            key={motion.id}
            className={`fastdraw-motion fastdraw-motion--${motion.kind}${selected ? " is-selected" : ""}`}
            onPointerDown={(event) => {
              event.stopPropagation();
              onSelect?.(motion.id);
            }}
          >
            <path
              d={buildMotionPath(motion, mode)}
              fill="none"
              stroke={color}
              strokeWidth={getMotionStrokeWidth(motion.kind, motion.strokeWidth)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={getMotionStrokeDash(motion.kind)}
              markerEnd={markerEnd}
            />
            {motion.kind === "screen" && (
              <line
                x1={screenBar.x1}
                y1={screenBar.y1}
                x2={screenBar.x2}
                y2={screenBar.y2}
                stroke={color}
                strokeWidth="10"
                strokeLinecap="round"
              />
            )}
            {selected && (
              <>
                <text x={(from.x + to.x) / 2} y={(from.y + to.y) / 2 - 18} className="fastdraw-motion-label">
                  {getMotionLabel(motion.kind)}
                </text>
                <circle
                  className="fastdraw-motion-handle"
                  cx={from.x}
                  cy={from.y}
                  r="15"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => updateEndpoint(motion, "from", event)}
                />
                <circle
                  className="fastdraw-motion-handle"
                  cx={to.x}
                  cy={to.y}
                  r="15"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture(event.pointerId);
                  }}
                  onPointerMove={(event) => updateEndpoint(motion, "to", event)}
                />
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}
