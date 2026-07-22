import { describe, expect, it } from 'vitest'
import { hasAnyRole, hasPermission } from './permissions'

describe('helpers de permissions fermés par défaut', () => {
  it('ne transforme pas un rôle absent ou inconnu en membre', () => {
    expect(hasPermission(null, 'library:read')).toBe(false)
    expect(hasPermission(undefined, 'documents:download')).toBe(false)
    expect(hasPermission('inconnu', 'library:read')).toBe(false)
    expect(hasAnyRole(null, ['member'])).toBe(false)
  })

  it('conserve les permissions des rôles reconnus', () => {
    expect(hasPermission('member', 'library:read')).toBe(true)
    expect(hasPermission('coach', 'sessions:create')).toBe(true)
  })
})
