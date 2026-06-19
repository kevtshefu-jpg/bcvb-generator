import type { CourtType } from '../../modules/sessions/sessionModels'

export const FIBA_DIMENSIONS = {
  full: { length: 28, width: 15 },
  half: { length: 14, width: 15 },
  keyWidth: 4.9,
  freeThrowLine: 5.8,
  circleRadius: 1.8,
  threePointRadius: 6.75,
  noChargeRadius: 1.25,
  rimFromBaseline: 1.575,
  backboardFromBaseline: 1.2,
  rimRadius: 0.225,
  svgScale: 100,
}

export type NormalizedCourtType = 'full' | 'half-left' | 'half-right' | 'mini'

export function normalizeCourtType(courtType: CourtType | string = 'half-right'): NormalizedCourtType {
  if (courtType === 'full') return 'full'
  if (courtType === 'half-left' || courtType === 'half-defense') return 'half-left'
  if (courtType === 'half-right') return 'half-right'
  if (courtType === 'mini') return 'mini'
  return 'half-right'
}

export function isHalfCourt(courtType: CourtType | string) {
  return normalizeCourtType(courtType) !== 'full' && normalizeCourtType(courtType) !== 'mini'
}

export function getCourtDimensions(courtType: CourtType | string) {
  const normalized = normalizeCourtType(courtType)
  return normalized === 'full'
    ? FIBA_DIMENSIONS.full
    : FIBA_DIMENSIONS.half
}

export function getCourtViewBox(courtType: CourtType | string) {
  const dimensions = getCourtDimensions(courtType)
  return `0 0 ${dimensions.length * FIBA_DIMENSIONS.svgScale} ${dimensions.width * FIBA_DIMENSIONS.svgScale}`
}

export function toSvgX(x: number, courtType: CourtType | string = 'full') {
  return clampMeterX(x, courtType) * FIBA_DIMENSIONS.svgScale
}

export function toSvgY(y: number, courtType: CourtType | string = 'full') {
  return clampMeterY(y, courtType) * FIBA_DIMENSIONS.svgScale
}

export function fromSvgX(px: number, courtType: CourtType | string = 'full') {
  return clampMeterX(px / FIBA_DIMENSIONS.svgScale, courtType)
}

export function fromSvgY(px: number, courtType: CourtType | string = 'full') {
  return clampMeterY(px / FIBA_DIMENSIONS.svgScale, courtType)
}

export function clampMeterX(x: number, courtType: CourtType | string) {
  const { length } = getCourtDimensions(courtType)
  return Math.max(0, Math.min(length, Number.isFinite(x) ? x : 0))
}

export function clampMeterY(y: number, courtType: CourtType | string) {
  const { width } = getCourtDimensions(courtType)
  return Math.max(0, Math.min(width, Number.isFinite(y) ? y : 0))
}

export function legacyToMetersX(x: number, courtType: CourtType | string) {
  const dimensions = getCourtDimensions(courtType)
  if (x > dimensions.length) return (x / 100) * dimensions.length
  return x
}

export function legacyToMetersY(y: number, courtType: CourtType | string) {
  const dimensions = getCourtDimensions(courtType)
  if (y > dimensions.width) return (y / 100) * dimensions.width
  return y
}

export function legacyToMeters(value: { x: number; y: number }, courtType: CourtType | string) {
  return {
    x: clampMeterX(legacyToMetersX(value.x, courtType), courtType),
    y: clampMeterY(legacyToMetersY(value.y, courtType), courtType),
  }
}

export function getRimPosition(courtType: CourtType | string, side: 'left' | 'right' | 'top' | 'bottom' = 'right') {
  const normalized = normalizeCourtType(courtType)
  const dimensions = getCourtDimensions(courtType)

  if (normalized === 'full') {
    return side === 'left'
      ? { x: FIBA_DIMENSIONS.rimFromBaseline, y: dimensions.width / 2 }
      : { x: dimensions.length - FIBA_DIMENSIONS.rimFromBaseline, y: dimensions.width / 2 }
  }

  if (normalized === 'half-left') {
    return { x: FIBA_DIMENSIONS.rimFromBaseline, y: dimensions.width / 2 }
  }

  return { x: dimensions.length - FIBA_DIMENSIONS.rimFromBaseline, y: dimensions.width / 2 }
}

export function metricPath(points: Array<{ x: number; y: number }>, courtType: CourtType | string) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${toSvgX(point.x, courtType)} ${toSvgY(point.y, courtType)}`)
    .join(' ')
}
