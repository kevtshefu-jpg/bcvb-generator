import { useId } from 'react'
import type { CourtType } from '../../modules/sessions/sessionModels'
import { FIBA_DIMENSIONS, getCourtDimensions, getCourtViewBox, getRimPosition, normalizeCourtType, toSvgX, toSvgY } from './courtGeometry'
import { BCVB_LOGO_SRC, getCourtTheme, type CourtThemeName } from './courtTheme'

type FibaCourtCanvasProps = {
  courtType: CourtType
  theme?: CourtThemeName
  showLogo?: boolean
  logoLoaded?: boolean
}

function WoodTexture({ theme }: { theme: ReturnType<typeof getCourtTheme> }) {
  return (
    <g opacity="0.08">
      {Array.from({ length: 18 }, (_, index) => (
        <line x1={index * 160} y1="0" x2={index * 160} y2="1500" stroke={theme.lineDark} strokeWidth="4" key={index} />
      ))}
    </g>
  )
}

function Rim({ x, y, side, theme }: { x: number; y: number; side: 'left' | 'right'; theme: ReturnType<typeof getCourtTheme> }) {
  const boardX = toSvgX(
    side === 'left' ? FIBA_DIMENSIONS.backboardFromBaseline : FIBA_DIMENSIONS.full.length - FIBA_DIMENSIONS.backboardFromBaseline,
    'full',
  )
  return (
    <g className="fiba-rim">
      <line x1={boardX} y1={toSvgY(y, 'full') - 72} x2={boardX} y2={toSvgY(y, 'full') + 72} stroke={theme.lineDark} strokeWidth="10" />
      <circle cx={toSvgX(x, 'full')} cy={toSvgY(y, 'full')} r={FIBA_DIMENSIONS.rimRadius * 100} fill="none" stroke={theme.bcvbRed} strokeWidth="10" />
    </g>
  )
}

function CenterLogoWatermark({ showLogo, clipId }: { showLogo?: boolean; clipId: string }) {
  if (!showLogo) return null
  const logoSize = FIBA_DIMENSIONS.circleRadius * 2 * 100 * 0.55
  const cx = toSvgX(14, 'full')
  const cy = toSvgY(7.5, 'full')

  return (
    <image className="court-center-logo" href={BCVB_LOGO_SRC} x={cx - logoSize / 2} y={cy - logoSize / 2} width={logoSize} height={logoSize} clipPath={`url(#${clipId})`} opacity="0.12" preserveAspectRatio="xMidYMid meet" pointerEvents="none" />
  )
}

function KeyAndArc({ side, courtType, theme }: { side: 'left' | 'right'; courtType: CourtType; theme: ReturnType<typeof getCourtTheme> }) {
  const full = courtType === 'full'
  const width = FIBA_DIMENSIONS.keyWidth
  const keyY = (15 - width) / 2
  const freeThrowX = side === 'left' ? FIBA_DIMENSIONS.freeThrowLine : 28 - FIBA_DIMENSIONS.freeThrowLine
  const keyX = side === 'left' ? 0 : 28 - FIBA_DIMENSIONS.freeThrowLine
  const rim = getRimPosition('full', side)
  const sweep = side === 'left' ? 1 : 0
  const cornerTop = 0.9
  const cornerBottom = 14.1
  const arcOffset = Math.sqrt((FIBA_DIMENSIONS.threePointRadius ** 2) - ((7.5 - cornerTop) ** 2))
  const arcStartX = side === 'left' ? rim.x + arcOffset : rim.x - arcOffset
  const baselineX = side === 'left' ? 0 : 28

  if (!full) return null

  return (
    <g>
      <rect x={toSvgX(keyX, 'full')} y={toSvgY(keyY, 'full')} width={FIBA_DIMENSIONS.freeThrowLine * 100} height={width * 100} fill="none" stroke={theme.line} strokeWidth="8" />
      <circle cx={toSvgX(freeThrowX, 'full')} cy={toSvgY(7.5, 'full')} r={FIBA_DIMENSIONS.circleRadius * 100} fill="none" stroke={theme.line} strokeWidth="8" strokeDasharray="24 18" />
      <path d={`M ${toSvgX(baselineX, 'full')} ${toSvgY(cornerTop, 'full')} L ${toSvgX(arcStartX, 'full')} ${toSvgY(cornerTop, 'full')} A ${FIBA_DIMENSIONS.threePointRadius * 100} ${FIBA_DIMENSIONS.threePointRadius * 100} 0 0 ${sweep} ${toSvgX(arcStartX, 'full')} ${toSvgY(cornerBottom, 'full')} L ${toSvgX(baselineX, 'full')} ${toSvgY(cornerBottom, 'full')}`} fill="none" stroke={theme.line} strokeWidth="8" />
      <path d={`M ${toSvgX(rim.x, 'full') - 125} ${toSvgY(rim.y, 'full')} A 125 125 0 0 ${sweep} ${toSvgX(rim.x, 'full') + 125} ${toSvgY(rim.y, 'full')}`} fill="none" stroke={theme.line} strokeWidth="7" />
      <Rim x={rim.x} y={rim.y} side={side} theme={theme} />
    </g>
  )
}

