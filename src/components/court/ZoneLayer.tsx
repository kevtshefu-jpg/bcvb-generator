import type { PointerEvent } from "react";
import type { CourtMode, ZoneObject } from "../../types/court";
import { clientPointToCourtPoint, toSvgPoint } from "../../lib/courtGeometry";

type ZoneLayerProps = {
  mode: CourtMode;
  zones: ZoneObject[];
  selectedId?: string;
  editable?: boolean;
  onSelect?: (id: string) => void;
  onZoneChange?: (zone: ZoneObject) => void;
};

function zoneLabel(zone: ZoneObject) {
  return zone.label || "Zone";
}

export function ZoneLayer({ mode, zones, selectedId, editable = false, onSelect, onZoneChange }: ZoneLayerProps) {
  function handlePointerMove(zone: ZoneObject, event: PointerEvent<SVGGElement>) {
    if (!editable || !onZoneChange || event.buttons !== 1) return;
    const svg = event.currentTarget.ownerSVGElement;
    if (!svg) return;
    const cursor = clientPointToCourtPoint(svg, event.clientX, event.clientY, mode);
    onZoneChange({
      ...zone,
      x: cursor.x - zone.width / 2,
      y: cursor.y - zone.height / 2,
    });
  }

  return (
    <g className="fastdraw-zone-layer">
      {zones.map((zone) => {
        const point = toSvgPoint({ x: zone.x, y: zone.y }, mode);
        const width = zone.width * 100;
        const height = zone.height * 100;
        const selected = selectedId === zone.id;
        const commonProps = {
          fill: zone.fill,
          fillOpacity: zone.fillOpacity,
          stroke: selected ? "#101827" : zone.stroke,
          strokeWidth: selected ? Math.max(zone.strokeWidth, 5) : zone.strokeWidth,
          strokeDasharray: selected ? "12 8" : undefined,
        };

        return (
          <g
            key={zone.id}
            className={`fastdraw-zone${selected ? " is-selected" : ""}`}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              onSelect?.(zone.id);
            }}
            onPointerMove={(event) => handlePointerMove(zone, event)}
          >
            {zone.shape === "ellipse" ? (
              <ellipse
                cx={point.x + width / 2}
                cy={point.y + height / 2}
                rx={width / 2}
                ry={height / 2}
                {...commonProps}
              />
            ) : zone.shape === "polygon" && zone.points?.length ? (
              <polygon
                points={zone.points.map((item) => {
                  const svgPoint = toSvgPoint(item, mode);
                  return `${svgPoint.x},${svgPoint.y}`;
                }).join(" ")}
                {...commonProps}
              />
            ) : (
              <rect
                x={point.x}
                y={point.y}
                width={width}
                height={height}
                rx={zone.shape === "rounded-rect" ? 24 : 4}
                {...commonProps}
              />
            )}
            <text x={point.x + 14} y={point.y + 28} className="fastdraw-zone-label">
              {zoneLabel(zone)}
            </text>
          </g>
        );
      })}
    </g>
  );
}
