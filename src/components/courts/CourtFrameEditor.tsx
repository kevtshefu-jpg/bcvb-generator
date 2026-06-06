import type { CourtArrow, CourtObject as SessionCourtObject, CourtType, CourtZone, SessionCourtFrame } from "../../modules/sessions/sessionModels";
import type { CourtFrame, CourtMode, CourtObject, MotionKind, MotionPath, ZoneObject } from "../../types/court";
import { CourtEditor } from "../court/CourtEditor";
import { legacyPointToCourt, normalizeCourtMode } from "../../lib/courtGeometry";

type CourtFrameEditorProps = {
  frame: SessionCourtFrame;
  onChange: (frame: SessionCourtFrame) => void;
  onDuplicate?: () => void;
};

type SessionFrameWithLogo = SessionCourtFrame & {
  showCenterLogo?: boolean;
};

function courtTypeToMode(courtType: CourtType): CourtMode {
  return normalizeCourtMode(courtType);
}

function modeToCourtType(mode: CourtMode): CourtType {
  if (mode === "full") return "full";
  if (mode === "half-left") return "half-left";
  return "half-right";
}

function sessionObjectKind(type: SessionCourtObject["type"]): CourtObject["kind"] {
  if (type === "defense_player" || type === "player_defense") return "defender";
  if (type === "coach") return "coach";
  if (type === "hands") return "hands";
  if (type === "cone") return "cone";
  if (type === "ball") return "ball";
  if (type === "text") return "text";
  if (type === "screen") return "hands";
  return "player";
}

function arrowKind(type: CourtArrow["type"]): MotionKind {
  if (type === "arrow_pass") return "pass";
  if (type === "arrow_dribble") return "dribble";
  if (type === "arrow_screen") return "screen";
  return "move";
}

function motionType(kind: MotionKind): CourtArrow["type"] {
  if (kind === "pass") return "arrow_pass";
  if (kind === "dribble") return "arrow_dribble";
  if (kind === "screen") return "arrow_screen";
  return "arrow_move";
}

function toCourtObject(object: SessionCourtObject, mode: CourtMode): CourtObject {
  const point = legacyPointToCourt({ x: object.x, y: object.y }, mode);
  const kind = sessionObjectKind(object.type);
  const base = {
    id: object.id,
    kind,
    x: point.x,
    y: point.y,
    label: object.text || object.label,
    color: object.color,
  };

  if (kind === "player" || kind === "defender" || kind === "coach") {
    return { ...base, kind, number: object.number || object.label };
  }
  if (kind === "text") {
    return { ...base, kind, text: object.text || object.label || "Texte", fontSize: object.fontSize || 30 };
  }
  return base as CourtObject;
}

function toCourtZone(zone: CourtZone, mode: CourtMode): ZoneObject {
  const point = legacyPointToCourt({ x: zone.x, y: zone.y }, mode);
  return {
    id: zone.id,
    kind: "zone",
    x: point.x,
    y: point.y,
    label: zone.label || "Zone",
    shape: zone.shape || "rounded-rect",
    width: zone.width > 14 ? zone.width / 100 * (mode === "full" ? 28 : 14) : zone.width,
    height: zone.height > 15 ? zone.height / 100 * 15 : zone.height,
    fill: zone.fill || "#b5122b",
    fillOpacity: zone.fillOpacity ?? 0.18,
    stroke: zone.stroke || "#b5122b",
    strokeWidth: zone.strokeWidth ?? 3,
    points: zone.points,
  };
}

function toMotion(arrow: CourtArrow, mode: CourtMode): MotionPath {
  return {
    id: arrow.id,
    kind: arrowKind(arrow.type),
    from: legacyPointToCourt({ x: arrow.fromX, y: arrow.fromY }, mode),
    to: legacyPointToCourt({ x: arrow.toX, y: arrow.toY }, mode),
    control: arrow.control || null,
    color: arrow.color,
    strokeWidth: arrow.strokeWidth,
    curved: arrow.curved ?? arrow.type !== "arrow_move",
  };
}

function toCourtFrame(frame: SessionFrameWithLogo): CourtFrame {
  const mode = courtTypeToMode(frame.courtType);
  return {
    id: frame.id,
    title: frame.title,
    subtitle: frame.intent,
    mode,
    showCenterLogo: mode === "full" ? Boolean(frame.showCenterLogo) : false,
    objects: [
      ...(frame.zones || []).map((zone) => toCourtZone(zone, mode)),
      ...(frame.objects || []).map((object) => toCourtObject(object, mode)),
    ],
    motions: (frame.arrows || []).map((arrow) => toMotion(arrow, mode)),
  };
}

function toSessionObject(object: CourtObject, frameId: string): SessionCourtObject | null {
  if (object.kind === "zone") return null;
  const label = object.kind === "text"
    ? object.text
    : object.kind === "player" || object.kind === "defender" || object.kind === "coach"
      ? object.number || object.label || ""
      : object.label || "";
  const type: SessionCourtObject["type"] =
    object.kind === "defender" ? "defense_player"
      : object.kind === "coach" ? "coach"
      : object.kind === "cone" ? "cone"
        : object.kind === "ball" ? "ball"
          : object.kind === "text" ? "text"
            : object.kind === "hands" ? "hands"
              : "offense_player";

  return {
    id: object.id,
    type,
    x: object.x,
    y: object.y,
    label,
    color: object.color,
    frameId,
    number: object.kind === "player" || object.kind === "defender" || object.kind === "coach" ? object.number : undefined,
    text: object.kind === "text" ? object.text : undefined,
    fontSize: object.kind === "text" ? object.fontSize : undefined,
  };
}

function toSessionZone(zone: ZoneObject): CourtZone {
  return {
    id: zone.id,
    x: zone.x,
    y: zone.y,
    width: zone.width,
    height: zone.height,
    label: zone.label || "Zone",
    shape: zone.shape,
    fill: zone.fill,
    fillOpacity: zone.fillOpacity,
    stroke: zone.stroke,
    strokeWidth: zone.strokeWidth,
    points: zone.points,
  };
}

function toSessionArrow(motion: MotionPath): CourtArrow {
  return {
    id: motion.id,
    type: motionType(motion.kind),
    fromX: motion.from.x,
    fromY: motion.from.y,
    toX: motion.to.x,
    toY: motion.to.y,
    color: motion.color,
    strokeWidth: motion.strokeWidth,
    curved: motion.curved,
    control: motion.control,
  };
}

function toSessionFrame(source: SessionFrameWithLogo, frame: CourtFrame): SessionFrameWithLogo {
  const objects = frame.objects
    .map((object) => toSessionObject(object, source.id))
    .filter(Boolean) as SessionCourtObject[];
  const zones = frame.objects
    .filter((object): object is ZoneObject => object.kind === "zone")
    .map(toSessionZone);

  return {
    ...source,
    title: frame.title,
    intent: frame.subtitle || "",
    courtType: modeToCourtType(frame.mode),
    showCenterLogo: frame.mode === "full" ? Boolean(frame.showCenterLogo) : false,
    objects,
    zones,
    arrows: frame.motions.map(toSessionArrow),
  };
}

export function CourtFrameEditor({ frame, onChange, onDuplicate }: CourtFrameEditorProps) {
  const source = frame as SessionFrameWithLogo;
  return (
    <CourtEditor
      frame={toCourtFrame(source)}
      onChange={(nextFrame) => onChange(toSessionFrame(source, nextFrame))}
      onDuplicate={onDuplicate}
    />
  );
}
