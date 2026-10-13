import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { createSession, createSituation } from './sessionModels'
import { SessionPreview } from './SessionPreview'

describe('SessionPreview — cohérence des durées', () => {
  it('affiche un avertissement dans la vue imprimable si le déroulé est incomplet', () => {
    const session = createSession({
      title: 'U15 à compléter',
      durationMinutes: 100,
      situations: [createSituation({ durationMinutes: 82 })],
    })
    render(<SessionPreview session={session} mode="print" />)
    expect(screen.getByRole('alert').textContent).toContain('18 min non planifiées')
  })

  it('ne signale pas de faux écart pour une séance équilibrée', () => {
    const session = createSession({
      title: 'U13 conforme',
      durationMinutes: 90,
      situations: [createSituation({ durationMinutes: 90 })],
    })
    render(<SessionPreview session={session} mode="coach" />)
    expect(screen.queryByRole('alert')).toBeNull()
  })
})
