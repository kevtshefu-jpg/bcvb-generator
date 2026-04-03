export type CourtMode = "half" | "full";

export type CourtScale = {
  pxPerMeter: number;
  widthPx: number;
  heightPx: number;
};

export type CourtPoint = {
  x: number;
  y: number;
};

export type CourtRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const FIBA = {
  fullCourtLengthM: 28,
  halfCourtLengthM: 14,
  courtWidthM: 15,

  keyWidthM: 4.9,
  freeThrowLineDistanceFromBaselineM: 5.8,

  rimCenterFromBaselineM: 1.575,
  rimRadiusM: 0.225,

  backboardInnerEdgeFromBaselineM: 1.2,
  backboardWidthM: 1.8,

  restrictedArcRadiusM: 1.25,

  threePointRadiusM: 6.75,
  cornerThreeDistanceFromSidelineM: 0.9,

  // Backward-compatible aliases used by current renderer code.
  backboardOffsetFromBaselineM: 1.2,
  rimCenterOffsetFromBaselineM: 1.575,
  restrictedAreaRadiusM: 1.25,
  freeThrowLineOffsetFromBaselineM: 5.8,
  freeThrowCircleRadiusM: 1.8,
  cornerThreeOffsetFromSidelineM: 0.9
} as const;

export function getCourtMeters(mode: CourtMode) {
  return {
    lengthM: mode === "full" ? FIBA.fullCourtLengthM : FIBA.halfCourtLengthM,
    widthM: FIBA.courtWidthM
  };
}

export function getCourtScale(mode: CourtMode, targetHeightPx: number): CourtScale {
  const { lengthM, widthM } = getCourtMeters(mode);
  const pxPerMeter = targetHeightPx / widthM;

  return {
    pxPerMeter,
    widthPx: lengthM * pxPerMeter,
    heightPx: targetHeightPx
  };
}

export function mToPx(valueM: number, pxPerMeter: number) {
  return valueM * pxPerMeter;
}

export function centerY(heightPx: number) {
  return heightPx / 2;
}

export function getRimCenterPx(scale: CourtScale): CourtPoint {
  return {
    x: mToPx(FIBA.rimCenterFromBaselineM, scale.pxPerMeter),
    y: centerY(scale.heightPx)
  };
}

export function getBackboardPx(scale: CourtScale) {
  const x = mToPx(FIBA.backboardInnerEdgeFromBaselineM, scale.pxPerMeter);
  const boardWidthPx = mToPx(FIBA.backboardWidthM, scale.pxPerMeter);
  const cy = centerY(scale.heightPx);

  return {
    x1: x,
    y1: cy - boardWidthPx / 2,
    x2: x,
    y2: cy + boardWidthPx / 2
  };
}

export function getKeyRectPx(scale: CourtScale): CourtRect {
  const keyDepthPx = mToPx(FIBA.freeThrowLineDistanceFromBaselineM, scale.pxPerMeter);
  const keyWidthPx = mToPx(FIBA.keyWidthM, scale.pxPerMeter);
  const cy = centerY(scale.heightPx);

  return {
    x: 0,
    y: cy - keyWidthPx / 2,
    width: keyDepthPx,
    height: keyWidthPx
  };
}

export function getFreeThrowCirclePx(scale: CourtScale) {
  return {
    cx: mToPx(FIBA.freeThrowLineDistanceFromBaselineM, scale.pxPerMeter),
    cy: centerY(scale.heightPx),
    r: mToPx(1.8, scale.pxPerMeter)
  };
}

export function getRestrictedArcPx(scale: CourtScale) {
  return {
    cx: mToPx(FIBA.rimCenterFromBaselineM, scale.pxPerMeter),
    cy: centerY(scale.heightPx),
    r: mToPx(FIBA.restrictedArcRadiusM, scale.pxPerMeter)
  };
}

/**
 * Renvoie la géométrie exacte de la ligne à 3 points FIBA pour un demi-terrain.
 * On construit :
 * - 2 segments horizontaux proches des coins
 * - 1 arc de cercle de rayon 6.75m centré sur le cercle
 */
export function getThreePointGeometryPx(scale: CourtScale) {
  const rim = getRimCenterPx(scale);
  const radiusPx = mToPx(FIBA.threePointRadiusM, scale.pxPerMeter);

  const yTop = mToPx(FIBA.cornerThreeDistanceFromSidelineM, scale.pxPerMeter);
  const yBottom = scale.heightPx - yTop;

  const dy = Math.abs(yTop - rim.y);
  const dx = Math.sqrt(Math.max(0, radiusPx * radiusPx - dy * dy));
  const xArcJoin = rim.x + dx;

  return {
    yTop,
    yBottom,
    xArcJoin,
    radiusPx,
    rim
  };
}

// Backward-compatible aliases used by existing modules.
export function getCourtSize(mode: CourtMode) {
  const { lengthM, widthM } = getCourtMeters(mode);
  return { widthM: lengthM, heightM: widthM };
}

export function metersToPx(valueM: number, pxPerMeter: number): number {
  return mToPx(valueM, pxPerMeter);
}

export function courtCenterY(heightPx: number): number {
  return centerY(heightPx);
}

export function makeKeyRect(mode: CourtMode, scale: CourtScale): CourtRect {
  void mode;
  return getKeyRectPx(scale);
}

export function getRimCenter(mode: CourtMode, scale: CourtScale): CourtPoint {
  void mode;
  return getRimCenterPx(scale);
}

export function getBackboardLine(scale: CourtScale) {
  return getBackboardPx(scale);
}

export type InteractiveCourtMode = "half" | "full";

export type InteractiveCourtGeometry = {
  mode: InteractiveCourtMode;
  widthUnits: number;
  heightUnits: number;
};

export function getInteractiveCourtGeometry(mode: InteractiveCourtMode): InteractiveCourtGeometry {
  return mode === "full"
    ? {
        mode: "full",
        widthUnits: 2800,
        heightUnits: 1500
      }
    : {
        mode: "half",
        widthUnits: 1400,
        heightUnits: 1500
      };
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function percentToViewBoxX(percentX: number, widthUnits: number) {
  return (percentX / 100) * widthUnits;
}

export function percentToViewBoxY(percentY: number, heightUnits: number) {
  return (percentY / 100) * heightUnits;
}

export function viewBoxToPercentX(x: number, widthUnits: number) {
  return (x / widthUnits) * 100;
}

export function viewBoxToPercentY(y: number, heightUnits: number) {
  return (y / heightUnits) * 100;
}

export function snapPercent(value: number, step = 1) {
  return Math.round(value / step) * step;
}
