import { describe, expect, it } from 'vitest'
import { createSituation } from './sessionModels'
import { buildRelativeSessionTimeline, formatElapsedMinutes } from './sessionTimelineSchedule'

describe('relative session timeline', () => {
  it('labels exact consecutive intervals, including hours', () => {
    const situations = [
      createSituation({ id: 'a', durationMinutes: 12 }),
      createSituation({ id: 'b', durationMinutes: 18 }),
      createSituation({ id: 'c', durationMinutes: 45 }),
    ]
    expect(buildRelativeSessionTimeline(situations)).toEqual([
      { situationId: 'a', startMinutes: 0, endMinutes: 12, label: '00:00–00:12' },
      { situationId: 'b', startMinutes: 12, endMinutes: 30, label: '00:12–00:30' },
      { situationId: 'c', startMinutes: 30, endMinutes: 75, label: '00:30–01:15' },
    ])
    expect(formatElapsedMinutes(135)).toBe('02:15')
  })

  it('does not invent timing after an invalid block', () => {
    const slots = buildRelativeSessionTimeline([
      createSituation({ id: 'a', durationMinutes: 10 }),
      createSituation({ id: 'bad', durationMinutes: 0 }),
      createSituation({ id: 'c', durationMinutes: 20 }),
    ])
    expect(slots[0].label).toBe('00:00–00:10')
    expect(slots[1]).toMatchObject({ startMinutes: null, endMinutes: null, label: 'Horaires à corriger' })
    expect(slots[2]).toMatchObject({ startMinutes: null, endMinutes: null, label: 'Horaires à corriger' })
  })

  it('does not mutate the input or infer clock start time', () => {
    const situations = [createSituation({ id: 'a', durationMinutes: 15 })]
    const snapshot = structuredClone(situations)
    const slots = buildRelativeSessionTimeline(situations)
    expect(slots[0].label).toBe('00:00–00:15')
    expect(situations).toEqual(snapshot)
    expect(buildRelativeSessionTimeline([])).toEqual([])
  })
})
