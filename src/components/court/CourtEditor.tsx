import { useMemo, useRef, useState, type PointerEvent } from "react";
import type { CourtFrame, CourtMode, CourtObject, CourtObjectKind, CourtPoint, MotionKind, MotionPath, ZoneObject } from "../../types/court";
import { clampCourtPoint, clientPointToCourtPoint, getCourtSize, toSvgPoint } from "../../lib/courtGeometry";
import { exportCourtPngFromElement, exportCourtSvgFromElement } from "../../lib/courtExport";
import { FibaCourtSvg } from "./FibaCourtSvg";
import { ZoneLayer } from "./ZoneLayer";
import { MotionLayer } from "./MotionLayer";
import { CourtObjectLayer } from "./CourtObjectLayer";
import { CourtToolbar, type CourtActiveTool } from "./CourtToolbar";
import { CourtPropertiesPanel } from "./CourtPropertiesPanel";
import "../../styles/court.css";

type CourtSelection =
  | { type: "object"; id: string }
  | { type: "motion"; id: string }
  | null;

type PendingMotionStart = {
  kind: MotionKind;
  from: CourtPoint;
} | null;

type CourtEditorProps = {
  frame: CourtFrame;
  onChange: (frame: CourtFrame) => void;
  onDuplicate?: () => void;
};

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function isZoneObject(object: CourtObject): object is ZoneObject {
  return object.kind === "zone";
}

function defaultObject(kind: CourtObjectKind, mode: CourtMode, existingCount: number): CourtObject {
  const size = getCourtSize(mode);
  const x = Math.max(1.2, Math.min(size.width - 1.2, 2.6 + existingCount * 0.8));
  const y = Math.max(1.2, Math.min(size.height - 1.2, 4.8 + (existingCount % 5) * 1.15));

  if (kind === "player") {
    return { id: createId("obj"), kind, x, y, number: String(existingCount + 1), label: String(existingCount + 1), color: "#b5122b" };
  }
  if (kind === "defender") {
    return { id: createId("obj"), kind, x, y, number: "D", label: "D", color: "#101827" };
  }
  if (kind === "coach") {
    return { id: createId("obj"), kind, x, y, number: "C", label: "C", color: "#334155" };
  }
  if (kind === "cone") {
    return { id: createId("obj"), kind, x, y, label: "Plot", color: "#f97316" };
  }
  if (kind === "ball") {
    return { id: createId("obj"), kind, x, y, label: "Ballon", color: "#fb923c" };
  }
  if (kind === "hands") {
    return { id: createId("obj"), kind, x, y, label: "H", color: "#2563eb" };
  }
  if (kind === "text") {
    return { id: createId("obj"), kind, x, y, label: "Consigne", text: "Consigne", fontSize: 30, color: "#101827" };
  }

  return {
    id: createId("zone"),
    kind: "zone",
    x: size.width * 0.32,
    y: size.height * 0.22,
    label: "Zone cible",
    shape: "rounded-rect",
    width: Math.min(4.4, size.width * 0.36),
    height: 2.8,
    fill: "#b5122b",
    fillOpacity: 0.18,
    stroke: "#b5122b",
    strokeWidth: 3,
  };
}

function defaultMotion(kind: MotionKind, mode: CourtMode): MotionPath {
  const size = getCourtSize(mode);
  return {
    id: createId("motion"),
    kind,
    from: { x: size.width * 0.28, y: size.height * 0.62 },
    to: { x: size.width * 0.64, y: size.height * 0.38 },
    curved: kind !== "move",
    strokeWidth: kind === "screen" ? 10 : undefined,
  };
}

function positionZoneAt(zone: ZoneObject, point: CourtPoint, mode: CourtMode): ZoneObject {
  const size = getCourtSize(mode);
  return {
    ...zone,
    x: Math.max(0, Math.min(size.width - zone.width, point.x - zone.width / 2)),
    y: Math.max(0, Math.min(size.height - zone.height, point.y - zone.height / 2)),
  };
}

function getAutomaticControlPoint(from: CourtPoint, to: CourtPoint, mode: CourtMode): CourtPoint {
  const middle = {
    x: (from.x + to.x) / 2,
    y: (from.y + to.y) / 2,
  };
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance < 0.2) return clampCourtPoint(middle, mode);
  const offset = Math.min(1.2, distance * 0.18);
  return clampCourtPoint({
    x: middle.x - (dy / distance) * offset,
    y: middle.y + (dx / distance) * offset,
  }, mode);
}

