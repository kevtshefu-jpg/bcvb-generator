import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SessionTemplatePicker } from './SessionTemplatePicker'

describe('SessionTemplatePicker', () => {
  it('affiche les écarts de durée des modèles et préserve le modèle U13 conforme', () => {
    render(<SessionTemplatePicker onPick={vi.fn()} />)

    expect(screen.getByText(/Durée à corriger : 8 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à corriger : 10 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à corriger : 17 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à corriger : 18 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à corriger : 13 min non planifiées/)).toBeTruthy()
    expect(screen.getByText(/Durée à corriger : 15 min non planifiées/)).toBeTruthy()
    expect(screen.getAllByRole('status')).toHaveLength(6)
    expect(screen.getByText(/Déroulé : 52 min/)).toBeTruthy()
    expect(screen.getByText(/Déroulé : 82 min/)).toBeTruthy()
  })
})
