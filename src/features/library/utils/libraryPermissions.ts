import type { LibraryDocumentRow } from '../services/libraryService'

export type LibraryUser = {
  id?: string | null
  role?: string | null
  category_id?: string | null
}

const visibilityRoles: Record<string, string[]> = {
  public: ['admin', 'responsable_technique', 'coach', 'dirigeant', 'parent_referent', 'team_staff', 'member', 'joueur', 'parent', 'benevole', 'arbitre', 'otm'],
  club: ['admin', 'responsable_technique', 'coach', 'dirigeant', 'parent_referent', 'team_staff', 'member', 'joueur', 'parent', 'benevole', 'arbitre', 'otm'],
  coaches: ['admin', 'responsable_technique', 'coach', 'team_staff'],
  leaders: ['admin', 'responsable_technique', 'technical_manager', 'dirigeant'],
  parents_ref: ['admin', 'responsable_technique', 'technical_manager', 'parent_referent', 'team_staff'],
  private: ['admin', 'responsable_technique', 'technical_manager'],
}

function normalizeRole(role?: string | null) {
  if (role === 'membre') return 'member'
  if (role === 'technical_manager') return 'responsable_technique'
  return role || 'member'
}

function inferVisibility(document: LibraryDocumentRow) {
  const audience = (Array.isArray(document.audience) ? document.audience.join(' ') : document.audience || '').toLowerCase()
  const tags = (document.tags || []).join(' ').toLowerCase()
  const category = `${document.category || ''} ${document.subcategory || ''}`.toLowerCase()

  if (audience.includes('coach') || tags.includes('coach') || category.includes('séance')) return 'coaches'
  if (audience.includes('dirigeant') || tags.includes('dirigeant') || category.includes('institution')) return 'leaders'
  if (audience.includes('parent') || tags.includes('famille') || tags.includes('parent')) return 'parents_ref'
  if (document.visibility) return document.visibility
  return 'club'
}

export function getDocumentAllowedRoles(document: LibraryDocumentRow) {
  const explicitRoles = document.allowedRoles || document.allowed_roles
  if (explicitRoles?.length) return explicitRoles.map(normalizeRole)
  return (visibilityRoles[inferVisibility(document)] || visibilityRoles.club).map(normalizeRole)
}

export function canAccessDocument(user: LibraryUser | null | undefined, document: LibraryDocumentRow) {
  const role = normalizeRole(user?.role)
  if (role === 'admin' || role === 'responsable_technique' || role === 'technical_manager') return true

  const ownerId = document.ownerId || document.owner_id || document.uploaded_by
  if ((document.visibility === 'private' || inferVisibility(document) === 'private') && ownerId) {
    return Boolean(user?.id && user.id === ownerId)
  }

  return getDocumentAllowedRoles(document).includes(role)
}

export function canTransformDocument(user: LibraryUser | null | undefined) {
  const role = normalizeRole(user?.role)
  return ['admin', 'responsable_technique', 'technical_manager'].includes(role)
}
