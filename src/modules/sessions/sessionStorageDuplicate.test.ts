import { describe, expect, it } from 'vitest'
import { createSession, createSituation, createCourtFrame } from './sessionModels'
import { duplicateSession } from './sessionStorage'

describe('duplicateSession — isolation des données imbriquées', () => {
  it('conserve les valeurs des situations sans partager les références mutables', () => {
    const source = createSession({
      title: 'Séance source',
      objectives: ['Défendre fort'],
      situations: [createSituation({
        title: 'Transition',
        courtFrames: [createCourtFrame()],
        observableCriteria: ['Lecture défensive'],
      })],
    })

    const copy = duplicateSession(source)

    expect(copy.id).not.toBe(source.id)
    expect(copy.title).toBe('Séance source - copie')
    expect(copy.objectives).toEqual(source.objectives)
    expect(copy.objectives).not.toBe(source.objectives)
    expect(copy.situations).toEqual(source.situations)
    expect(copy.situations).not.toBe(source.situations)
    expect(copy.situations[0]).not.toBe(source.situations[0])
    expect(copy.situations[0].courtFrames[0].objects).not.toBe(source.situations[0].courtFrames[0].objects)
    expect(copy.situations[0].courtFrames[0].objects[0]).not.toBe(source.situations[0].courtFrames[0].objects[0])
    expect(copy.situations[0].observableCriteria).not.toBe(source.situations[0].observableCriteria)
  })
})
