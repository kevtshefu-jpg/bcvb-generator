import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

import { NAV_ITEMS } from '../../config/navigation'
import { PRESENTATION_LABELS } from '../../config/presentationMode'
import { useAuth } from '../../features/auth/context/AuthContext'
import {
  BcvbSectionIcon,
  type BcvbSectionIconName,
} from '../../features/ux/components/BcvbSectionIcon'

type MobileNavigationItem = {
  id: string
  label: string
  subtitle?: string
  to: string
  icon: BcvbSectionIconName
  variant: 'light' | 'green' | 'blue' | 'amber' | 'purple' | 'red'
  adminOnly?: boolean
  group?: string
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getMobileIcon(value: string): BcvbSectionIconName {
  const normalized = normalizeText(value)

  if (normalized.includes('tableau') || normalized.includes('dashboard')) return 'dashboard'
  if (normalized.includes('studio') || normalized.includes('creer')) return 'create'
  if (normalized.includes('bibliotheque') || normalized.includes('library')) return 'library'
  if (normalized.includes('document')) return 'documents'
  if (normalized.includes('faq') || normalized.includes('question')) return 'faq'
  if (normalized.includes('tutoriel')) return 'tutorial'
  if (normalized.includes('ocr') || normalized.includes('import')) return 'ocr'
  if (normalized.includes('qualite') || normalized.includes('score')) return 'quality'
  if (normalized.includes('seance') || normalized.includes('session')) return 'session'
  if (normalized.includes('planning') || normalized.includes('planification')) return 'planning'
  if (normalized.includes('equipe') || normalized.includes('effectif')) return 'teams'
  if (normalized.includes('presence') || normalized.includes('absence')) return 'attendance'
  if (normalized.includes('evaluation') || normalized.includes('joueur')) return 'evaluation'
  if (normalized.includes('dirigeant')) return 'directors'
  if (normalized.includes('parent')) return 'parents'
  if (normalized.includes('parametre') || normalized.includes('admin')) return 'settings'
  if (normalized.includes('connexion') || normalized.includes('compte')) return 'user'
  if (normalized.includes('inscription')) return 'club'

  return 'club'
}

function getMobileVariant(value: string): MobileNavigationItem['variant'] {
  const normalized = normalizeText(value)

  if (normalized.includes('studio') || normalized.includes('creer')) return 'green'
  if (normalized.includes('qualite')) return 'green'
  if (normalized.includes('ocr') || normalized.includes('import')) return 'blue'
  if (normalized.includes('bibliotheque') || normalized.includes('document')) return 'red'
  if (normalized.includes('faq') || normalized.includes('tutoriel')) return 'blue'
  if (normalized.includes('seance') || normalized.includes('planning')) return 'green'
  if (normalized.includes('presence') || normalized.includes('evaluation')) return 'purple'
  if (normalized.includes('dirigeant') || normalized.includes('parent')) return 'amber'
  if (normalized.includes('parametre') || normalized.includes('admin')) return 'red'
  if (normalized.includes('connexion') || normalized.includes('inscription')) return 'amber'

  return 'light'
}

function getItemPriority(item: MobileNavigationItem) {
  const value = normalizeText(`${item.label} ${item.to} ${item.group ?? ''}`)

  if (item.to === '/') return 1
  if (value.includes('dashboard') || value.includes('tableau')) return 2
  if (value.includes('bibliotheque')) return 3
  if (value.includes('faq')) return 4
  if (value.includes('seance')) return 5
  if (value.includes('planning')) return 6
  if (value.includes('equipe')) return 7
  if (value.includes('presence')) return 8
  if (value.includes('evaluation')) return 9
  if (value.includes('parametre') || value.includes('admin')) return 99

  return 20
}

function buildMobileItemFromNavItem(item: (typeof NAV_ITEMS)[number]): MobileNavigationItem {
  const searchValue = `${item.id} ${item.label} ${item.path} ${item.group}`

  return {
    id: item.id,
    label: item.label,
    subtitle: item.mainActions?.[0] ?? item.description,
    to: item.path,
    icon: getMobileIcon(searchValue),
    variant: getMobileVariant(searchValue),
    adminOnly: item.adminOnly,
    group: item.group,
  }
}

function MobileNavLink({
  item,
  onNavigate,
}: {
  item: MobileNavigationItem
  onNavigate: () => void
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        isActive
          ? 'mobile-nav-panel__link mobile-nav-panel__link--active'
          : 'mobile-nav-panel__link'
      }
      aria-label={item.subtitle ? `${item.label} — ${item.subtitle}` : item.label}
    >
      <span className="mobile-nav-panel__icon" aria-hidden="true">
        <BcvbSectionIcon name={item.icon} size="sm" variant={item.variant} />
      </span>

      <span className="mobile-nav-panel__text">
        <strong>{item.label}</strong>
        {item.subtitle ? <small>{item.subtitle}</small> : null}
      </span>

      {item.adminOnly ? (
        <span className="mobile-nav-panel__badge">ADMIN</span>
      ) : null}
    </NavLink>
  )
}

