import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExperienceProvider } from '../context/ExperienceContext'
import ExperienceControls from './ExperienceControls'

function renderControls() {
  return render(<ExperienceProvider><ExperienceControls /></ExperienceProvider>)
}

describe('ExperienceControls', () => {
  it('démarre dans le mode Découverte le plus guidé', () => {
    renderControls()
    expect(screen.getByRole('button', { name: /Découverte/i })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Expert/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('mémorise le mode expert et synchronise les outils coach', async () => {
    const user = userEvent.setup()
    const eventSpy = vi.fn()
    window.addEventListener('bcvb:coach-tool-mode', eventSpy)
    renderControls()

    await user.click(screen.getByRole('button', { name: /Expert/i }))

    expect(screen.getByRole('button', { name: /Expert/i })).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(localStorage.getItem('bcvb.experience.preferences') || '{}')).toMatchObject({ mode: 'compact' })
    expect(localStorage.getItem('bcvb.coach.toolMode')).toBe('expert')
    expect(eventSpy).toHaveBeenCalled()
  })

  it('active et désactive le texte agrandi', async () => {
    const user = userEvent.setup()
    renderControls()
    const enlarge = screen.getByRole('button', { name: 'Agrandir le texte' })
    await user.click(enlarge)
    expect(screen.getByRole('button', { name: 'Texte standard' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Texte standard' }))
    expect(screen.getByRole('button', { name: 'Agrandir le texte' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('retombe en Découverte si les préférences sont corrompues', () => {
    localStorage.setItem('bcvb.experience.preferences', '{invalide')
    renderControls()
    expect(screen.getByRole('button', { name: /Découverte/i })).toHaveAttribute('aria-pressed', 'true')
  })
})
