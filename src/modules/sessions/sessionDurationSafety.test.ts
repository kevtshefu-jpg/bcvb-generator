import { describe, expect, it } from 'vitest'
import { createSession, createSituation } from './sessionModels'
import { analyzeSessionQuality } from './sessionQuality'
import { validateSessionDuration } from './sessionUtils'

describe('duration safety contract', () => {
  it('requires at least one pedagogical block and a positive announced duration', () => {
    const empty = createSession({ durationMinutes: 0, situations: [] })
    expect(validateSessionDuration(empty)).toMatchObject({
      announcedMinutes: 0,
      calculatedMinutes: 0,
      differenceMinutes: 0,
      valid: false,
    })
    expect(analyzeSessionQuality(empty).status).toBe('brouillon')
  })

  it.each([
    { label: 'negative compensating block', values: [30, -10], announced: 20 },
    { label: 'zero block', values: [20, 0], announced: 20 },
    { label: 'fractional block', values: [10.5, 9.5], announced: 20 },
    { label: 'fractional announced duration', values: [10.5], announced: 10.5 },
  ])('rejects $label even when sums match', ({ values, announced }) => {
    const session = createSession({
      durationMinutes: announced,
      situations: values.map((durationMinutes) => createSituation({ durationMinutes })),
    })
    const before = structuredClone(session)
    expect(validateSessionDuration(session).differenceMinutes).toBe(0)
    expect(validateSessionDuration(session).valid).toBe(false)
    expect(analyzeSessionQuality(session).status).toBe('brouillon')
    expect(session).toEqual(before)
  })

  it('accepts strictly positive integer minutes with an exact sum', () => {
    const session = createSession({
      durationMinutes: 45,
      situations: [createSituation({ durationMinutes: 20 }), createSituation({ durationMinutes: 25 })],
    })
    expect(validateSessionDuration(session).valid).toBe(true)
  })
})
