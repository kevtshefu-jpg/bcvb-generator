import type { SessionSituation } from './sessionModels'

export type RelativeSessionSlot = {
  situationId: string
  startMinutes: number | null
  endMinutes: number | null
  label: string
}

export function formatElapsedMinutes(minutes: number): string {
  if (!Number.isSafeInteger(minutes) || minutes < 0) return '—'
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

/**
 * Offsets from the start of training, not real clock times.
 * A corrupt/non-positive block invalidates that block and all later offsets
 * rather than silently displaying a misleading schedule.
 */
export function buildRelativeSessionTimeline(situations: SessionSituation[]): RelativeSessionSlot[] {
  let elapsed = 0
  let reliable = true

  return situations.map((situation) => {
    const valid = Number.isSafeInteger(situation.durationMinutes) && situation.durationMinutes > 0
    const startMinutes = reliable && valid ? elapsed : null
    if (!valid) reliable = false
    if (reliable) elapsed += situation.durationMinutes
    const endMinutes = reliable ? elapsed : null

    return {
      situationId: situation.id,
      startMinutes,
      endMinutes,
      label: startMinutes !== null && endMinutes !== null
        ? `${formatElapsedMinutes(startMinutes)}–${formatElapsedMinutes(endMinutes)}`
        : 'Horaires à corriger',
    }
  })
}