function clampFrameToMode(frame: CourtFrame, mode: CourtMode): CourtFrame {
  return {
    ...frame,
    mode,
    showCenterLogo: mode === "full" ? frame.showCenterLogo : false,
    objects: frame.objects.map((object) => {
      const point = clampCourtPoint(object, mode);
      return { ...object, ...point } as CourtObject;
    }),
    motions: frame.motions.map((motion) => ({
      ...motion,
      from: clampCourtPoint(motion.from, mode),
      to: clampCourtPoint(motion.to, mode),
      control: motion.control ? clampCourtPoint(motion.control, mode) : motion.control,
    })),
  };
}

export function CourtEditor({ frame, onChange, onDuplicate }: CourtEditorProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selection, setSelection] = useState<CourtSelection>(null);
  const [activeTool, setActiveTool] = useState<CourtActiveTool>(null);
  const [curvedMode, setCurvedMode] = useState(false);
  const [pendingMotion, setPendingMotion] = useState<PendingMotionStart>(null);
  const zones = useMemo(() => frame.objects.filter(isZoneObject), [frame.objects]);
  const selectedObject = selection?.type === "object"
    ? frame.objects.find((object) => object.id === selection.id)
    : undefined;
  const selectedMotion = selection?.type === "motion"
    ? frame.motions.find((motion) => motion.id === selection.id)
    : undefined;
  const markerId = frame.id.replace(/[^a-zA-Z0-9_-]/g, "");

  function updateObject(nextObject: CourtObject) {
    onChange({
      ...frame,
      objects: frame.objects.map((object) => object.id === nextObject.id ? nextObject : object),
    });
  }

  function updateMotion(nextMotion: MotionPath) {
    onChange({
      ...frame,
      motions: frame.motions.map((motion) => motion.id === nextMotion.id ? nextMotion : motion),
    });
  }

  function addObjectAt(kind: CourtObjectKind, point: CourtPoint) {
    const baseObject = defaultObject(kind, frame.mode, frame.objects.length);
    const nextObject = baseObject.kind === "zone"
      ? positionZoneAt(baseObject, point, frame.mode)
      : { ...baseObject, ...clampCourtPoint(point, frame.mode) } as CourtObject;
    onChange({ ...frame, objects: [...frame.objects, nextObject] });
    setSelection({ type: "object", id: nextObject.id });
  }

  function addZoneAt(point: CourtPoint) {
    addObjectAt("zone", point);
  }

  function completeMotion(kind: MotionKind, from: CourtPoint, to: CourtPoint) {
    const nextMotion = {
      ...defaultMotion(kind, frame.mode),
      from,
      to,
      control: curvedMode ? getAutomaticControlPoint(from, to, frame.mode) : null,
      curved: curvedMode,
    };
    onChange({ ...frame, motions: [...frame.motions, nextMotion] });
    setSelection({ type: "motion", id: nextMotion.id });
  }

  function handleCourtPointerDown(event: PointerEvent<SVGSVGElement>) {
    if (event.button !== 0) return;
    const svg = svgRef.current || event.currentTarget;
    const point = clientPointToCourtPoint(svg, event.clientX, event.clientY, frame.mode);

    if (!activeTool) {
      setSelection(null);
      setPendingMotion(null);
      return;
    }

    if (activeTool.type === "object") {
      addObjectAt(activeTool.kind, point);
      return;
    }

    if (activeTool.type === "zone") {
      addZoneAt(point);
      return;
    }

    if (!pendingMotion || pendingMotion.kind !== activeTool.kind) {
      setPendingMotion({ kind: activeTool.kind, from: point });
      setSelection(null);
      return;
    }

    completeMotion(activeTool.kind, pendingMotion.from, point);
    setPendingMotion(null);
  }

  function selectObjectTool(kind: CourtObjectKind) {
    setActiveTool({ type: "object", kind });
    setPendingMotion(null);
  }

  function selectMotionTool(kind: MotionKind) {
    setActiveTool({ type: "motion", kind });
    setPendingMotion(null);
  }

  function selectZoneTool() {
    setActiveTool({ type: "zone" });
    setPendingMotion(null);
  }

  function clearTool() {
    setActiveTool(null);
    setPendingMotion(null);
  }

  function deleteObject(id: string) {
    onChange({ ...frame, objects: frame.objects.filter((object) => object.id !== id) });
    setSelection(null);
  }

  function deleteMotion(id: string) {
    onChange({ ...frame, motions: frame.motions.filter((motion) => motion.id !== id) });
    setSelection(null);
  }

  return (
    <section className="fastdraw-editor">
      <div className="fastdraw-editor__header">
        <div>
          <span>Editeur tactique FIBA</span>
          <input
            value={frame.title}
            onChange={(event) => onChange({ ...frame, title: event.target.value })}
            aria-label="Titre du terrain"
            placeholder="Titre du terrain"
          />
        </div>
        <input
          value={frame.subtitle || ""}
          onChange={(event) => onChange({ ...frame, subtitle: event.target.value })}
          aria-label="Objectif de la frame"
          placeholder="Objectif, principe de jeu, forme de jeu..."
        />
      </div>

      <CourtToolbar
        mode={frame.mode}
        activeTool={activeTool}
        curvedMode={curvedMode}
        pendingMotionLabel={pendingMotion ? "Depart pose : clique l'arrivee" : undefined}
        showCenterLogo={frame.showCenterLogo}
        onModeChange={(mode) => {
          setPendingMotion(null);
          onChange(clampFrameToMode(frame, mode));
        }}
        onLogoChange={(showCenterLogo) => onChange({ ...frame, showCenterLogo: frame.mode === "full" ? showCenterLogo : false })}
        onSelectObjectTool={selectObjectTool}
        onSelectMotionTool={selectMotionTool}
        onSelectZoneTool={selectZoneTool}
        onCurvedModeChange={setCurvedMode}
        onClearTool={clearTool}
        onDuplicate={onDuplicate}
        onExportSvg={() => exportCourtSvgFromElement(svgRef.current, frame.title)}
        onExportPng={() => void exportCourtPngFromElement(svgRef.current, frame.title)}
      />

      <div className="fastdraw-editor__workspace">
        <div className="fastdraw-stage" data-court-editor-id={frame.id}>
          <FibaCourtSvg ref={svgRef} frame={frame} onCourtPointerDown={handleCourtPointerDown}>
            {pendingMotion && (
              <g className="fastdraw-pending-motion">
                <circle cx={toSvgPoint(pendingMotion.from, frame.mode).x} cy={toSvgPoint(pendingMotion.from, frame.mode).y} r="18" />
                <text x={toSvgPoint(pendingMotion.from, frame.mode).x + 24} y={toSvgPoint(pendingMotion.from, frame.mode).y - 18}>
                  Depart
                </text>
              </g>
            )}
            <ZoneLayer
              mode={frame.mode}
              zones={zones}
              selectedId={selectedObject?.kind === "zone" ? selectedObject.id : undefined}
              editable
              onSelect={(id) => setSelection({ type: "object", id })}
              onZoneChange={updateObject}
            />
            <MotionLayer
              mode={frame.mode}
              motions={frame.motions}
              selectedId={selectedMotion?.id}
              markerId={markerId}
              editable
              onSelect={(id) => setSelection({ type: "motion", id })}
              onMotionChange={updateMotion}
            />
            <CourtObjectLayer
              mode={frame.mode}
              objects={frame.objects}
              selectedId={selectedObject?.kind !== "zone" ? selectedObject?.id : undefined}
              editable
              onSelect={(id) => setSelection({ type: "object", id })}
              onObjectChange={updateObject}
            />
          </FibaCourtSvg>
        </div>

        <CourtPropertiesPanel
          selectedObject={selectedObject}
          selectedMotion={selectedMotion}
          onObjectChange={updateObject}
          onMotionChange={updateMotion}
          onDeleteObject={deleteObject}
          onDeleteMotion={deleteMotion}
          onClearSelection={() => setSelection(null)}
        />
      </div>

      <div className="fastdraw-legend" aria-label="Legende des actions">
        <span className="fastdraw-legend__move">Course</span>
        <span className="fastdraw-legend__pass">Passe</span>
        <span className="fastdraw-legend__dribble">Dribble</span>
        <span className="fastdraw-legend__screen">Ecran</span>
        <span className="fastdraw-legend__zone">Zone coloree</span>
      </div>
    </section>
  );
}
