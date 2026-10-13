import { describe, expect, it } from 'vitest'
import { createSession, createSituation } from './sessionModels'
import { getSessionDurationProblem, validateSessionDuration } from './sessionUtils'

describe('getSessionDurationProblem', () => {
  it('reports actual unplanned and excess minutes', () => {
    const situations = [createSituation({ durationMinutes: 20 }), createSituation({ durationMinutes: 25 })]
    expect(getSessionDurationProblem(createSession({ durationMinutes: 60, situations })))
      .toContain('15 min non planifiées')
    expect(getSessionDurationProblem(createSession({ durationMinutes: 30, situations })))
      .toContain('15 min au-delà')
    expect(getSessionDurationProblem(createSession({ durationMinutes: 45, situations }))).toBeNull()
  })

  it('never says zero missing minutes when zero or negative blocks cancel', () => {
    const session = createSession({
      durationMinutes: 20,
      situations: [createSituation({ durationMinutes: 30 }), createSituation({ durationMinutes: -10 })],
    })
    expect(validateSessionDuration(session).differenceMinutes).toBe(0)
    expect(getSessionDurationProblem(session)).toContain('Chaque situation doit durer')
  })

  it('identifies absent blocks and invalid announced minutes', () => {
    expect(getSessionDurationProblem(createSession({ durationMinutes: 60, situations: [] })))
      .toContain('Aucune situation planifiée')
    expect(getSessionDurationProblem(createSession({ durationMinutes: 0, situations: [] })))
      .toContain('La durée annoncée doit être')
  })

  it('rejects fractional blocks without fabricating a mismatch', () => {
    const session = createSession({
      durationMinutes: 20,
      situations: [createSituation({ durationMinutes: 10.5 }), createSituation({ durationMinutes: 9.5 })],
    })
    expect(getSessionDurationProblem(session)).toContain('nombre entier')
  })
})
