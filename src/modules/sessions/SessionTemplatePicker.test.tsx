import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SessionTemplatePicker } from './SessionTemplatePicker'

describe('SessionTemplatePicker', () => {
  it('affiche les écarts de durée des modèles et préserve le modèle U13 conforme', () => {
    render(<SessionTemplatePicker onPick={vi.fn()} />)

    expect(screen.getByText(/Durée à compléter : 8 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à compléter : 10 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à compléter : 17 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à compléter : 18 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à compléter : 13 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à compléter : 15 min non planifiées/)).toBeTruthy()
    expect(screen.getAllByRole('status')).toHaveLength(6)
  })
})
