import { Link, useLocation } from 'react-router-dom'
import { resolveStudioCategory } from '../../features/studio-ux/services/studioExperience'

const hashLabels: Record<string, string> = {
  '#source': 'Source',
  '#structure': 'Structure',
  '#apercu': 'Aperçu',
  '#qualite': 'Qualité',
  '#correction': 'Correction',
  '#export': 'Export',
  '#versions': 'Versions',
  '#historique': 'Historique',
}

function documentLabel(pathname: string) {
  const match = /^\/(?:documents|library)\/([^/]+)/.exec(pathname)
  if (!match) return null

  return decodeURIComponent(match[1])
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export function Breadcrumbs({ role }: { role?: string | null }) {
  const location = useLocation()
  const category = resolveStudioCategory(location.pathname, role)
  const docLabel = documentLabel(location.pathname)
  const hashLabel = hashLabels[location.hash]

  const crumbs = [
    { label: 'Accueil', to: '/dashboard' },
    category && category.group !== 'Tableau de bord' ? { label: category.group } : null,
    category && category.id !== 'dashboard' ? { label: category.label, to: category.path } : null,
    docLabel ? { label: docLabel } : null,
    hashLabel ? { label: hashLabel } : null,
  ].filter((crumb): crumb is { label: string; to?: string } => Boolean(crumb))

  if (crumbs.length <= 1) return null

  return (
    <nav className="breadcrumbs" aria-label="Fil d'Ariane">
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1

        return (
          <span className="breadcrumbs__item" key={`${crumb.label}-${index}`}>
            {crumb.to && !isLast ? <Link to={crumb.to}>{crumb.label}</Link> : <span>{crumb.label}</span>}
          </span>
        )
      })}
    </nav>
  )
}
