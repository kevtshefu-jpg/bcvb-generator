import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { createSession, createSituation } from './sessionModels'
import { SessionTimeline } from './SessionTimeline'

describe('SessionTimeline workspace', () => {
  it('n’affiche qu’une situation active à la fois et permet de changer d’éditeur', () => {
    const first = createSituation({ order: 1, title: 'Situation A' })
    const second = createSituation({ order: 2, title: 'Situation B' })
    const session = createSession({ situations: [first, second] })

    render(<SessionTimeline session={session} onChange={vi.fn()} />)

    expect(screen.getByDisplayValue('Situation A')).toBeInTheDocument()
    expect(screen.queryByDisplayValue('Situation B')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: /Situation B/i }))

    expect(screen.queryByDisplayValue('Situation A')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Situation B')).toBeInTheDocument()
  })

  it('permet la navigation clavier entre situations', () => {
    const first = createSituation({ order: 1, title: 'Situation A' })
    const second = createSituation({ order: 2, title: 'Situation B' })
    const session = createSession({ situations: [first, second] })

    render(<SessionTimeline session={session} onChange={vi.fn()} />)

    const firstTab = screen.getByRole('tab', { name: /Situation A/i })
    fireEvent.keyDown(firstTab, { key: 'ArrowRight' })

    const secondTab = screen.getByRole('tab', { name: /Situation B/i })
    expect(secondTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByDisplayValue('Situation B')).toBeInTheDocument()
  })

  it('relie le tab actif à son panneau d’édition', () => {
    const situation = createSituation({ order: 1, title: 'Pression porteur' })
    const session = createSession({ situations: [situation] })

    render(<SessionTimeline session={session} onChange={vi.fn()} />)

    const tab = screen.getByRole('tab', { name: /Pression porteur/i })
    const panelId = tab.getAttribute('aria-controls')
    const panel = panelId ? document.getElementById(panelId) : null

    expect(panel).not.toBeNull()
    expect(panel).toHaveAttribute('role', 'tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', tab.id)
    expect(tab).toHaveAttribute('aria-selected', 'true')
  })
})
