import type { CourtGeometry } from './CourtGeometry'

function clamp(value: number) {
  return Math.max(0, Math.min(100, value))
}

export function mapCourtPoint(
  point: { x: number; y: number },
  geometry: CourtGeometry
) {
  return {
    x: geometry.courtX + (clamp(point.x) / 100) * geometry.courtW,
    y: geometry.courtY + (clamp(point.y) / 100) * geometry.courtH,
  }
}

export function mapCourtSize(
  size: { width: number; height: number },
  geometry: CourtGeometry
) {
  return {
    width: (clamp(size.width) / 100) * geometry.courtW,
    height: (clamp(size.height) / 100) * geometry.courtH,
  }
}

