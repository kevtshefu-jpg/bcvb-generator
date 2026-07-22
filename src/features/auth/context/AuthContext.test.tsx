import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'

const authMocks = vi.hoisted(() => ({
  profileResponse: Promise.resolve({ data: null, error: null }) as Promise<unknown>,
  user: { id: 'auth-user-1', email: 'coach@example.test', app_metadata: {}, user_metadata: {} },
}))

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({
        data: { session: { user: authMocks.user, access_token: 'test-token' } },
      })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ maybeSingle: vi.fn(() => authMocks.profileResponse) })),
      })),
    })),
  },
}))

function AuthStateProbe() {
  const { user, profile, profileError, accessDenied, loading } = useAuth()
  if (loading) return <p>loading</p>
  return (
    <dl>
      <dt>user</dt><dd>{user?.id ?? 'none'}</dd>
      <dt>profile</dt><dd>{profile?.id ?? 'none'}</dd>
      <dt>error</dt><dd>{profileError ?? 'none'}</dd>
      <dt>denied</dt><dd>{String(accessDenied)}</dd>
    </dl>
  )
}

describe('AuthContext en comportement fermé', () => {
  beforeEach(() => {
    authMocks.profileResponse = Promise.resolve({ data: null, error: null })
  })

  it('conserve l’utilisateur Auth mais refuse un utilisateur sans profil', async () => {
    render(<AuthProvider><AuthStateProbe /></AuthProvider>)

    await waitFor(() => expect(screen.getByText('auth-user-1')).toBeInTheDocument())
    expect(screen.getByText('Aucun profil applicatif n’est associé à ce compte.')).toBeInTheDocument()
    expect(screen.getByText('true')).toBeInTheDocument()
    expect(screen.getByText('none')).toBeInTheDocument()
  })

  it('ne fabrique aucun profil actif après une erreur réseau', async () => {
    authMocks.profileResponse = Promise.reject(new Error('network unavailable'))
    render(<AuthProvider><AuthStateProbe /></AuthProvider>)

    await waitFor(() => expect(screen.getByText('network unavailable')).toBeInTheDocument())
    expect(screen.getByText('auth-user-1')).toBeInTheDocument()
    expect(screen.getByText('true')).toBeInTheDocument()
    expect(screen.getByText('none')).toBeInTheDocument()
  })
})
