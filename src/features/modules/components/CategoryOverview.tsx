import { Link } from 'react-router-dom'
import type { SiteCategory } from '../../../config/siteCategories.js'

type CategoryOverviewProps = {
  category: SiteCategory
}

export function CategoryOverview({ category }: CategoryOverviewProps) {
  return (
    <main className="bcvb-page">
      <section className={`bcvb-dashboard-hero bcvb-module-hero bcvb-category-overview bcvb-category-overview--${category.color}`}>
        <div>
          <p className="bcvb-eyebrow">{category.group}</p>
          <h1 className="bcvb-title-xl">{category.label}</h1>
          <p className="bcvb-subtitle">{category.description}</p>
        </div>
        {category.adminOnly && <span className="bcvb-status-pill">Admin</span>}
      </section>

      <section className="bcvb-grid-3">
        <article className="bcvb-tool-card">
          <h2>Utilité</h2>
          <p>{category.purpose}</p>
        </article>

        <article className="bcvb-tool-card">
          <h2>Actions principales</h2>
          <ul className="bcvb-module-list">
            {category.mainActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>

        <article className="bcvb-tool-card">
          <h2>Accès</h2>
          <p>{category.adminOnly ? 'Réservé administrateur.' : `Rôles autorisés : ${category.roles.join(', ')}.`}</p>
          <Link className="bcvb-button-primary" to={category.path}>
            Ouvrir le module
          </Link>
        </article>
      </section>
    </main>
  )
}
