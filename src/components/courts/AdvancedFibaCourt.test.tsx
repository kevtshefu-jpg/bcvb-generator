import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createCourtFrame } from '../../modules/sessions/sessionModels'
import { AdvancedFibaCourt } from './AdvancedFibaCourt'

describe('AdvancedFibaCourt workspace', () => {
  it('ajoute une frame équipée BCVB et la sélectionne', () => {
    const first = createCourtFrame({ title: 'Mise en place' })
    const onChange = vi.fn()

    render(<AdvancedFibaCourt frames={[first]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter frame' }))

    const nextFrames = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0]
    expect(nextFrames).toHaveLength(2)
    expect(nextFrames[1].objects.map((object: { type: string }) => object.type)).toEqual(['offense_player', 'defense_player', 'ball'])
    expect(nextFrames[1].arrows).toHaveLength(1)
  })

  it('duplique le contenu de la frame active', () => {
    const first = createCourtFrame({
      title: 'Déclenchement',
      objects: [{ id: 'player-1', type: 'offense_player', x: 0.4, y: 0.5, label: '1' }],
    })
    const onChange = vi.fn()

    render(<AdvancedFibaCourt frames={[first]} onChange={onChange} />)
    const actionMenu = document.querySelector('.advanced-court__action-menu')
    expect(actionMenu).not.toBeNull()
    fireEvent.click(within(actionMenu as HTMLElement).getByText('Dupliquer'))

    const nextFrames = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0]
    expect(nextFrames).toHaveLength(2)
    expect(nextFrames[1].objects).toEqual(first.objects)
    expect(nextFrames[1].id).not.toBe(first.id)
  })

  it('relie la frame active à son panneau terrain', () => {
    const first = createCourtFrame({ title: 'Mise en place' })

    render(<AdvancedFibaCourt frames={[first]} onChange={vi.fn()} />)

    const tab = screen.getByRole('tab', { name: /Mise en place/i })
    const panel = screen.getByRole('tabpanel')
    expect(tab).toHaveAttribute('aria-controls', panel.id)
    expect(panel).toHaveAttribute('aria-labelledby', tab.id)
  })

  it('n’altère pas les autres frames lors d’un changement d’orientation', () => {
    const first = createCourtFrame({
      title: 'Frame 1',
      courtType: 'half-right',
      objects: [{ id: 'player-1', type: 'offense_player', x: 0.4, y: 0.5, label: '1' }],
    })
    const second = createCourtFrame({
      title: 'Frame 2',
      courtType: 'half-left',
      objects: [{ id: 'ball-2', type: 'ball', x: 0.6, y: 0.4, label: '' }],
    })
    const onChange = vi.fn()

    render(<AdvancedFibaCourt frames={[first, second]} onChange={onChange} />)
    const actionMenu = document.querySelector('.advanced-court__action-menu')
    expect(actionMenu).not.toBeNull()
    fireEvent.click(within(actionMenu as HTMLElement).getByText('Terrain entier'))

    const nextFrames = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0]
    expect(nextFrames[0].courtType).toBe('full')
    expect(nextFrames[0].objects).toEqual(first.objects)
    expect(nextFrames[1]).toEqual(second)
  })

  it('réinitialise la frame sans réintroduire d’objets', () => {
    const first = createCourtFrame({
      title: 'Frame test',
      objects: [{ id: 'ball-1', type: 'ball', x: 0.5, y: 0.5, label: '' }],
    })
    const onChange = vi.fn()

    render(<AdvancedFibaCourt frames={[first]} onChange={onChange} />)
    const actionMenu = document.querySelector('.advanced-court__action-menu')
    expect(actionMenu).not.toBeNull()
    fireEvent.click(within(actionMenu as HTMLElement).getByText('Réinitialiser terrain'))

    const nextFrames = onChange.mock.calls[onChange.mock.calls.length - 1]?.[0]
    expect(nextFrames[0].title).toBe('Frame test')
    expect(nextFrames[0].objects).toEqual([])
    expect(nextFrames[0].arrows).toEqual([])
  })
})
