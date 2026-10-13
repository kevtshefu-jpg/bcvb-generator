import { describe, expect, it } from 'vitest'
import { createCourtFrame, createSituation } from './sessionModels'
import { duplicateSituation } from './sessionUtils'

describe('duplicateSituation — isolement des schémas tactiques', () => {
  it('conserve les éléments tout en isolant les objets, flèches et zones de la copie', () => {
    const frame = createCourtFrame({
      title: 'Transition',
      objects: [{ id: 'attacker-1', type: 'offense_player', x: 4, y: 6, label: '1' }],
      arrows: [{
        id: 'move-1', type: 'arrow_move', fromX: 4, fromY: 6, toX: 4, toY: 9,
        control: { x: 5, y: 7 },
      }],
      zones: [{
        id: 'zone-1', x: 2, y: 3, width: 4, height: 5, label: 'Couloir',
        points: [{ x: 2, y: 3 }, { x: 6, y: 8 }],
      }],
    })
    const source = createSituation({ title: 'Courir', courtFrames: [frame] })
    const copy = duplicateSituation(source)

    expect(copy.id).not.toBe(source.id)
    expect(copy.courtFrames[0].id).not.toBe(frame.id)
    expect(copy.courtFrames[0].objects).toEqual(frame.objects)
    expect(copy.courtFrames[0].arrows).toEqual(frame.arrows)
    expect(copy.courtFrames[0].zones).toEqual(frame.zones)

    expect(copy.courtFrames[0].objects).not.toBe(frame.objects)
    expect(copy.courtFrames[0].objects[0]).not.toBe(frame.objects[0])
    expect(copy.courtFrames[0].arrows[0].control).not.toBe(frame.arrows[0].control)
    expect(copy.courtFrames[0].zones[0].points).not.toBe(frame.zones[0].points)
  })
  it('isole les métriques, les critères et les adaptations de la situation source', () => {
    const source = createSituation({
      title: 'Lecture 1c1',
      metrics: [{ id: 'metric-1', label: 'Réussites', type: 'count', target: '7', observed: '', unit: '/10', notes: '' }],
      adaptationsByLevel: { easier: 'Sans pression', standard: '1c1', harder: 'Aide défensive' },
      observableCriteria: ['Décision juste'],
    })
    const copy = duplicateSituation(source)

    expect(copy.metrics).toEqual(source.metrics)
    expect(copy.metrics).not.toBe(source.metrics)
    expect(copy.metrics[0]).not.toBe(source.metrics[0])
    expect(copy.adaptationsByLevel).toEqual(source.adaptationsByLevel)
    expect(copy.adaptationsByLevel).not.toBe(source.adaptationsByLevel)
    expect(copy.observableCriteria).toEqual(source.observableCriteria)
    expect(copy.observableCriteria).not.toBe(source.observableCriteria)
  })

})
