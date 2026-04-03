import { FIBA, mToPx } from "./courtGeometry";

const LINE_MAIN = "#1A1A1A";
const LINE_SECONDARY = "#2B2118";

export function renderHalfCourtMarkupFiba(
  widthPx: number,
  heightPx: number,
  pxPerMeter: number
) {
  const centerX = widthPx / 2;
  const centerCircleR = mToPx(FIBA.freeThrowCircleRadiusM, pxPerMeter);
  const midCourtY = heightPx / 2;
  const baselineY = heightPx - 2;

  // Panier
  const rimY = baselineY - mToPx(FIBA.rimCenterFromBaselineM, pxPerMeter);
  const rimR = mToPx(FIBA.rimRadiusM, pxPerMeter);

  // Panneau
  const boardY = baselineY - mToPx(FIBA.backboardInnerEdgeFromBaselineM, pxPerMeter);
  const boardHalfWidth = mToPx(FIBA.backboardWidthM, pxPerMeter) / 2;

  // Raquette
  const keyWidth = mToPx(FIBA.keyWidthM, pxPerMeter);
  const keyDepth = mToPx(FIBA.freeThrowLineDistanceFromBaselineM, pxPerMeter);
  const keyX = centerX - keyWidth / 2;
  const keyTopY = baselineY - keyDepth;

  // Lancer franc
  const ftRadius = mToPx(FIBA.freeThrowCircleRadiusM, pxPerMeter);
  const ftCenterY = keyTopY;

  // Restricted area
  const restrictedR = mToPx(FIBA.restrictedArcRadiusM, pxPerMeter);

  // Ligne à 3 points
  const sideOffset = mToPx(FIBA.cornerThreeDistanceFromSidelineM, pxPerMeter);
  const threeRadius = mToPx(FIBA.threePointRadiusM, pxPerMeter);

  const horizontalOffset = centerX - sideOffset;
  const verticalOffset = Math.sqrt(
    Math.max(0, threeRadius * threeRadius - horizontalOffset * horizontalOffset)
  );
  const threeJoinY = rimY - verticalOffset;

  return `
    <!-- Contour terrain -->
    <rect
      x="2"
      y="2"
      width="${widthPx - 4}"
      height="${heightPx - 4}"
      rx="18"
      fill="none"
      stroke="${LINE_MAIN}"
      stroke-width="5.5"
    />

    <!-- Demi-rond central -->
<path
  d="
    M ${centerX - centerCircleR} ${midCourtY}
    A ${centerCircleR} ${centerCircleR} 0 0 1 ${centerX + centerCircleR} ${midCourtY}
  "
  fill="none"
  stroke="${LINE_SECONDARY}"
  stroke-width="2.8"
/>

    <!-- Raquette -->
    <rect
      x="${keyX}"
      y="${keyTopY}"
      width="${keyWidth}"
      height="${baselineY - keyTopY}"
      fill="rgba(255,255,255,0.08)"
      stroke="${LINE_SECONDARY}"
      stroke-width="3"
    />

    <!-- Demi-cercle lancer franc (extérieur de raquette) -->
    <path
      d="
        M ${centerX - ftRadius} ${ftCenterY}
        A ${ftRadius} ${ftRadius} 0 0 1 ${centerX + ftRadius} ${ftCenterY}
      "
      fill="none"
      stroke="${LINE_SECONDARY}"
      stroke-width="2.8"
    />

    <!-- Panneau -->
    <line
      x1="${centerX - boardHalfWidth}"
      y1="${boardY}"
      x2="${centerX + boardHalfWidth}"
      y2="${boardY}"
      stroke="${LINE_MAIN}"
      stroke-width="6"
      stroke-linecap="round"
    />

    <!-- Arceau -->
    <circle
      cx="${centerX}"
      cy="${rimY}"
      r="${rimR}"
      fill="none"
      stroke="#111111"
      stroke-width="3.5"
    />

    <!-- Zone restrictive -->
    <path
      d="
        M ${centerX - restrictedR} ${rimY}
        A ${restrictedR} ${restrictedR} 0 0 1 ${centerX + restrictedR} ${rimY}
      "
      fill="none"
      stroke="${LINE_MAIN}"
      stroke-width="2.6"
    />

    <!-- Lignes de coin à 3 pts -->
    <line
      x1="${sideOffset}"
      y1="${baselineY}"
      x2="${sideOffset}"
      y2="${threeJoinY}"
      stroke="${LINE_SECONDARY}"
      stroke-width="3.8"
    />

    <line
      x1="${widthPx - sideOffset}"
      y1="${baselineY}"
      x2="${widthPx - sideOffset}"
      y2="${threeJoinY}"
      stroke="${LINE_SECONDARY}"
      stroke-width="3.8"
    />

    <!-- Arc à 3 pts -->
    <path
      d="
        M ${sideOffset} ${threeJoinY}
        A ${threeRadius} ${threeRadius} 0 0 1 ${widthPx - sideOffset} ${threeJoinY}
      "
      fill="none"
      stroke="${LINE_SECONDARY}"
      stroke-width="3.8"
    />
  `;
}

export function renderFullCourtMarkupFiba(
  widthPx: number,
  heightPx: number,
  pxPerMeter: number
) {
  const centerX = widthPx / 2;
  const midCourtY = heightPx / 2;
  const centerCircleR = 1.8 * pxPerMeter; // FIBA
  const topY = 2;

  return `
    <rect
      x="2"
      y="${topY}"
      width="${widthPx - 4}"
      height="${heightPx - 4}"
      rx="18"
      fill="none"
      stroke="${LINE_MAIN}"
      stroke-width="5.5"
    />

    <!-- Demi-rond central -->
    <path
      d="
        M ${centerX - centerCircleR} ${midCourtY}
        A ${centerCircleR} ${centerCircleR} 0 0 1 ${centerX + centerCircleR} ${midCourtY}
      "
      fill="none"
      stroke="${LINE_SECONDARY}"
      stroke-width="2.8"
    />

    <line
      x1="0"
      y1="${midCourtY}"
      x2="${widthPx}"
      y2="${midCourtY}"
      stroke="${LINE_SECONDARY}"
      stroke-width="3"
    />

    <circle
      cx="${centerX}"
      cy="${midCourtY}"
      r="${centerCircleR}"
      fill="none"
      stroke="${LINE_SECONDARY}"
      stroke-width="3"
    />

    <g>
      ${renderHalfCourtMarkupFiba(widthPx, midCourtY, pxPerMeter)}
    </g>

    <g transform="translate(${widthPx}, ${heightPx}) scale(-1,-1)">
      ${renderHalfCourtMarkupFiba(widthPx, midCourtY, pxPerMeter)}
    </g>
  `;
}

export const renderHalfCourtLines = renderHalfCourtMarkupFiba;
export const renderFullCourtLines = renderFullCourtMarkupFiba;