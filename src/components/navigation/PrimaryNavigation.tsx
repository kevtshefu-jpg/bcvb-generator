import { Link, useLocation } from 'react-router-dom'
import { canAccessCategory, getSiteCategoryById } from '../../config/siteCategories.js'

type PrimaryNavItem = {
  id: string
  label: string
  to: string
  categoryId?: string
  adminOnly?: boolean
}

const primaryNavItems: PrimaryNavItem[] = [
  { id: 'home', label: 'Accueil', to: '/dashboard' },
  { id: 'create', label: 'Créer', to: '/admin/studio-editorial', categoryId: 'editorial-studio', adminOnly: true },
  { id: 'import', label: 'Importer / OCR', to: '/admin/ocr-pieces-jointes', categoryId: 'ocr-attachments', adminOnly: true },
  { id: 'library', label: 'Bibliothèque', to: '/bibliotheque', categoryId: 'library' },
  { id: 'quality', label: 'Qualité', to: '/admin/qualite-exports#qualite', categoryId: 'quality-exports', adminOnly: true },
  { id: 'exports', label: 'Exports', to: '/admin/qualite-exports#export', categoryId: 'quality-exports', adminOnly: true },
  { id: 'settings', label: 'Paramètres', to: '/parametres', categoryId: 'admin-settings', adminOnly: true },
]

function isVisible(item: PrimaryNavItem, role?: string | null) {
  if (!item.categoryId) return true
  const category = getSiteCategoryById(item.categoryId)
  return category ? canAccessCategory(category, role) : false
}

function isActive(item: PrimaryNavItem, pathname: string, hash: string) {
  const [targetPath, targetHash] = item.to.split('#')

  if (item.id === 'quality') {
    return pathname === targetPath && (!hash || hash === '#qualite')
  }

  if (targetHash) return pathname === targetPath && hash === `#${targetHash}`
  if (item.id === 'home') return pathname === '/' || pathname === '/dashboard'
  return pathname === targetPath || pathname.startsWith(`${targetPath}/`)
}

export function PrimaryNavigation({ role }: { role?: string | null }) {
  const location = useLocation()
  const visibleItems = primaryNavItems.filter((item) => isVisible(item, role))

  return (
    <nav className="primary-nav" aria-label="Navigation principale">
      {visibleItems.map((item) => (
        <Link
          key={item.id}
          to={item.to}
          className={`primary-nav__link${isActive(item, location.pathname, location.hash) ? ' primary-nav__link--active' : ''}`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
