import { describe, expect, it } from 'vitest'
import { ACCESS_SUSPENDED_MESSAGE, isKnownUserRole, isProfileAllowed } from './profileAccess'

describe('validation fermée du profil applicatif', () => {
  it('refuse un profil introuvable et un utilisateur Auth sans profil', () => {
    expect(isProfileAllowed(null)).toBe(false)
    expect(isProfileAllowed(undefined)).toBe(false)
  })

  it('refuse un profil inactif', () => {
    expect(isProfileAllowed({ role: 'coach', is_active: false, profile_status: 'active' })).toBe(false)
  })

  it('refuse un statut non actif', () => {
    expect(isProfileAllowed({ role: 'coach', is_active: true, profile_status: 'pending' })).toBe(false)
    expect(isProfileAllowed({ role: 'coach', is_active: true, profile_status: null })).toBe(false)
  })

  it('refuse un rôle absent ou inconnu', () => {
    expect(isProfileAllowed({ role: null, is_active: true, profile_status: 'active' })).toBe(false)
    expect(isProfileAllowed({ role: 'super_admin', is_active: true, profile_status: 'active' })).toBe(false)
    expect(isKnownUserRole('super_admin')).toBe(false)
  })

  it('n’autorise qu’un profil complet explicitement actif', () => {
    expect(isProfileAllowed({ role: 'coach', is_active: true, profile_status: 'active' })).toBe(true)
    expect(ACCESS_SUSPENDED_MESSAGE).toBe(
      "Votre profil n’a pas pu être vérifié. L’accès est suspendu par sécurité.",
    )
  })
})
