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
  shortLabel?: string
  subtitle?: string
  to: string
  icon: BcvbSectionIconName
  variant: 'light' | 'green' | 'blue' | 'amber' | 'purple' | 'red'
  adminOnly?: boolean
  group?: string
}

type MobileNavigationGroup = {
  title: string
  icon: BcvbSectionIconName
  variant: MobileNavigationItem['variant']
  items: MobileNavigationItem[]
}

const MOBILE_GROUP_ORDER = [
  'Accueil',
  'Bibliothèque documentaire',
  'Tutoriels / aide',
  'Espace coach',
  'Espace équipes',
  'Espaces dédiés',
  'Espace admin',
  'Gestion des membres',
  'Inscriptions',
  'Compte',
]

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getMobileIcon(value: string): BcvbSectionIconName {
  const normalized = normalizeText(value)

  if (normalized.includes('tableau') || normalized.includes('dashboard')) return 'dashboard'
  if (normalized.includes('studio') || normalized.includes('creer') || normalized.includes('editorial')) return 'create'
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
  const value = normalizeText(`${item.id} ${item.label} ${item.to} ${item.group ?? ''}`)

  if (item.to === '/') return 1
  if (item.to === '/dashboard') return 1
  if (value.includes('bibliotheque')) return 2
  if (value.includes('tutoriel')) return 3
  if (value.includes('faq')) return 4
  if (value.includes('studio')) return 4
  if (value.includes('seance')) return 5
  if (value.includes('equipe')) return 6
  if (value.includes('membre')) return 96
  if (value.includes('inscription')) return 97
  if (value.includes('parametre') || value.includes('admin')) return 98

  return 20
}

function getMobileGroup(item: Pick<MobileNavigationItem, 'id' | 'label' | 'to' | 'group'>) {
  const value = normalizeText(`${item.id} ${item.label} ${item.to} ${item.group ?? ''}`)

  if (item.group === 'Compte') return 'Compte'
  if (item.to === '/' || item.to === '/dashboard' || value.includes('tableau')) return 'Accueil'
  if (value.includes('bibliotheque') || value.includes('documentaire')) return 'Bibliothèque documentaire'
  if (value.includes('faq') || value.includes('tutoriel') || value.includes('aide')) return 'Tutoriels / aide'
  if (value.includes('membre')) return 'Gestion des membres'
  if (value.includes('inscription')) return 'Inscriptions'
  if (value.includes('admin') || value.includes('parametre') || value.includes('production')) return 'Espace admin'
  if (value.includes('seance') || value.includes('planning') || value.includes('planification')) return 'Espace coach'
  if (
    value.includes('equipe') ||
    value.includes('effectif') ||
    value.includes('presence') ||
    value.includes('evaluation')
  ) {
    return 'Espace équipes'
  }
  if (value.includes('dirigeant') || value.includes('parent') || value.includes('logistique')) return 'Espaces dédiés'

  return item.group || 'Accueil'
}

function getGroupIcon(group: string): BcvbSectionIconName {
  const value = normalizeText(group)

  if (value.includes('accueil')) return 'dashboard'
  if (value.includes('bibliotheque')) return 'library'
  if (value.includes('tutoriel') || value.includes('aide')) return 'faq'
  if (value.includes('coach')) return 'session'
  if (value.includes('equipe')) return 'teams'
  if (value.includes('membre')) return 'user'
  if (value.includes('inscription')) return 'club'
  if (value.includes('admin')) return 'settings'
  if (value.includes('dedie')) return 'parents'

  return 'club'
}

function getGroupVariant(group: string): MobileNavigationItem['variant'] {
  const value = normalizeText(group)

  if (value.includes('accueil') || value.includes('aide') || value.includes('bibliotheque')) return 'blue'
  if (value.includes('coach') || value.includes('equipe')) return 'green'
  if (value.includes('admin') || value.includes('membre') || value.includes('inscription')) return 'red'
  if (value.includes('dedie')) return 'amber'

  return 'light'
}

