import { describe, expect, it } from 'vitest'
import { evaluateSafetyDecision } from './safetyDecisionEngine'

describe('evaluateSafetyDecision', () => {
  it('reste vert sans signal défavorable', () => expect(evaluateSafetyDecision({ pain: 0 }).state).toBe('vert'))
  it('adapte au-dessus de 3/10', () => expect(evaluateSafetyDecision({ pain: 4 })).toMatchObject({ state: 'orange', action: 'adapter' }))
  it('arrête et oriente en cas d instabilité', () => expect(evaluateSafetyDecision({ pain: 1, instability: true })).toMatchObject({ state: 'rouge', action: 'arreter', professionalAdvice: true }))
  it('adapte si le RPE dépasse la cible', () => expect(evaluateSafetyDecision({ pain: 0, sessionRpe: 9, targetRpeMax: 8 }).state).toBe('orange'))
  it('évite deux séances très dures consécutives', () => expect(evaluateSafetyDecision({ pain: 0, previousHardSession: true, plannedHardSession: true }).state).toBe('orange'))
})
