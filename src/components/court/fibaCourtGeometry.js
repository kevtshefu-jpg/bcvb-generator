export const FIBA_COURT = {
  scale: 100,
  full: { width: 28, height: 15, viewBox: '0 0 2800 1500' },
  half: { width: 14, height: 15, viewBox: '0 0 1400 1500' },
  centerCircleRadius: 1.8,
  keyWidth: 4.9,
  keyDepth: 5.8,
  freeThrowLine: 5.8,
  freeThrowCircleRadius: 1.8,
  rimFromBaseline: 1.575,
  backboardFromBaseline: 1.2,
  rimRadius: 0.225,
  threePointRadius: 6.75,
  restrictedAreaRadius: 1.25,
}

export function m(value) {
  return value * FIBA_COURT.scale
}

export function normalizeMode(mode = 'half-right') {
  if (mode === 'full') return 'full'
  if (mode === 'half-left' || mode === 'half-attack-left') return 'half-left'
  return 'half-right'
}

export function getCourtViewBox(mode = 'half-right') {
  return normalizeMode(mode) === 'full' ? FIBA_COURT.full.viewBox : FIBA_COURT.half.viewBox
}

export function getCourtSize(mode = 'half-right') {
  return normalizeMode(mode) === 'full'
    ? { width: FIBA_COURT.full.width, height: FIBA_COURT.full.height }
    : { width: FIBA_COURT.half.width, height: FIBA_COURT.half.height }
}

export function getBasketSide(side = 'right') {
  return side === 'left' ? 'left' : 'right'
}

export function meterToSvgX(value, mode = 'half-right') {
  return normalizePoint(value, 0, mode).x * FIBA_COURT.scale
}

export function meterToSvgY(value, mode = 'half-right') {
  return normalizePoint(0, value, mode).y * FIBA_COURT.scale
}

export function normalizePoint(x, y, mode = 'half-right') {
  const size = getCourtSize(mode)
  const normalizedX = Number.isFinite(x) ? x : 0
  const normalizedY = Number.isFinite(y) ? y : 0
  return {
    x: Math.max(0, Math.min(size.width, normalizedX)),
    y: Math.max(0, Math.min(size.height, normalizedY)),
  }
}

export function legacyPointToMeters(point, mode = 'half-right') {
  const size = getCourtSize(mode)
  const x = point.x > size.width ? (point.x / 100) * size.width : point.x
  const y = point.y > size.height ? (point.y / 100) * size.height : point.y
  return normalizePoint(x, y, mode)
}

export function svgPointToMeters(svgPoint, mode = 'half-right') {
  return normalizePoint(svgPoint.x / FIBA_COURT.scale, svgPoint.y / FIBA_COURT.scale, mode)
}

export function getRimPosition(mode = 'half-right', side = 'right') {
  const normalized = normalizeMode(mode)
  const size = getCourtSize(mode)
  const basketSide = normalized === 'full' ? getBasketSide(side) : normalized === 'half-left' ? 'left' : 'right'
  return basketSide === 'left'
    ? { x: FIBA_COURT.rimFromBaseline, y: size.height / 2, side: 'left' }
    : { x: size.width - FIBA_COURT.rimFromBaseline, y: size.height / 2, side: 'right' }
}

export function getThreePointArcX(rimX, side = 'right') {
  const cornerY = 0.9
  const offset = Math.sqrt((FIBA_COURT.threePointRadius ** 2) - ((7.5 - cornerY) ** 2))
  return side === 'left' ? rimX + offset : rimX - offset
}