function groupMobileItems(items: MobileNavigationItem[]): MobileNavigationGroup[] {
  const groups = new Map<string, MobileNavigationItem[]>()

  items.forEach((item) => {
    const group = getMobileGroup(item)
    const currentItems = groups.get(group) ?? []
    currentItems.push({ ...item, group })
    groups.set(group, currentItems)
  })

  return Array.from(groups.entries())
    .sort(([groupA], [groupB]) => {
      const indexA = MOBILE_GROUP_ORDER.indexOf(groupA)
      const indexB = MOBILE_GROUP_ORDER.indexOf(groupB)

      return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB)
    })
    .map(([title, groupItems]) => ({
      title,
      icon: getGroupIcon(title),
      variant: getGroupVariant(title),
      items: groupItems.sort((a, b) => getItemPriority(a) - getItemPriority(b)),
    }))
}

function buildMobileItemFromNavItem(item: (typeof NAV_ITEMS)[number]): MobileNavigationItem {
  const searchValue = `${item.id} ${item.label} ${item.path} ${item.group}`

  return {
    id: item.id,
    label: item.label,
    shortLabel: item.shortLabel,
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
          ? 'mobile-nav-panel__link mobile-nav-panel__link--active bcvb-card-safe'
          : 'mobile-nav-panel__link bcvb-card-safe'
      }
      aria-label={item.subtitle ? `${item.label} — ${item.subtitle}` : item.label}
    >
      <span className="mobile-nav-panel__icon" aria-hidden="true">
        <BcvbSectionIcon name={item.icon} size="sm" variant={item.variant} />
      </span>

      <span className="mobile-nav-panel__text">
        <strong className="bcvb-text-clamp-2">{item.label}</strong>
        {item.subtitle ? <small className="bcvb-text-clamp-2">{item.subtitle}</small> : null}
      </span>

      {item.adminOnly ? (
        <span className="mobile-nav-panel__badge bcvb-badge-safe">ADMIN</span>
      ) : null}
    </NavLink>
  )
}

