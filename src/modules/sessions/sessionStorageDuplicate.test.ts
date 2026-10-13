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
    expect(copy.situations[0]).toMatchObject({ title: source.situations[0].title, courtFrames: [{ title: source.situations[0].courtFrames[0].title }] })
    expect(copy.situations[0].id).not.toBe(source.situations[0].id)
    expect(copy.situations[0].courtFrames[0].id).not.toBe(source.situations[0].courtFrames[0].id)
    expect(copy.status).toBe('draft')
    expect(copy.situations).not.toBe(source.situations)
    expect(copy.situations[0]).not.toBe(source.situations[0])
    expect(copy.situations[0].courtFrames[0].objects).not.toBe(source.situations[0].courtFrames[0].objects)
    expect(copy.situations[0].courtFrames[0].objects[0]).not.toBe(source.situations[0].courtFrames[0].objects[0])
    expect(copy.situations[0].observableCriteria).not.toBe(source.situations[0].observableCriteria)
  })
  it('remet au brouillon une copie de séance publiée sans affecter la source', () => {
    const original = createSession({
      title: 'Séance validée',
      status: 'published',
      publishedAt: '2026-10-01T12:00:00Z',
      situations: [createSituation({ status: 'published', publishedAt: '2026-10-01T12:00:00Z' })],
    })
    const copy = duplicateSession(original)

    expect(copy.status).toBe('draft')
    expect(copy.publishedAt).toBe('')
    expect(copy.situations[0].status).toBe('draft')
    expect(copy.situations[0].publishedAt).toBe('')
    expect(original.status).toBe('published')
    expect(original.situations[0].status).toBe('published')
  })

})
