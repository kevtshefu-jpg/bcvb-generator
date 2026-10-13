import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createCourtFrame } from '../../modules/sessions/sessionModels'
import { CourtFrameEditor } from './CourtFrameEditor'

describe('CourtFrameEditor legacy round-trip', () => {
  it('préserve les types historiques et métadonnées lors du simple renommage', () => {
    const frame = createCourtFrame({
      id: 'court-legacy',
      title: 'Situation historique',
      courtType: 'half-right',
      objects: [
        { id: 'attacker', type: 'player_offense', x: 75, y: 50, label: '7' },
        { id: 'screen', type: 'screen', x: 60, y: 60, label: 'Écran' },
      ],
      arrows: [{
        id: 'pass', type: 'arrow_pass', fromX: 80, fromY: 50, toX: 60, toY: 40,
        label: 'Passe historique', control: { x: 75, y: 50 }, curved: true,
      }],
      zones: [{ id: 'help', x: 4, y: 5, width: 3, height: 2, label: 'Aide' }],
    })
    const onChange = vi.fn()
    render(<CourtFrameEditor frame={frame} onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Titre du terrain' }), {
      target: { value: 'Situation renommée' },
    })

    const saved = onChange.mock.lastCall?.[0]
    expect(saved.title).toBe('Situation renommée')
    expect(saved.objects).toHaveLength(2)
    expect(saved.objects.map((object: { type: string }) => object.type)).toEqual(['player_offense', 'screen'])
    expect(saved.objects[0]).toMatchObject({ id: 'attacker', x: 10.5, y: 7.5, label: '7' })
    expect(saved.arrows).toHaveLength(1)
    expect(saved.arrows[0]).toMatchObject({
      id: 'pass', type: 'arrow_pass', label: 'Passe historique',
      fromY: 7.5, control: { x: 10.5, y: 7.5 },
    })
    expect(saved.arrows[0].fromX).toBeCloseTo(11.2, 8)
    expect(saved.zones).toHaveLength(1)
    expect(saved.zones[0]).toMatchObject({ id: 'help', label: 'Aide' })
  })

  it('ne recrée pas les objets supprimés d’un terrain explicitement vide', () => {
    const frame = createCourtFrame({ id: 'empty-court', objects: [], arrows: [], zones: [] })
    const onChange = vi.fn()
    render(<CourtFrameEditor frame={frame} onChange={onChange} />)

    fireEvent.change(screen.getByRole('textbox', { name: 'Titre du terrain' }), {
      target: { value: 'Terrain vide conservé' },
    })

    const saved = onChange.mock.lastCall?.[0]
    expect(saved.objects).toEqual([])
    expect(saved.arrows).toEqual([])
    expect(saved.zones).toEqual([])
  })
})
