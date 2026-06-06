export type CourtMode = 'half' | 'full'

export type CourtGeometry = {
  width: number
  height: number
  courtX: number
  courtY: number
  courtW: number
  courtH: number
  hoopX: number
  hoopY: number
  freeThrowY: number
  paintW: number
  paintH: number
}

export function getCourtGeometry(mode: CourtMode = 'half'): CourtGeometry {
  const width = 940
  const height = mode === 'full' ? 1240 : 700
  const courtX = 60
  const courtY = 40
  const courtW = 820
  const courtH = mode === 'full' ? height - 90 : 610

  return {
    width,
    height,
    courtX,
    courtY,
    courtW,
    courtH,
    hoopX: width / 2,
    hoopY: 95,
    freeThrowY: 285,
    paintW: 280,
    paintH: 245,
  }
}
