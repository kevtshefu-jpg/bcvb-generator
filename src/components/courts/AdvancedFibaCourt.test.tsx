import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createCourtFrame } from '../../modules/sessions/sessionModels'
import { AdvancedFibaCourt } from './AdvancedFibaCourt'

describe('AdvancedFibaCourt workspace', () => {
  it('ajoute une frame vierge et la sélectionne', () => {
    const first = createCourtFrame({ title: 'Mise en place' })
    const onChange = vi.fn()

    render(<AdvancedFibaCourt frames={[first]} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter frame' }))

    const nextFrames = onChange.mock.calls[0][0]
    expect(nextFrames).toHaveLength(2)
    expect(nextFrames[1].objects).toEqual([])
    expect(nextFrames[1].arrows).toEqual([])
  })

  it('duplique le contenu de la frame active', () => {
    const first = createCourtFrame({
      title: 'Déclenchement',
      objects: [{ id: 'player-1', type: 'offense', x: 0.4, y: 0.5, label: '1' }],
    })
    const onChange = vi.fn()

    render(<AdvancedFibaCourt frames={[first]} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Plus d’actions pour la frame active'))
    fireEvent.click(screen.getByRole('button', { name: 'Dupliquer' }))

    const nextFrames = onChange.mock.calls[0][0]
    expect(nextFrames).toHaveLength(2)
    expect(nextFrames[1].objects).toEqual(first.objects)
    expect(nextFrames[1].id).not.toBe(first.id)
  })

  it('réinitialise la frame sans réintroduire d’objets', () => {
    const first = createCourtFrame({
      title: 'Frame test',
      objects: [{ id: 'ball-1', type: 'ball', x: 0.5, y: 0.5, label: '' }],
    })
    const onChange = vi.fn()

    render(<AdvancedFibaCourt frames={[first]} onChange={onChange} />)
    fireEvent.click(screen.getByLabelText('Plus d’actions pour la frame active'))
    fireEvent.click(screen.getByRole('button', { name: 'Réinitialiser terrain' }))

    const nextFrames = onChange.mock.calls[0][0]
    expect(nextFrames[0].title).toBe('Frame test')
    expect(nextFrames[0].objects).toEqual([])
    expect(nextFrames[0].arrows).toEqual([])
  })
})
