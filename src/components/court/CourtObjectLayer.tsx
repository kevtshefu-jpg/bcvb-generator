import type { PointerEvent } from "react";
import type { BallObject, ConeObject, CourtMode, CourtObject, HandsObject, PlayerObject, TextObject } from "../../types/court";
import { clientPointToCourtPoint, toSvgPoint } from "../../lib/courtGeometry";

type CourtObjectLayerProps = {
  mode: CourtMode;
  objects: CourtObject[];
  selectedId?: string;
  editable?: boolean;
  onSelect?: (id: string) => void;
  onObjectChange?: (object: CourtObject) => void;
};

function objectColor(object: CourtObject) {
  if (object.color) return object.color;
  if (object.kind === "defender") return "#101827";
  if (object.kind === "coach") return "#334155";
  if (object.kind === "cone") return "#f97316";
  if (object.kind === "ball") return "#fb923c";
  if (object.kind === "hands") return "#2563eb";
  return "#b5122b";
}

function PlayerGlyph({ object, selected, mode }: { object: PlayerObject; selected: boolean; mode: CourtMode }) {
  const point = toSvgPoint(object, mode);
  const fill = objectColor(object);
  const label = object.number || object.label || (object.kind === "defender" ? "D" : object.kind === "coach" ? "C" : "1");
  return (
    <>
      <circle cx={point.x} cy={point.y} r="32" fill={fill} stroke="#ffffff" strokeWidth="5" />
      {object.kind === "coach" && <rect x={point.x - 22} y={point.y - 22} width="44" height="44" rx="10" fill="none" stroke="#ffffff" strokeWidth="4" />}
      {selected && <circle cx={point.x} cy={point.y} r="42" fill="none" stroke="#101827" strokeWidth="4" strokeDasharray="8 7" />}
      <text x={point.x} y={point.y + 8} textAnchor="middle" className="fastdraw-player-label" fill="#ffffff">
        {label}
      </text>
    </>
  );
}

function ConeGlyph({ object, selected, mode }: { object: ConeObject; selected: boolean; mode: CourtMode }) {
  const point = toSvgPoint(object, mode);
  return (
    <>
      <polygon
        points={`${point.x},${point.y - 22} ${point.x - 18},${point.y + 18} ${point.x + 18},${point.y + 18}`}
        fill={objectColor(object)}
        stroke="#101827"
        strokeWidth="3"
      />
      {selected && <rect x={point.x - 28} y={point.y - 28} width="56" height="56" fill="none" stroke="#101827" strokeWidth="4" strokeDasharray="8 7" />}
    </>
  );
}

function BallGlyph({ object, selected, mode }: { object: BallObject; selected: boolean; mode: CourtMode }) {
  const point = toSvgPoint(object, mode);
  return (
    <>
      <circle cx={point.x} cy={point.y} r="18" fill={objectColor(object)} stroke="#101827" strokeWidth="3" />
      <path d={`M ${point.x - 12} ${point.y} H ${point.x + 12}`} stroke="#101827" strokeWidth="2" />
      <path d={`M ${point.x} ${point.y - 12} V ${point.y + 12}`} stroke="#101827" strokeWidth="2" opacity="0.7" />
      {selected && <circle cx={point.x} cy={point.y} r="28" fill="none" stroke="#101827" strokeWidth="4" strokeDasharray="8 7" />}
    </>
  );
}

function HandsGlyph({ object, selected, mode }: { object: HandsObject; selected: boolean; mode: CourtMode }) {
  const point = toSvgPoint(object, mode);
  const label = object.label || "H";
  return (
    <>
      <path d={`M ${point.x - 22} ${point.y + 16} Q ${point.x - 28} ${point.y - 10} ${point.x - 6} ${point.y - 20}`} fill="none" stroke={objectColor(object)} strokeWidth="8" strokeLinecap="round" />
      <path d={`M ${point.x + 22} ${point.y + 16} Q ${point.x + 28} ${point.y - 10} ${point.x + 6} ${point.y - 20}`} fill="none" stroke={objectColor(object)} strokeWidth="8" strokeLinecap="round" />
      {selected && <circle cx={point.x} cy={point.y} r="34" fill="none" stroke="#101827" strokeWidth="4" strokeDasharray="8 7" />}
      <text x={point.x} y={point.y + 11} textAnchor="middle" className="fastdraw-player-label" fill={objectColor(object)}>
        {label}
      </text>
    </>
  );
}

function TextGlyph({ object, selected, mode }: { object: TextObject; selected: boolean; mode: CourtMode }) {
  const point = toSvgPoint(object, mode);
  return (
    <>
      <text x={point.x} y={point.y} className="fastdraw-text-object" fontSize={object.fontSize || 30}>
        {object.text || object.label}
      </text>
      {selected && <rect x={point.x - 10} y={point.y - 34} width="170" height="46" fill="none" stroke="#101827" strokeWidth="3" strokeDasharray="8 7" />}
    </>
  );
}

export function CourtObjectLayer({ mode, objects, selectedId, editable = false, onSelect, onObjectChange }: CourtObjectLayerProps) {
  function handlePointerMove(object: CourtObject, event: PointerEvent<SVGGElement>) {
    if (!editable || !onObjectChange || event.buttons !== 1 || object.kind === "zone") return;
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const nextPoint = clientPointToCourtPoint(svg, event.clientX, event.clientY, mode);
    onObjectChange({ ...object, x: nextPoint.x, y: nextPoint.y } as CourtObject);
  }

  return (
    <g className="fastdraw-object-layer">
      {objects.filter((object) => object.kind !== "zone").map((object) => {
        const selected = selectedId === object.id;
        return (
          <g
            key={object.id}
            className={`fastdraw-object fastdraw-object--${object.kind}${selected ? " is-selected" : ""}`}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              onSelect?.(object.id);
            }}
            onPointerMove={(event) => handlePointerMove(object, event)}
          >
            {(object.kind === "player" || object.kind === "defender" || object.kind === "coach") && (
              <PlayerGlyph object={object} selected={selected} mode={mode} />
            )}
            {object.kind === "cone" && <ConeGlyph object={object} selected={selected} mode={mode} />}
            {object.kind === "ball" && <BallGlyph object={object} selected={selected} mode={mode} />}
            {object.kind === "hands" && <HandsGlyph object={object} selected={selected} mode={mode} />}
            {object.kind === "text" && <TextGlyph object={object} selected={selected} mode={mode} />}
          </g>
        );
      })}
    </g>
  );
}
