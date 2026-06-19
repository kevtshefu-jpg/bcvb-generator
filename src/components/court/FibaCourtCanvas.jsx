import { BCVB_LOGO_SRC, courtTokens } from './courtTokens.js'
import { useId } from 'react'
import FibaCourtObjects from './FibaCourtObjects.jsx'
import { FIBA_COURT, getCourtSize, getRimPosition, getThreePointArcX, getCourtViewBox, meterToSvgX, meterToSvgY, normalizeMode } from './fibaCourtGeometry.js'

function WoodTexture({ mode }) {
  const size = getCourtSize(mode)
  return (
    <g opacity="0.08">
      {Array.from({ length: Math.ceil(size.width * 1.2) }, (_, index) => (
        <line key={index} x1={index * 120} y1="0" x2={index * 120} y2={size.height * 100} stroke={courtTokens.courtLineDark} strokeWidth="3" />
      ))}
    </g>
  )
}

function Rim({ rim, side, mode }) {
  const size = getCourtSize(mode)
  const boardX = meterToSvgX(
    side === 'left' ? FIBA_COURT.backboardFromBaseline : size.width - FIBA_COURT.backboardFromBaseline,
    mode,
  )
  return (
    <g>
      <line x1={boardX} y1={meterToSvgY(rim.y - 0.72, mode)} x2={boardX} y2={meterToSvgY(rim.y + 0.72, mode)} stroke={courtTokens.courtLineDark} strokeWidth="6" />
      <circle cx={meterToSvgX(rim.x, mode)} cy={meterToSvgY(rim.y, mode)} r={FIBA_COURT.rimRadius * 100} fill="none" stroke={courtTokens.bcvbRed} strokeWidth="6" />
    </g>
  )
}

function KeyArc({ mode, side }) {
  const size = getCourtSize(mode)
  const rim = getRimPosition(mode, side)
  const keyX = side === 'left' ? 0 : size.width - FIBA_COURT.freeThrowLine
  const freeThrowX = side === 'left' ? FIBA_COURT.freeThrowLine : size.width - FIBA_COURT.freeThrowLine
  const baselineX = side === 'left' ? 0 : size.width
  const arcX = getThreePointArcX(rim.x, side)
  const sweep = side === 'left' ? 1 : 0
  const noChargeSweep = side === 'left' ? 1 : 0
  const keyY = (size.height - FIBA_COURT.keyWidth) / 2

  return (
    <g>
      <rect x={meterToSvgX(keyX, mode)} y={meterToSvgY(keyY, mode)} width={FIBA_COURT.freeThrowLine * 100} height={FIBA_COURT.keyWidth * 100} fill="none" stroke={courtTokens.courtLine} strokeWidth="6" />
      <circle cx={meterToSvgX(freeThrowX, mode)} cy={meterToSvgY(size.height / 2, mode)} r={FIBA_COURT.freeThrowCircleRadius * 100} fill="none" stroke={courtTokens.courtLine} strokeWidth="6" strokeDasharray="18 14" />
      <path d={`M ${meterToSvgX(baselineX, mode)} ${meterToSvgY(0.9, mode)} L ${meterToSvgX(arcX, mode)} ${meterToSvgY(0.9, mode)} A ${FIBA_COURT.threePointRadius * 100} ${FIBA_COURT.threePointRadius * 100} 0 0 ${sweep} ${meterToSvgX(arcX, mode)} ${meterToSvgY(14.1, mode)} L ${meterToSvgX(baselineX, mode)} ${meterToSvgY(14.1, mode)}`} fill="none" stroke={courtTokens.courtLine} strokeWidth="6" />
      <path d={`M ${meterToSvgX(rim.x, mode)} ${meterToSvgY(rim.y - FIBA_COURT.restrictedAreaRadius, mode)} A ${FIBA_COURT.restrictedAreaRadius * 100} ${FIBA_COURT.restrictedAreaRadius * 100} 0 0 ${noChargeSweep} ${meterToSvgX(rim.x, mode)} ${meterToSvgY(rim.y + FIBA_COURT.restrictedAreaRadius, mode)}`} fill="none" stroke={courtTokens.courtLine} strokeWidth="5" />
      <Rim rim={rim} side={side} mode={mode} />
    </g>
  )
}

