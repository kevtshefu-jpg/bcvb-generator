import { forwardRef, useId, type PointerEvent, type ReactNode } from "react";
import type { CourtFrame, CourtMode } from "../../types/court";
import { COURT_SCALE, FIBA_COURT, getCenterLogoBox, getCourtSize, getCourtViewBox, getRimPosition } from "../../lib/courtGeometry";
import { getBackboardLine, getFreeThrowCircle, getKeyRect, getNoChargeArcPath, getThreePointPath } from "../../lib/courtPaths";

const BCVB_LOGO_SRC = "/logo_bcvb copie.png";

type FibaCourtSvgProps = {
  frame: CourtFrame;
  children?: ReactNode;
  onCourtPointerDown?: (event: PointerEvent<SVGSVGElement>) => void;
};

function WoodTexture({ mode }: { mode: CourtMode }) {
  const size = getCourtSize(mode);
  const lines = Math.ceil(size.width * 1.25);
  return (
    <g className="fastdraw-court-wood" opacity="0.08">
      {Array.from({ length: lines }, (_, index) => (
        <line
          key={index}
          x1={index * 115}
          y1="0"
          x2={index * 115}
          y2={size.height * COURT_SCALE}
          stroke="#101827"
          strokeWidth="3"
        />
      ))}
    </g>
  );
}

function Basket({ mode, side }: { mode: CourtMode; side: "left" | "right" }) {
  const rim = getRimPosition(mode, side);
  const backboard = getBackboardLine(mode, side);
  return (
    <g className="fastdraw-court-basket">
      <line {...backboard} stroke="#101827" strokeWidth="9" strokeLinecap="round" />
      <circle
        cx={rim.x * COURT_SCALE}
        cy={rim.y * COURT_SCALE}
        r={FIBA_COURT.rimRadius * COURT_SCALE}
        fill="none"
        stroke="#b5122b"
        strokeWidth="8"
      />
    </g>
  );
}

function KeySet({ mode, side }: { mode: CourtMode; side: "left" | "right" }) {
  const key = getKeyRect(mode, side);
  const freeThrow = getFreeThrowCircle(mode, side);
  return (
    <g className={`fastdraw-court-key fastdraw-court-key--${side}`}>
      <rect {...key} fill="rgba(255,255,255,0.08)" stroke="#f8fafc" strokeWidth="7" />
      <circle
        {...freeThrow}
        fill="none"
        stroke="#f8fafc"
        strokeWidth="7"
        strokeDasharray="22 16"
      />
      <path d={getThreePointPath(mode, side)} fill="none" stroke="#f8fafc" strokeWidth="7" strokeLinecap="round" />
      <path d={getNoChargeArcPath(mode, side)} fill="none" stroke="#f8fafc" strokeWidth="6" strokeLinecap="round" />
      <Basket mode={mode} side={side} />
    </g>
  );
}

function CourtLines({ mode }: { mode: CourtMode }) {
  const size = getCourtSize(mode);
  const width = size.width * COURT_SCALE;
  const height = size.height * COURT_SCALE;
  const sides = mode === "full"
    ? (["left", "right"] as const)
    : ([mode === "half-left" ? "left" : "right"] as const);

  return (
    <g className="fastdraw-court-lines">
      <rect x="0" y="0" width={width} height={height} fill="none" stroke="#f8fafc" strokeWidth="9" />
      {mode === "full" && (
        <>
          <line x1="1400" y1="0" x2="1400" y2="1500" stroke="#f8fafc" strokeWidth="7" />
          <circle cx="1400" cy="750" r={FIBA_COURT.centerCircleRadius * COURT_SCALE} fill="none" stroke="#f8fafc" strokeWidth="7" />
        </>
      )}
      {sides.map((side) => <KeySet key={side} mode={mode} side={side} />)}
    </g>
  );
}

function CenterLogoWatermark({ show, clipId }: { show?: boolean; clipId: string }) {
  if (!show) return null;
  const logo = getCenterLogoBox();
  return (
    <image
      className="fastdraw-center-logo court-center-logo"
      href={BCVB_LOGO_SRC}
      x={logo.x}
      y={logo.y}
      width={logo.size}
      height={logo.size}
      clipPath={`url(#${clipId})`}
      opacity="0.12"
      preserveAspectRatio="xMidYMid meet"
      pointerEvents="none"
    />
  );
}

export const FibaCourtSvg = forwardRef<SVGSVGElement, FibaCourtSvgProps>(function FibaCourtSvg({ frame, children, onCourtPointerDown }, ref) {
  const size = getCourtSize(frame.mode);
  const clipId = `fastdraw-center-logo-clip-${useId().replace(/:/g, "")}`;
  return (
    <svg
      ref={ref}
      className={`fastdraw-court-svg fastdraw-court-svg--${frame.mode}`}
      viewBox={getCourtViewBox(frame.mode)}
      role="img"
      aria-label={`Terrain FIBA - ${frame.title}`}
      preserveAspectRatio="xMidYMid meet"
      onPointerDown={onCourtPointerDown}
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx="1400" cy="750" r={FIBA_COURT.centerCircleRadius * COURT_SCALE} />
        </clipPath>
      </defs>
      <rect width={size.width * COURT_SCALE} height={size.height * COURT_SCALE} fill="#d8ad6a" />
      <WoodTexture mode={frame.mode} />
      {frame.mode === "full" && <CenterLogoWatermark show={frame.showCenterLogo} clipId={clipId} />}
      <CourtLines mode={frame.mode} />
      {children}
    </svg>
  );
});
