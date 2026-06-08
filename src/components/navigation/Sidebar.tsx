import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '../../config/navigation'
import { PRESENTATION_LABELS } from '../../config/presentationMode'
import { useAuth } from '../../features/auth/context/AuthContext'
import { BcvbSectionIcon, type BcvbSectionIconName } from '../../features/ux/components/BcvbSectionIcon'

function linkClass({ isActive }: { isActive: boolean }) {
  return `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
}

function groupBySection<T extends { group: string }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    groups[item.group] = groups[item.group] ? [...groups[item.group], item] : [item]
    return groups
  }, {})
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getSectionIcon(section: string): BcvbSectionIconName {
  const normalized = normalizeText(section)

  if (normalized.includes('tableau')) return 'dashboard'
  if (normalized.includes('production')) return 'production'
  if (normalized.includes('document')) return 'documents'
  if (normalized.includes('terrain')) return 'court'
  if (normalized.includes('coach')) return 'court'
  if (normalized.includes('espace')) return 'directors'
  if (normalized.includes('compte')) return 'user'

  return 'club'
}

function getSectionVariant(section: string): 'red' | 'green' | 'blue' | 'amber' | 'purple' {
  const normalized = normalizeText(section)

  if (normalized.includes('tableau')) return 'blue'
  if (normalized.includes('production')) return 'green'
  if (normalized.includes('document')) return 'red'
  if (normalized.includes('terrain')) return 'green'
  if (normalized.includes('coach')) return 'green'
  if (normalized.includes('espace')) return 'purple'

  return 'red'
}

function getItemIcon(item: {
  id: string
  label: string
  path: string
  color?: string
}): BcvbSectionIconName {
  const value = normalizeText(`${item.id} ${item.label} ${item.path}`)

  if (value.includes('dashboard') || value.includes('tableau')) return 'dashboard'

  if (value.includes('studio') || value.includes('editor') || value.includes('editorial')) return 'create'
  if (value.includes('nouveau') || value.includes('creer')) return 'create'

  if (value.includes('ocr') || value.includes('piece') || value.includes('import')) return 'ocr'

  if (value.includes('qualite') || value.includes('score') || value.includes('controle')) return 'quality'

  if (value.includes('bibliotheque') || value.includes('library')) return 'library'

  if (value.includes('tutoriel') || value.includes('tutorial')) return 'tutorial'
  if (value.includes('faq') || value.includes('question') || value.includes('reponse')) return 'faq'

  if (value.includes('seance') || value.includes('session')) return 'session'
  if (value.includes('planning') || value.includes('planification')) return 'planning'
  if (value.includes('equipe') || value.includes('effectif')) return 'teams'
  if (value.includes('presence') || value.includes('absence') || value.includes('appel')) return 'attendance'
  if (value.includes('evaluation') || value.includes('joueur')) return 'evaluation'

  if (value.includes('dirigeant') || value.includes('bureau')) return 'directors'
  if (value.includes('parent')) return 'parents'

  if (value.includes('export') || value.includes('pdf')) return 'export'
  if (value.includes('parametre') || value.includes('settings')) return 'settings'
  if (value.includes('document')) return 'document'
  if (value.includes('archive')) return 'archive'
  if (value.includes('search') || value.includes('recherche')) return 'search'

  return item.color === 'green' ? 'quality' : 'club'
}

function getItemVariant(item: {
  id: string
  label: string
  path: string
  color?: string
}): 'light' | 'green' | 'blue' | 'amber' | 'purple' | 'red' {
  const value = normalizeText(`${item.id} ${item.label} ${item.path}`)

  if (value.includes('studio') || value.includes('creer') || value.includes('nouveau')) return 'green'
  if (value.includes('qualite') || value.includes('score')) return 'green'
  if (value.includes('ocr') || value.includes('import') || value.includes('piece')) return 'blue'
  if (value.includes('bibliotheque') || value.includes('document')) return 'red'
  if (value.includes('tutoriel') || value.includes('faq')) return 'blue'
  if (value.includes('seance') || value.includes('planning') || value.includes('equipe')) return 'green'
  if (value.includes('presence') || value.includes('evaluation')) return 'purple'
  if (value.includes('dirigeant') || value.includes('parent')) return 'amber'
  if (value.includes('parametre')) return 'light'

  return 'light'
}

export function Sidebar() {
  const { user, profile } = useAuth()
  const role = profile?.role
  const visibleItems = NAV_ITEMS.filter((item) => item.visible(role))
  const groupedItems = groupBySection(visibleItems)

  return (
    <aside className="sidebar" aria-label="Navigation secondaire BCVB">
      <div className="sidebar__brand">
        <img
          src="/logo_bcvb copie.png"
          alt="Logo BCVB"
          className="sidebar__logoImage"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />

        <div className="sidebar__brandText">
          <p className="sidebar__eyebrow">BCVB Référentiel</p>
          <h1 className="sidebar__title">{PRESENTATION_LABELS.appTitle}</h1>
          <p className="sidebar__subtitle">{PRESENTATION_LABELS.appSubtitle}</p>
        </div>
      </div>

      <nav className="sidebar__nav" aria-label="Sections du référentiel">
        {Object.entries(groupedItems).map(([section, items]) => (
          <div className="sidebar__section" key={section}>
            <div className="sidebar-section-heading">
              <BcvbSectionIcon
                name={getSectionIcon(section)}
                size="sm"
                variant={getSectionVariant(section)}
              />
              <span>{section}</span>
            </div>

            <div className="sidebar__sectionLinks">
              {items.map((item) => {
                const itemIcon = getItemIcon(item)
                const itemVariant = getItemVariant(item)

                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={item.path === '/'}
                    className={({ isActive }) =>
                      `${linkClass({ isActive })} sidebar__link--${item.color}`
                    }
                    title={item.description}
                    aria-label={`${item.label} — ${item.description}`}
                  >
                    <span className="sidebar__linkIcon" aria-hidden="true">
                      <BcvbSectionIcon name={itemIcon} size="sm" variant={itemVariant} />
                    </span>

                    <span className="sidebar__linkText">
                      <span className="sidebar__linkLabel">{item.label}</span>

                      {item.mainActions[0] && (
                        <small className="sidebar__linkHint">
                          {item.mainActions[0]}
                        </small>
                      )}
                    </span>

                    {item.adminOnly && (
                      <span className="sidebar__adminBadge">
                        Admin
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          </div>
        ))}

        {!user && (
          <div className="sidebar__section">
            <div className="sidebar-section-heading">
              <BcvbSectionIcon name="user" size="sm" variant="amber" />
              <span>Compte</span>
            </div>

            <div className="sidebar__sectionLinks">
              <NavLink to="/connexion" className={linkClass}>
                <span className="sidebar__linkIcon" aria-hidden="true">
                  <BcvbSectionIcon name="user" size="sm" variant="amber" />
                </span>

                <span className="sidebar__linkText">
                  <span className="sidebar__linkLabel">Connexion</span>
                  <small className="sidebar__linkHint">Accéder à votre espace</small>
                </span>
              </NavLink>

              <NavLink to="/inscription" className={linkClass}>
                <span className="sidebar__linkIcon" aria-hidden="true">
                  <BcvbSectionIcon name="club" size="sm" variant="red" />
                </span>

                <span className="sidebar__linkText">
                  <span className="sidebar__linkLabel">Inscription</span>
                  <small className="sidebar__linkHint">Créer un accès</small>
                </span>
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__footerIcon">
          <BcvbSectionIcon name="club" size="sm" variant="red" />
        </div>

        <div>
          <p className="sidebar__footerTitle">Cadre BCVB</p>
          <p className="sidebar__footerText">
            Défendre fort • Courir • Partager la balle
          </p>
        </div>
      </div>
    </aside>
  )
}