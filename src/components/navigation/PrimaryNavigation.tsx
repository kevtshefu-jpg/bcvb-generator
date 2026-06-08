import { Link, useLocation } from 'react-router-dom'
import { canAccessCategory, getSiteCategoryById } from '../../config/siteCategories.js'

type PrimaryNavItem = {
  id: string
  label: string
  ariaLabel: string
  to: string
  emoji: string
  categoryId?: string
  adminOnly?: boolean
  priority?: 'main' | 'control' | 'secondary'
}

const primaryNavItems: PrimaryNavItem[] = [
  {
    id: 'home',
    label: 'Accueil',
    ariaLabel: 'Retourner au tableau de bord',
    to: '/dashboard',
    emoji: '🏠',
    priority: 'main',
  },
  {
    id: 'create',
    label: 'Créer',
    ariaLabel: 'Créer un nouveau document BCVB',
    to: '/admin/documents/nouveau',
    categoryId: 'editorial-studio',
    adminOnly: true,
    emoji: '✍️',
    priority: 'main',
  },
  {
    id: 'import',
    label: 'Importer',
    ariaLabel: 'Importer un PDF, une image ou un scan avec OCR',
    to: '/admin/ocr-pieces-jointes',
    categoryId: 'ocr-attachments',
    adminOnly: true,
    emoji: '📥',
    priority: 'main',
  },
  {
    id: 'library',
    label: 'Bibliothèque',
    ariaLabel: 'Ouvrir la bibliothèque documentaire',
    to: '/bibliotheque',
    categoryId: 'library',
    emoji: '📚',
    priority: 'main',
  },
  {
    id: 'quality',
    label: 'Qualité',
    ariaLabel: 'Contrôler la qualité des documents',
    to: '/admin/qualite-exports#qualite',
    categoryId: 'quality-exports',
    adminOnly: true,
    emoji: '🛡️',
    priority: 'control',
  },
  {
    id: 'exports',
    label: 'Exports',
    ariaLabel: 'Préparer et exporter les documents en PDF',
    to: '/admin/qualite-exports#export',
    categoryId: 'quality-exports',
    adminOnly: true,
    emoji: '📤',
    priority: 'control',
  },
  {
    id: 'settings',
    label: 'Paramètres',
    ariaLabel: 'Ouvrir les paramètres du site',
    to: '/parametres',
    categoryId: 'admin-settings',
    adminOnly: true,
    emoji: '⚙️',
    priority: 'secondary',
  },
]

function isAdminRole(role?: string | null) {
  return role === 'admin' || role === 'responsable_technique'
}

function isVisible(item: PrimaryNavItem, role?: string | null) {
  if (item.adminOnly && !isAdminRole(role)) {
    return false
  }

  if (!item.categoryId) {
    return true
  }

  const category = getSiteCategoryById(item.categoryId)
  return category ? canAccessCategory(category, role) : false
}

function isActive(item: PrimaryNavItem, pathname: string, hash: string) {
  const [targetPath, targetHash] = item.to.split('#')

  if (item.id === 'quality') {
    return pathname === targetPath && (!hash || hash === '#qualite')
  }

  if (targetHash) {
    return pathname === targetPath && hash === `#${targetHash}`
  }

  if (item.id === 'home') {
    return pathname === '/' || pathname === '/dashboard'
  }

  return pathname === targetPath || pathname.startsWith(`${targetPath}/`)
}

export function PrimaryNavigation({ role }: { role?: string | null }) {
  const location = useLocation()
  const visibleItems = primaryNavItems.filter((item) => isVisible(item, role))

  const mainItems = visibleItems.filter((item) => item.priority === 'main')
  const controlItems = visibleItems.filter((item) => item.priority === 'control')
  const secondaryItems = visibleItems.filter((item) => item.priority === 'secondary')

  const renderItem = (item: PrimaryNavItem) => {
    const active = isActive(item, location.pathname, location.hash)

    return (
      <Link
        key={item.id}
        to={item.to}
        className={`primary-nav__link primary-nav__link--${item.priority ?? 'main'}${
          active ? ' primary-nav__link--active' : ''
        }`}
        aria-label={item.ariaLabel}
        aria-current={active ? 'page' : undefined}
      >
        <span className="primary-nav__emoji" aria-hidden="true">
          {item.emoji}
        </span>

        <span className="primary-nav__label">
          {item.label}
        </span>
      </Link>
    )
  }

  return (
    <nav className="primary-nav" aria-label="Navigation principale">
      <div className="primary-nav__group primary-nav__group--main">
        {mainItems.map(renderItem)}
      </div>

      {controlItems.length > 0 && (
        <div
          className="primary-nav__group primary-nav__group--control"
          aria-label="Contrôle documentaire"
        >
          {controlItems.map(renderItem)}
        </div>
      )}

      {secondaryItems.length > 0 && (
        <div
          className="primary-nav__group primary-nav__group--secondary"
          aria-label="Paramètres"
        >
          {secondaryItems.map(renderItem)}
        </div>
      )}
    </nav>
  )
}