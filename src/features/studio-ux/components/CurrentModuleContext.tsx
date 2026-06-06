import { Link, useLocation } from 'react-router-dom'
import { resolveStudioCategory } from '../services/studioExperience'
import '../styles/studioExperience.css'

type CurrentModuleContextProps = {
  role?: string | null
}

export default function CurrentModuleContext({ role }: CurrentModuleContextProps) {
  const location = useLocation()
  const category = resolveStudioCategory(location.pathname, role)

  if (!category) return null

  return (
    <div className="current-module-context" aria-label="Contexte du module courant">
      <div>
        <span>{category.group}</span>
        <strong>{category.label}</strong>
        <p>{category.purpose}</p>
      </div>
      <div className="current-module-context__actions">
        {category.mainActions.slice(0, 3).map((action) => (
          <em key={action}>{action}</em>
        ))}
        {category.adminOnly && <em className="current-module-context__admin">Admin</em>}
        <Link to={category.path}>Ouvrir</Link>
      </div>
    </div>
  )
}
