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
  it('supprime seulement la frame active et conserve intégralement les autres', () => {
    const first = createCourtFrame({ title: 'Avant', objects: [], arrows: [] })
    const second = createCourtFrame({ title: 'Après' })
    const onChange = vi.fn()

    render(<AdvancedFibaCourt frames={[first, second]} onChange={onChange} />)
    const actions = document.querySelector('.advanced-court__action-menu')
    expect(actions).not.toBeNull()
    fireEvent.click(within(actions as HTMLElement).getByText('Supprimer frame'))

    const remaining = onChange.mock.lastCall?.[0]
    expect(remaining).toEqual([second])
  })

  it('recrée le kit BCVB lors de la suppression de la dernière frame', () => {
    const onlyFrame = createCourtFrame({ title: 'Terrain unique', objects: [], arrows: [] })
    const onChange = vi.fn()

    render(<AdvancedFibaCourt frames={[onlyFrame]} onChange={onChange} />)
    const actions = document.querySelector('.advanced-court__action-menu')
    expect(actions).not.toBeNull()
    fireEvent.click(within(actions as HTMLElement).getByText('Supprimer frame'))

    const remaining = onChange.mock.lastCall?.[0]
    expect(remaining).toHaveLength(1)
    expect(remaining[0].id).not.toBe(onlyFrame.id)
    expect(remaining[0].objects.map((object: { type: string }) => object.type)).toEqual([
      'offense_player', 'defense_player', 'ball',
    ])
    expect(remaining[0].arrows).toHaveLength(1)
  })

})
