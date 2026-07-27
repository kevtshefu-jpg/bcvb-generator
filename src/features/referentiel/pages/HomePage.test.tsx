import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import HomePage from './HomePage'

const authState = vi.hoisted(() => ({
  user: null as null | { id: string },
  profile: null as null | { role: string },
}))

vi.mock('../../auth/context/AuthContext', () => ({
  useAuth: () => authState,
}))

function renderHome() {
  return render(<MemoryRouter><HomePage /></MemoryRouter>)
}

describe('premier écran public', () => {
  beforeEach(() => {
    authState.user = null
    authState.profile = null
  })

  it('affiche le message GO LIVE', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: 'Bienvenue sur le Référentiel BCVB' })).toBeInTheDocument()
    expect(screen.getByText('Retrouvez vos équipes, séances, documents et outils selon votre rôle.')).toBeInTheDocument()
  })

  it('présente un seul CTA principal au visiteur', () => {
    const { container } = renderHome()
    expect(container.querySelectorAll('.v33-hero .v33-btn--primary')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/connexion')
    expect(screen.getByRole('link', { name: 'Demander un accès' })).toHaveAttribute('href', '/inscription')
    expect(screen.queryByText('Accéder à l’espace membre')).not.toBeInTheDocument()
  })

  it('présente uniquement le CTA vers son espace à un utilisateur connecté', () => {
    authState.user = { id: 'user-1' }
    authState.profile = { role: 'member' }
    const { container } = renderHome()
    expect(container.querySelectorAll('.v33-hero .v33-btn--primary')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Accéder à mon espace' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: 'Se connecter' })).not.toBeInTheDocument()
  })
})
