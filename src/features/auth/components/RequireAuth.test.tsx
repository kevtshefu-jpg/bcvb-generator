import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import RequireAuth from './RequireAuth'

const authState = vi.hoisted(() => ({
  profile: {
    id: 'user-1',
    role: 'admin',
    is_active: true,
    profile_status: 'active',
  } as { id: string; role: string | null; is_active: boolean; profile_status: string } | null,
  session: { user: { id: 'user-1' } } as unknown,
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    profile: authState.profile,
    loading: false,
    profileError: null,
  }),
}))

vi.mock('../../../hooks/useStableSession', () => ({
  useStableSession: () => ({
    loading: false,
    session: authState.session,
    error: null,
  }),
}))

function renderMemberRoute(initialEntry = '/admin/membres') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/connexion" element={<h1>Connexion membre</h1>} />
        <Route element={<RequireAuth allowedRoles={['admin']} />}>
          <Route path="/admin/membres" element={<h1>Gestion des membres</h1>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('accès à /admin/membres', () => {
  beforeEach(() => {
    authState.profile = {
      id: 'user-1',
      role: 'admin',
      is_active: true,
      profile_status: 'active',
    }
    authState.session = { user: { id: 'user-1' } }
  })

  it('rend la page pour un administrateur', () => {
    renderMemberRoute()

    expect(screen.getByRole('heading', { name: 'Gestion des membres' })).toBeInTheDocument()
  })

  it('bloque proprement un responsable technique', () => {
    authState.profile = { ...authState.profile!, role: 'responsable_technique' }
    renderMemberRoute()

    expect(screen.getByRole('heading', { name: 'Section réservée' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Gestion des membres' })).not.toBeInTheDocument()
  })

  it('redirige un visiteur sans session vers la connexion', () => {
    authState.session = null
    renderMemberRoute()

    expect(screen.getByRole('heading', { name: 'Connexion membre' })).toBeInTheDocument()
  })

  it('suspend l’accès d’un profil inactif', () => {
    authState.profile = { ...authState.profile!, is_active: false }
    renderMemberRoute()

    expect(screen.getByText("Votre profil n’a pas pu être vérifié. L’accès est suspendu par sécurité.")).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Gestion des membres' })).not.toBeInTheDocument()
  })

  it('suspend l’accès d’un utilisateur authentifié sans profil', () => {
    authState.profile = null
    renderMemberRoute()

    expect(screen.getByText("Votre profil n’a pas pu être vérifié. L’accès est suspendu par sécurité.")).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Gestion des membres' })).not.toBeInTheDocument()
  })
})