function MobileNavGroup({
  group,
  onNavigate,
}: {
  group: MobileNavigationGroup
  onNavigate: () => void
}) {
  const titleId = `mobile-nav-group-${normalizeText(group.title).replace(/[^a-z0-9]+/g, '-')}`

  return (
    <section className="mobile-nav-panel__group" aria-labelledby={titleId}>
      <div className="mobile-nav-panel__groupTitle" id={titleId}>
        <span className="mobile-nav-panel__groupIcon" aria-hidden="true">
          <BcvbSectionIcon name={group.icon} size="sm" variant={group.variant} />
        </span>
        <span>{group.title}</span>
      </div>

      <div className="mobile-nav-panel__links">
        {group.items.map((item) => (
          <MobileNavLink key={item.id} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </section>
  )
}

export default function MobileNavigation() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const role = profile?.role

  const visibleItems = useMemo(() => {
    if (!user) {
      return [
        {
          id: 'mobile-home',
          label: 'Accueil',
          shortLabel: 'Accueil',
          subtitle: 'Présentation du référentiel BCVB',
          to: '/',
          icon: 'dashboard',
          variant: 'blue',
          group: 'Accueil',
        },
        {
          id: 'mobile-login',
          label: 'Connexion',
          shortLabel: 'Connexion',
          subtitle: 'Accéder à votre espace',
          to: '/connexion',
          icon: 'user',
          variant: 'amber',
          group: 'Compte',
        },
        {
          id: 'mobile-register',
          label: 'Inscription',
          shortLabel: 'Inscription',
          subtitle: 'Créer un accès',
          to: '/inscription',
          icon: 'club',
          variant: 'red',
          group: 'Compte',
        },
      ] satisfies MobileNavigationItem[]
    }

    const navigationItems = NAV_ITEMS
      .filter((item) => item.visible(role))
      .map(buildMobileItemFromNavItem)
      .sort((a, b) => getItemPriority(a) - getItemPriority(b))

    const canAccessAdmin = role === 'admin' || role === 'responsable_technique'
    const adminItems: MobileNavigationItem[] =
      canAccessAdmin
        ? [
            {
              id: 'mobile-admin-home',
              label: 'Espace admin',
              shortLabel: 'Admin',
              subtitle: 'Vue globale de l’administration',
              to: '/admin',
              icon: 'settings',
              variant: 'red',
              adminOnly: true,
              group: 'Espace admin',
            },
            {
              id: 'mobile-admin-members',
              label: 'Gestion des membres',
              shortLabel: 'Membres',
              subtitle: 'Profils, rôles et statuts',
              to: '/admin/membres',
              icon: 'user',
              variant: 'red',
              adminOnly: true,
              group: 'Gestion des membres',
            },
            {
              id: 'mobile-admin-registrations',
              label: 'Inscriptions',
              shortLabel: 'Inscriptions',
              subtitle: 'Demandes d’accès à valider',
              to: '/admin/inscriptions',
              icon: 'club',
              variant: 'red',
              adminOnly: true,
              group: 'Inscriptions',
            },
          ]
        : []

    const allNavigationItems = [...navigationItems, ...adminItems]
    const uniqueNavigationItems = Array.from(
      new Map(allNavigationItems.map((item) => [item.to, item])).values()
    ).sort((a, b) => getItemPriority(a) - getItemPriority(b))

    return uniqueNavigationItems
  }, [role, user])

  const groupedItems = useMemo(() => groupMobileItems(visibleItems), [visibleItems])
  const activeItem = useMemo(
    () =>
      visibleItems
        .filter((item) => location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(`${item.to}/`)))
        .sort((a, b) => b.to.length - a.to.length)[0],
    [location.pathname, visibleItems]
  )

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
      <header className="mobile-nav">
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
              <p className="bcvb-text-clamp-1">BCVB Référentiel</p>
              <strong className="bcvb-text-safe">{PRESENTATION_LABELS.appTitle}</strong>
              <small className="bcvb-text-clamp-1">{activeItem?.shortLabel || activeItem?.label || 'Plateforme club'}</small>
            </div>
          </div>

          <button
            type="button"
            className="mobile-nav__button bcvb-action-button-safe"
            onClick={toggleMenu}
            aria-expanded={open}
            aria-controls="mobile-navigation-panel"
            aria-label={open ? 'Fermer le menu mobile' : 'Ouvrir le menu mobile'}
          >
            <span className="mobile-nav__buttonIcon" aria-hidden="true">{open ? '×' : '☰'}</span>
            <span>{open ? 'Fermer' : 'Menu'}</span>
          </button>
        </div>

      </header>

      {open ? (
        <div
          className="mobile-nav-panel"
          role="presentation"
          onClick={closeMenu}
        >
          <nav
            id="mobile-navigation-panel"
            className="mobile-nav-panel__content"
            aria-label="Navigation mobile BCVB"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-nav-panel__header">
              <div>
                <p className="bcvb-text-safe">Menu BCVB</p>
                <strong className="bcvb-text-clamp-2">{user ? profile?.full_name || user.email : 'Espace public'}</strong>
                <small className="bcvb-text-clamp-1">
                  {activeItem ? `Page active : ${activeItem.label}` : 'Toutes les sections utiles en deux gestes'}
                </small>
              </div>

              <button
                type="button"
                className="mobile-nav-panel__close bcvb-action-button-safe"
                onClick={closeMenu}
              >
                Fermer
              </button>
            </div>

            {groupedItems.map((group) => (
              <MobileNavGroup key={group.title} group={group} onNavigate={closeMenu} />
            ))}
          </nav>
        </div>
      ) : null}
    </>
  )
}
