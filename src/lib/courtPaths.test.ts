import { describe, expect, it } from 'vitest'
import { COURT_SCALE, getRimPosition } from './courtGeometry'
import { getBackboardLine } from './courtPaths'

describe('géométrie panier BCVB', () => {
  it('place la planche derrière le cercle côté ligne de fond sur les deux demi-terrains', () => {
    const leftRim = getRimPosition('half-left', 'left')
    const leftBoard = getBackboardLine('half-left', 'left')
    expect(leftBoard.x1 / COURT_SCALE).toBeLessThan(leftRim.x)
    expect(leftBoard.x2).toBe(leftBoard.x1)

    const rightRim = getRimPosition('half-right', 'right')
    const rightBoard = getBackboardLine('half-right', 'right')
    expect(rightBoard.x1 / COURT_SCALE).toBeGreaterThan(rightRim.x)
    expect(rightBoard.x2).toBe(rightBoard.x1)
  })

  it('conserve la même orientation sur le terrain entier', () => {
    const leftRim = getRimPosition('full', 'left')
    const rightRim = getRimPosition('full', 'right')
    const leftBoard = getBackboardLine('full', 'left')
    const rightBoard = getBackboardLine('full', 'right')

    expect(leftBoard.x1 / COURT_SCALE).toBeLessThan(leftRim.x)
    expect(rightBoard.x1 / COURT_SCALE).toBeGreaterThan(rightRim.x)
  })
})
