import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createSession, createSituation } from './sessionModels'
import { SessionDurationReconciliation } from './SessionDurationReconciliation'

describe('SessionDurationReconciliation', () => {
  const session = createSession({
    durationMinutes: 60,
    situations: [
      createSituation({ durationMinutes: 20 }),
      createSituation({ durationMinutes: 25 }),
    ],
  })

  it('affiche les minutes manquantes sans corriger silencieusement les blocs', () => {
    const onChange = vi.fn()
    const before = structuredClone(session)
    render(<SessionDurationReconciliation session={session} readOnly={false} onChange={onChange} />)

    expect(screen.getByRole('alert').textContent).toContain('15 min non planifiées')
    expect(screen.getByRole('link', { name: 'Compléter ou ajuster les situations' }).getAttribute('href'))
      .toBe('#session-situations')
    expect(onChange).not.toHaveBeenCalled()
    expect(session).toEqual(before)

    fireEvent.click(screen.getByRole('button', { name: 'Retenir 45 min comme durée de séance' }))
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange.mock.lastCall?.[0].durationMinutes).toBe(45)
    expect(onChange.mock.lastCall?.[0].situations).toEqual(session.situations)
  })

  it('interdit les modifications pour une séance en lecture seule', () => {
    const onChange = vi.fn()
    render(<SessionDurationReconciliation session={session} readOnly onChange={onChange} />)
    const button = screen.getByRole('button', { name: 'Retenir 45 min comme durée de séance' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(button)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('ne propose pas de réduire à zéro une séance sans situation', () => {
    const onChange = vi.fn()
    render(<SessionDurationReconciliation session={createSession({ durationMinutes: 60, situations: [] })} readOnly={false} onChange={onChange} />)
    expect((screen.getByRole('button', { name: 'Retenir 0 min comme durée de séance' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('ne propose pas une correction artificielle quand les blocs sont invalides mais que la somme est juste', () => {
    const onChange = vi.fn()
    const invalid = createSession({
      durationMinutes: 20,
      situations: [
        createSituation({ durationMinutes: 30 }),
        createSituation({ durationMinutes: -10 }),
      ],
    })
    render(<SessionDurationReconciliation session={invalid} readOnly={false} onChange={onChange} />)
    expect(screen.getByRole('alert').textContent).toContain('Chaque situation doit durer un nombre entier')
    expect(screen.getByRole('alert').textContent).not.toContain('0 min au-delà')
    const button = screen.getByRole('button', { name: 'Retenir 20 min comme durée de séance' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(button)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('confirme une séance déjà cohérente sans afficher de commande', () => {
    const onChange = vi.fn()
    render(<SessionDurationReconciliation session={createSession({ durationMinutes: 45, situations: session.situations })} readOnly={false} onChange={onChange} />)
    expect(screen.getByRole('status').textContent).toContain('45 min planifiées')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('distingue le dépassement du temps cible', () => {
    const onChange = vi.fn()
    render(<SessionDurationReconciliation session={createSession({ durationMinutes: 30, situations: session.situations })} readOnly={false} onChange={onChange} />)
    expect(screen.getByRole('alert').textContent).toContain('15 min au-delà de la durée annoncée')
  })
})
