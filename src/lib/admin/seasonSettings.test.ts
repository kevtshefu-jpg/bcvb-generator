import { describe, expect, it } from 'vitest'
import { buildDefaultSeasons, createNextSeason, setActiveSeason } from './seasonSettings'

describe('default BCVB seasons', () => {
  it('keeps the August-July boundary without hardcoding an expired active season', () => {
    const july = buildDefaultSeasons(new Date(2026, 6, 31))
    const august = buildDefaultSeasons(new Date(2026, 7, 1))

    expect(july.find((season) => season.active)?.id).toBe('season-2025-2026')
    expect(august.find((season) => season.active)?.id).toBe('season-2026-2027')
    expect(august.find((season) => season.id === 'season-2025-2026')).toMatchObject({
      archived: true,
      active: false,
    })
    expect(august.find((season) => season.id === 'season-2024-2025')?.archived).toBe(true)
    expect(new Set(august.map((season) => season.id)).size).toBe(august.length)
  })

  it('does not override a deliberate administrator choice', () => {
    const defaults = buildDefaultSeasons(new Date(2026, 9, 14))
    const chosen = setActiveSeason(defaults, 'season-2025-2026')
    expect(chosen.find((season) => season.active)?.id).toBe('season-2025-2026')
    expect(chosen.find((season) => season.id === 'season-2025-2026')?.archived).toBe(false)
  })

  it('creates the next season as prepared, never active automatically', () => {
    const defaults = buildDefaultSeasons(new Date(2026, 9, 14))
    const next = createNextSeason(defaults)
    expect(next.find((season) => season.id === 'season-2027-2028')).toMatchObject({
      active: false,
      archived: false,
    })
    expect(next.find((season) => season.active)?.id).toBe('season-2026-2027')
  })
})
