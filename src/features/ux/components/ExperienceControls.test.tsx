import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ExperienceProvider } from '../context/ExperienceContext'
import ExperienceControls from './ExperienceControls'

function renderControls() {
  return render(<ExperienceProvider><ExperienceControls /></ExperienceProvider>)
}

async function openSettings() {
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: /Mode .*Modifier/i }))
  return user
}

describe('ExperienceControls', () => {
  it('démarre avec un contrôle compact en mode Découverte', () => {
    renderControls()
    expect(screen.getByRole('button', { name: /Mode Découverte.*Modifier/i })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Réglages d’affichage')).not.toBeInTheDocument()
  })

  it('ouvre des réglages accessibles', async () => {
    renderControls()
    await openSettings()

    expect(screen.getByText('Réglages d’affichage')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mode Découverte.*Modifier/i })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('button', { name: 'Agrandir le texte' })).toBeInTheDocument()
  })

  it('mémorise le mode expert et synchronise les outils coach', async () => {
    const eventSpy = vi.fn()
    window.addEventListener('bcvb:coach-tool-mode', eventSpy)
    renderControls()
    const user = await openSettings()

    await user.click(screen.getByRole('button', { name: 'Activer le mode Expert' }))

    expect(screen.getByRole('button', { name: 'Activer le mode Expert' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Mode Expert.*Modifier/i })).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('bcvb.experience.preferences') || '{}')).toMatchObject({ mode: 'compact' })
    expect(localStorage.getItem('bcvb.coach.toolMode')).toBe('expert')
    expect(eventSpy).toHaveBeenCalled()
  })

  it('active et désactive le texte agrandi depuis le panneau', async () => {
    renderControls()
    const user = await openSettings()
    await user.click(screen.getByRole('button', { name: 'Agrandir le texte' }))
    expect(screen.getByRole('button', { name: 'Texte standard' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Texte standard' }))
    expect(screen.getByRole('button', { name: 'Agrandir le texte' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('retombe en Découverte si les préférences sont corrompues', () => {
    localStorage.setItem('bcvb.experience.preferences', '{invalide')
    renderControls()
    expect(screen.getByRole('button', { name: /Mode Découverte.*Modifier/i })).toBeInTheDocument()
  })

  it('restaure le mode Expert au chargement suivant', () => {
    localStorage.setItem('bcvb.experience.preferences', JSON.stringify({ mode: 'compact', textSize: 'standard' }))
    renderControls()
    expect(screen.getByRole('button', { name: /Mode Expert.*Modifier/i })).toBeInTheDocument()
  })
})