function HalfCourtLines({ courtType, theme }: { courtType: CourtType; theme: ReturnType<typeof getCourtTheme> }) {
  const dimensions = getCourtDimensions(courtType)
  const normalized = normalizeCourtType(courtType)
  const side = normalized === 'half-left' ? 'left' : 'right'
  const rim = getRimPosition(courtType)
  const keyY = (dimensions.width - FIBA_DIMENSIONS.keyWidth) / 2
  const keyX = side === 'left' ? 0 : dimensions.length - FIBA_DIMENSIONS.freeThrowLine
  const freeThrowX = side === 'left' ? FIBA_DIMENSIONS.freeThrowLine : dimensions.length - FIBA_DIMENSIONS.freeThrowLine
  const baselineX = side === 'left' ? 0 : dimensions.length
  const arcOffset = Math.sqrt((FIBA_DIMENSIONS.threePointRadius ** 2) - ((7.5 - 0.9) ** 2))
  const arcX = side === 'left' ? rim.x + arcOffset : rim.x - arcOffset
  const arcSweep = side === 'left' ? 1 : 0
  const backboardX = toSvgX(
    side === 'left' ? FIBA_DIMENSIONS.backboardFromBaseline : dimensions.length - FIBA_DIMENSIONS.backboardFromBaseline,
    courtType,
  )

  return (
    <g>
      <rect x={toSvgX(0, courtType)} y={toSvgY(0, courtType)} width={dimensions.length * 100} height={dimensions.width * 100} fill="none" stroke={theme.line} strokeWidth="8" />
      <line x1={toSvgX(baselineX, courtType)} y1={toSvgY(0, courtType)} x2={toSvgX(baselineX, courtType)} y2={toSvgY(dimensions.width, courtType)} stroke={theme.lineDark} strokeWidth="10" />
      <rect x={toSvgX(keyX, courtType)} y={toSvgY(keyY, courtType)} width={FIBA_DIMENSIONS.freeThrowLine * 100} height={FIBA_DIMENSIONS.keyWidth * 100} fill="none" stroke={theme.line} strokeWidth="8" />
      <circle cx={toSvgX(freeThrowX, courtType)} cy={toSvgY(dimensions.width / 2, courtType)} r={FIBA_DIMENSIONS.circleRadius * 100} fill="none" stroke={theme.line} strokeWidth="8" strokeDasharray="24 18" />
      <path d={`M ${toSvgX(baselineX, courtType)} ${toSvgY(0.9, courtType)} L ${toSvgX(arcX, courtType)} ${toSvgY(0.9, courtType)} A ${FIBA_DIMENSIONS.threePointRadius * 100} ${FIBA_DIMENSIONS.threePointRadius * 100} 0 0 ${arcSweep} ${toSvgX(arcX, courtType)} ${toSvgY(14.1, courtType)} L ${toSvgX(baselineX, courtType)} ${toSvgY(14.1, courtType)}`} fill="none" stroke={theme.line} strokeWidth="8" />
      <path d={`M ${toSvgX(rim.x, courtType)} ${toSvgY(rim.y - FIBA_DIMENSIONS.noChargeRadius, courtType)} A ${FIBA_DIMENSIONS.noChargeRadius * 100} ${FIBA_DIMENSIONS.noChargeRadius * 100} 0 0 ${arcSweep} ${toSvgX(rim.x, courtType)} ${toSvgY(rim.y + FIBA_DIMENSIONS.noChargeRadius, courtType)}`} fill="none" stroke={theme.line} strokeWidth="7" />
      <line x1={backboardX} y1={toSvgY(rim.y - 0.72, courtType)} x2={backboardX} y2={toSvgY(rim.y + 0.72, courtType)} stroke={theme.lineDark} strokeWidth="10" />
      <circle cx={toSvgX(rim.x, courtType)} cy={toSvgY(rim.y, courtType)} r={FIBA_DIMENSIONS.rimRadius * 100} fill="none" stroke={theme.bcvbRed} strokeWidth="10" />
    </g>
  )
}

export function FibaCourtCanvas({ courtType, theme = 'bcvb-editorial', showLogo = false, logoLoaded = true }: FibaCourtCanvasProps) {
  const normalized = normalizeCourtType(courtType)
  const palette = getCourtTheme(theme)
  const dimensions = getCourtDimensions(courtType)
  const clipId = `fiba-center-logo-clip-${useId().replace(/:/g, '')}`
  void logoLoaded

  return (
    <>
      <defs>
        <clipPath id={clipId}>
          <circle cx="1400" cy="750" r={FIBA_DIMENSIONS.circleRadius * 100} />
        </clipPath>
      </defs>
      <rect width={dimensions.length * 100} height={dimensions.width * 100} fill={palette.wood} />
      <WoodTexture theme={palette} />
      {normalized === 'full' ? (
        <g>
          <rect x="0" y="0" width="2800" height="1500" fill="none" stroke={palette.line} strokeWidth="10" />
          <CenterLogoWatermark showLogo={showLogo} clipId={clipId} />
          <line x1="1400" y1="0" x2="1400" y2="1500" stroke={palette.line} strokeWidth="8" />
          <circle cx="1400" cy="750" r={FIBA_DIMENSIONS.circleRadius * 100} fill="none" stroke={palette.line} strokeWidth="8" />
          <KeyAndArc side="left" courtType="full" theme={palette} />
          <KeyAndArc side="right" courtType="full" theme={palette} />
        </g>
      ) : (
        <g>
          <HalfCourtLines courtType={courtType} theme={palette} />
        </g>
      )}
    </>
  )
}

export { getCourtViewBox }
