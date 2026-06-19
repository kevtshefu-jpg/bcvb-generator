import type { CourtMode, CourtPoint } from "../types/court";

export const COURT_SCALE = 100;

export const FIBA_COURT = {
  full: { width: 28, height: 15 },
  half: { width: 14, height: 15 },
  centerCircleRadius: 1.8,
  freeThrowLine: 5.8,
  keyWidth: 4.9,
  threePointRadius: 6.75,
  noChargeRadius: 1.25,
  rimFromBaseline: 1.575,
  rimRadius: 0.225,
  backboardFromBaseline: 1.2,
  backboardHalfHeight: 0.72,
} as const;

export function normalizeCourtMode(mode: string | undefined): CourtMode {
  if (mode === "full") return "full";
  if (mode === "half-left" || mode === "half-defense") return "half-left";
  return "half-right";
}

export function getCourtSize(mode: CourtMode) {
  return mode === "full" ? FIBA_COURT.full : FIBA_COURT.half;
}

export function getCourtViewBox(mode: CourtMode) {
  const size = getCourtSize(mode);
  return `0 0 ${size.width * COURT_SCALE} ${size.height * COURT_SCALE}`;
}

export function getCourtAspectRatio(mode: CourtMode) {
  const size = getCourtSize(mode);
  return `${size.width} / ${size.height}`;
}

export function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

export function clampCourtPoint(point: CourtPoint, mode: CourtMode): CourtPoint {
  const size = getCourtSize(mode);
  return {
    x: clamp(point.x, 0, size.width),
    y: clamp(point.y, 0, size.height),
  };
}

export function legacyPointToCourt(point: CourtPoint, mode: CourtMode): CourtPoint {
  const size = getCourtSize(mode);
  return clampCourtPoint({
    x: point.x > size.width ? (point.x / 100) * size.width : point.x,
    y: point.y > size.height ? (point.y / 100) * size.height : point.y,
  }, mode);
}

export function toSvgX(x: number, mode: CourtMode) {
  return clampCourtPoint({ x, y: 0 }, mode).x * COURT_SCALE;
}

export function toSvgY(y: number, mode: CourtMode) {
  return clampCourtPoint({ x: 0, y }, mode).y * COURT_SCALE;
}

export function toSvgPoint(point: CourtPoint, mode: CourtMode): CourtPoint {
  const clamped = clampCourtPoint(point, mode);
  return {
    x: clamped.x * COURT_SCALE,
    y: clamped.y * COURT_SCALE,
  };
}

export function fromSvgPoint(point: CourtPoint, mode: CourtMode): CourtPoint {
  return clampCourtPoint({
    x: point.x / COURT_SCALE,
    y: point.y / COURT_SCALE,
  }, mode);
}

export function clientPointToCourtPoint(svg: SVGSVGElement, clientX: number, clientY: number, mode: CourtMode): CourtPoint {
  const screenMatrix = svg.getScreenCTM();
  if (!screenMatrix) return { x: 0, y: 0 };
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const svgPoint = point.matrixTransform(screenMatrix.inverse());
  return fromSvgPoint(svgPoint, mode);
}

export function getBasketSide(mode: CourtMode, side: "left" | "right" = "right") {
  if (mode === "full") return side;
  return mode === "half-left" ? "left" : "right";
}

export function getRimPosition(mode: CourtMode, side: "left" | "right" = "right") {
  const size = getCourtSize(mode);
  const basketSide = getBasketSide(mode, side);
  return basketSide === "left"
    ? { x: FIBA_COURT.rimFromBaseline, y: size.height / 2, side: "left" as const }
    : { x: size.width - FIBA_COURT.rimFromBaseline, y: size.height / 2, side: "right" as const };
}

export function getCenterLogoBox() {
  const logoSize = FIBA_COURT.centerCircleRadius * 2 * COURT_SCALE * 0.55;
  return {
    x: 1400 - logoSize / 2,
    y: 750 - logoSize / 2,
    size: logoSize,
  };
}

export function getReadableModeLabel(mode: CourtMode) {
  if (mode === "full") return "Terrain entier";
  if (mode === "half-left") return "Demi-terrain gauche";
  return "Demi-terrain droit";
}