function CenterLogoWatermark({ showLogo, clipId }) {
  if (!showLogo) return null
  const diameter = 2 * FIBA_COURT.centerCircleRadius * FIBA_COURT.scale
  const logoMaxSize = diameter * 0.55
  const x = meterToSvgX(14, 'full') - logoMaxSize / 2
  const y = meterToSvgY(7.5, 'full') - logoMaxSize / 2
  return <image className="court-center-logo" href={BCVB_LOGO_SRC} x={x} y={y} width={logoMaxSize} height={logoMaxSize} clipPath={`url(#${clipId})`} opacity="0.12" preserveAspectRatio="xMidYMid meet" pointerEvents="none" />
}

export default function FibaCourtCanvas({
  mode = 'half-right',
  showLogo = false,
  showGrid = false,
  objects = [],
  arrows = [],
  zones = [],
  selectedObjectId,
  onObjectMove,
  onSelectObject,
}) {
  const normalized = normalizeMode(mode)
  const size = getCourtSize(mode)
  const isFull = normalized === 'full'
  const clipId = `bcvb-center-logo-clip-${useId().replace(/:/g, '')}`

  return (
    <svg className="bcvb-court-svg" viewBox={getCourtViewBox(normalized)} role="img" aria-label="Terrain FIBA BCVB" preserveAspectRatio="xMidYMid meet">
      <defs>
        <clipPath id={clipId}>
          <circle cx="1400" cy="750" r={FIBA_COURT.centerCircleRadius * FIBA_COURT.scale} />
        </clipPath>
        {['arrow_move', 'arrow_pass', 'arrow_dribble'].map((type) => (
          <marker id={`bcvb-arrow-${type}`} markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto" key={type}>
            <path d="M0,0 L12,6 L0,12 z" fill={type === 'arrow_pass' ? courtTokens.pass : type === 'arrow_dribble' ? courtTokens.dribble : courtTokens.courtLineDark} />
          </marker>
        ))}
      </defs>
      <rect width={size.width * 100} height={size.height * 100} fill={courtTokens.courtWood} />
      <WoodTexture mode={normalized} />
      {showLogo && isFull && <CenterLogoWatermark showLogo={showLogo} clipId={clipId} />}
      {showGrid && (
        <g opacity="0.18">
          {Array.from({ length: size.width + 1 }, (_, index) => <line key={`x-${index}`} x1={index * 100} y1="0" x2={index * 100} y2={size.height * 100} stroke={courtTokens.courtLineDark} strokeWidth="1" />)}
          {Array.from({ length: size.height + 1 }, (_, index) => <line key={`y-${index}`} x1="0" y1={index * 100} x2={size.width * 100} y2={index * 100} stroke={courtTokens.courtLineDark} strokeWidth="1" />)}
        </g>
      )}
      <rect x="0" y="0" width={size.width * 100} height={size.height * 100} fill="none" stroke={courtTokens.courtLine} strokeWidth="7" />
      {isFull && (
        <>
          <line x1="1400" y1="0" x2="1400" y2="1500" stroke={courtTokens.courtLine} strokeWidth="5" />
          <circle cx="1400" cy="750" r={FIBA_COURT.centerCircleRadius * 100} fill="none" stroke={courtTokens.courtLine} strokeWidth="5" />
          <KeyArc mode="full" side="left" />
          <KeyArc mode="full" side="right" />
        </>
      )}
      {!isFull && <KeyArc mode={normalized} side={normalized === 'half-left' ? 'left' : 'right'} />}
      <FibaCourtObjects
        mode={normalized}
        objects={objects}
        arrows={arrows}
        zones={zones}
        selectedObjectId={selectedObjectId}
        onObjectMove={onObjectMove}
        onSelectObject={onSelectObject}
      />
    </svg>
  )
}