function QuickLink({
  item,
  onNavigate,
}: {
  item: MobileNavigationItem
  onNavigate: () => void
}) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onNavigate}
      className={({ isActive }) =>
        isActive
          ? 'mobile-nav__quickLink mobile-nav__quickLink--active'
          : 'mobile-nav__quickLink'
      }
    >
      <BcvbSectionIcon name={item.icon} size="sm" variant={item.variant} />
      <span>{item.label}</span>
    </NavLink>
  )
}

export default function MobileNavigation() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const role = profile?.role

  const visibleItems = useMemo(() => {
    const navigationItems = NAV_ITEMS
      .filter((item) => item.visible(role))
      .map(buildMobileItemFromNavItem)
      .sort((a, b) => getItemPriority(a) - getItemPriority(b))

    if (!user) {
      return [
        ...navigationItems,
        {
          id: 'mobile-login',
          label: 'Connexion',
          subtitle: 'Accéder à votre espace',
          to: '/connexion',
          icon: 'user',
          variant: 'amber',
          group: 'Compte',
        },
        {
          id: 'mobile-register',
          label: 'Inscription',
          subtitle: 'Créer une demande',
          to: '/inscription',
          icon: 'club',
          variant: 'red',
          group: 'Compte',
        },
      ] satisfies MobileNavigationItem[]
    }

    return navigationItems
  }, [role, user])

  const quickItems = useMemo(() => {
    const preferredPaths = ['/', '/bibliotheque', '/faq']
    const selected = preferredPaths
      .map((path) => visibleItems.find((item) => item.to === path))
      .filter(Boolean) as MobileNavigationItem[]

    return selected.length >= 2 ? selected : visibleItems.slice(0, 3)
  }, [visibleItems])

  const userLabel = useMemo(() => {
    if (!user) return 'Espace public'
    return profile?.full_name || user.email || 'Compte connecté'
  }, [profile?.full_name, user])

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  function closeMenu() {
    setOpen(false)
  }

  function toggleMenu() {
    setOpen((value) => !value)
  }

  return (
    <>
      <header className={open ? 'mobile-nav mobile-nav--open' : 'mobile-nav'}>
        <div className="mobile-nav__top">
          <div className="mobile-nav__brand">
            <img
              src="/logo_bcvb copie.png"
              alt=""
              className="mobile-nav__logoImage"
              onError={(event) => {
                event.currentTarget.style.display = 'none'
              }}
            />

            <div className="mobile-nav__brandText">
              <p>{PRESENTATION_LABELS.appTitle || 'BCVB Référentiel'}</p>
              <strong>Plateforme club</strong>
            </div>
          </div>

          <button
            type="button"
            className="mobile-nav__button"
            onClick={toggleMenu}
            aria-expanded={open}
            aria-controls="mobile-navigation-panel"
          >
            {open ? 'Fermer' : 'Menu'}
          </button>
        </div>

        {!open && quickItems.length > 0 ? (
          <nav className="mobile-nav__quickLinks" aria-label="Raccourcis mobiles">
            {quickItems.map((item) => (
              <QuickLink key={item.id} item={item} onNavigate={closeMenu} />
            ))}
          </nav>
        ) : null}
      </header>

      {open ? (
        <div className="mobile-nav-panel" role="presentation" onClick={closeMenu}>
          <nav
            id="mobile-navigation-panel"
            className="mobile-nav-panel__content"
            aria-label="Navigation mobile BCVB"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-nav-panel__header">
              <div>
                <p>Menu BCVB</p>
                <strong>{userLabel}</strong>
              </div>

              <button
                type="button"
                className="mobile-nav-panel__close"
                onClick={closeMenu}
              >
                Fermer
              </button>
            </div>

            <div className="mobile-nav-panel__quick">
              {quickItems.map((item) => (
                <QuickLink key={`panel-${item.id}`} item={item} onNavigate={closeMenu} />
              ))}
            </div>

            <div className="mobile-nav-panel__links">
              {visibleItems.map((item) => (
                <MobileNavLink key={item.id} item={item} onNavigate={closeMenu} />
              ))}
            </div>
          </nav>
        </div>
      ) : null}
    </>
  )
}