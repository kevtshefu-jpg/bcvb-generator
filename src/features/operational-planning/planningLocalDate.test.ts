import { describe, expect, it } from 'vitest'
import { getPlanningLocalDay } from './planningLocalDate'

describe('date locale du planning', () => {
  it('bascule au jour métier local autour de minuit malgré le décalage UTC', () => {
    const instant = new Date('2026-08-16T22:30:00.000Z')

    expect(getPlanningLocalDay(instant, 'UTC').date).toBe('2026-08-16')
    expect(getPlanningLocalDay(instant, 'Europe/Paris')).toEqual({ date: '2026-08-17', weekday: 1 })
  })
})
