import type { CourtMode, CourtPoint, MotionKind, MotionPath } from "../types/court";
import { COURT_SCALE, FIBA_COURT, getCourtSize, getRimPosition, toSvgPoint } from "./courtGeometry";

export function getKeyRect(mode: CourtMode, side: "left" | "right") {
  const size = getCourtSize(mode);
  const keyX = side === "left" ? 0 : size.width - FIBA_COURT.freeThrowLine;
  const keyY = (size.height - FIBA_COURT.keyWidth) / 2;
  return {
    x: keyX * COURT_SCALE,
    y: keyY * COURT_SCALE,
    width: FIBA_COURT.freeThrowLine * COURT_SCALE,
    height: FIBA_COURT.keyWidth * COURT_SCALE,
  };
}

export function getFreeThrowCircle(mode: CourtMode, side: "left" | "right") {
  const size = getCourtSize(mode);
  const x = side === "left" ? FIBA_COURT.freeThrowLine : size.width - FIBA_COURT.freeThrowLine;
  return {
    cx: x * COURT_SCALE,
    cy: (size.height / 2) * COURT_SCALE,
    r: FIBA_COURT.centerCircleRadius * COURT_SCALE,
  };
}

export function getThreePointPath(mode: CourtMode, side: "left" | "right") {
  const size = getCourtSize(mode);
  const rim = getRimPosition(mode, side);
  const baselineX = side === "left" ? 0 : size.width;
  const cornerTop = 0.9;
  const cornerBottom = 14.1;
  const arcOffset = Math.sqrt((FIBA_COURT.threePointRadius ** 2) - ((7.5 - cornerTop) ** 2));
  const arcX = side === "left" ? rim.x + arcOffset : rim.x - arcOffset;
  const sweep = side === "left" ? 1 : 0;

  return [
    `M ${baselineX * COURT_SCALE} ${cornerTop * COURT_SCALE}`,
    `L ${arcX * COURT_SCALE} ${cornerTop * COURT_SCALE}`,
    `A ${FIBA_COURT.threePointRadius * COURT_SCALE} ${FIBA_COURT.threePointRadius * COURT_SCALE} 0 0 ${sweep} ${arcX * COURT_SCALE} ${cornerBottom * COURT_SCALE}`,
    `L ${baselineX * COURT_SCALE} ${cornerBottom * COURT_SCALE}`,
  ].join(" ");
}

export function getNoChargeArcPath(mode: CourtMode, side: "left" | "right") {
  const rim = getRimPosition(mode, side);
  const sweep = side === "left" ? 1 : 0;
  return [
    `M ${rim.x * COURT_SCALE} ${(rim.y - FIBA_COURT.noChargeRadius) * COURT_SCALE}`,
    `A ${FIBA_COURT.noChargeRadius * COURT_SCALE} ${FIBA_COURT.noChargeRadius * COURT_SCALE} 0 0 ${sweep} ${rim.x * COURT_SCALE} ${(rim.y + FIBA_COURT.noChargeRadius) * COURT_SCALE}`,
  ].join(" ");
}

export function getBackboardLine(mode: CourtMode, side: "left" | "right") {
  const rim = getRimPosition(mode, side);
  const boardX = side === "left"
    ? rim.x + FIBA_COURT.backboardOffset
    : rim.x - FIBA_COURT.backboardOffset;
  return {
    x1: boardX * COURT_SCALE,
    y1: (rim.y - FIBA_COURT.backboardHalfHeight) * COURT_SCALE,
    x2: boardX * COURT_SCALE,
    y2: (rim.y + FIBA_COURT.backboardHalfHeight) * COURT_SCALE,
  };
}

export function getMotionColor(kind: MotionKind, override?: string) {
  if (override) return override;
  if (kind === "pass") return "#2563eb";
  if (kind === "dribble") return "#f97316";
  if (kind === "screen") return "#101827";
  return "#b5122b";
}

export function getMotionStrokeDash(kind: MotionKind) {
  if (kind === "pass") return "18 12";
  if (kind === "dribble") return "4 10";
  return undefined;
}

export function getMotionStrokeWidth(kind: MotionKind, strokeWidth?: number) {
  if (strokeWidth) return strokeWidth;
  if (kind === "screen") return 10;
  if (kind === "dribble") return 5;
  return 6;
}

export function buildMotionPath(motion: MotionPath, mode: CourtMode) {
  if (motion.kind === "dribble") return buildDribblePath(motion.from, motion.to, mode);
  const from = toSvgPoint(motion.from, mode);
  const to = toSvgPoint(motion.to, mode);
  const control = motion.control
    ? toSvgPoint(motion.control, mode)
    : {
        x: (from.x + to.x) / 2,
        y: (from.y + to.y) / 2 - (motion.curved ? 90 : 0),
      };
  return motion.curved || motion.control
    ? `M ${from.x} ${from.y} Q ${control.x} ${control.y} ${to.x} ${to.y}`
    : `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

export function buildDribblePath(fromPoint: CourtPoint, toPoint: CourtPoint, mode: CourtMode) {
  const from = toSvgPoint(fromPoint, mode);
  const to = toSvgPoint(toPoint, mode);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const normal = { x: -dy / length, y: dx / length };
  const steps = Math.max(5, Math.min(11, Math.round(length / 80)));
  const amplitude = 16;
  const points = Array.from({ length: steps + 1 }, (_, index) => {
    const ratio = index / steps;
    const direction = index % 2 === 0 ? 1 : -1;
    const offset = index === 0 || index === steps ? 0 : amplitude * direction;
    return {
      x: from.x + dx * ratio + normal.x * offset,
      y: from.y + dy * ratio + normal.y * offset,
    };
  });

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}
