import { describe, expect, it } from 'vitest'

import { SITE_CATEGORIES } from '../../config/siteCategories.js'
import {
  MEMBER_MANAGEMENT_LEGACY_ROUTES,
  MEMBER_MANAGEMENT_PATH,
  canAccessMemberManagement,
} from './memberManagementRoute'

describe('route de gestion des membres', () => {
  it('retient une route canonique et deux alias historiques', () => {
    expect(MEMBER_MANAGEMENT_PATH).toBe('/admin/membres')
    expect(MEMBER_MANAGEMENT_LEGACY_ROUTES).toEqual([
      'admin/profils',
      'admin/utilisateurs',
    ])
  })

  it('réserve strictement la gestion globale au rôle admin', () => {
    expect(canAccessMemberManagement('admin')).toBe(true)
    expect(canAccessMemberManagement('responsable_technique')).toBe(false)
    expect(canAccessMemberManagement('dirigeant')).toBe(false)
    expect(canAccessMemberManagement('coach')).toBe(false)
    expect(canAccessMemberManagement('parent_referent')).toBe(false)
    expect(canAccessMemberManagement('member')).toBe(false)
    expect(canAccessMemberManagement(null)).toBe(false)
  })

  it('expose le lien canonique dans la navigation desktop admin uniquement', () => {
    const item = SITE_CATEGORIES.find((category) => category.id === 'admin-members')

    expect(item?.path).toBe(MEMBER_MANAGEMENT_PATH)
    expect(item?.roles).toEqual(['admin'])
  })
})
