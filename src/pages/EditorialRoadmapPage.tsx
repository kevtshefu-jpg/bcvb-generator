import { Link } from 'react-router-dom'
import { EDITORIAL_STUDIO_MODULES } from '../config/editorialStudioModules.js'
import './EditorialStudioPage.css'

function RoadmapBlock({ module }: { module: (typeof EDITORIAL_STUDIO_MODULES)[number] }) {
  return (
    <article className="editorial-module-card">
      <div>
        <p className="bcvb-eyebrow">{module.status}</p>
        <h3>{module.title}</h3>
      </div>
      <dl>
        <div><dt>Pour quoi</dt><dd>{module.forWhat}</dd></div>
        <div><dt>Pourquoi</dt><dd>{module.why}</dd></div>
        <div><dt>Pour qui</dt><dd>{module.forWhom}</dd></div>
        <div><dt>Comment</dt><dd>{module.how}</dd></div>
        <div><dt>Évolution</dt><dd>{module.evolution}</dd></div>
        <div><dt>Comment faire</dt><dd>{module.howToEvolve}</dd></div>
      </dl>
      <div className="editorial-module-card__meta">
        <span>Priorité : {module.priority}</span>
        <span>Impact : {module.impact}</span>
        <span>Complexité : {module.complexity}</span>
      </div>
    </article>
  )
}

export default function EditorialRoadmapPage() {
  return (
    <main className="editorial-studio-page bcvb-page">
      <section className="editorial-studio-hero">
        <div>
          <p className="bcvb-eyebrow">Roadmap documentaire</p>
          <h1>Architecture produit du studio</h1>
          <p>
            Cette page admin conserve les blocs de stratégie, de fonctionnement et
            d’évolution du Studio éditorial, sans polluer l’outil de production.
          </p>
        </div>
        <div className="editorial-studio-hero__actions">
          <Link to="/admin/studio-editorial">Retour studio</Link>
          <Link to="/parametres">Paramètres</Link>
        </div>
      </section>

      <section className="editorial-module-grid">
        {EDITORIAL_STUDIO_MODULES.map((module) => (
          <RoadmapBlock module={module} key={module.id} />
        ))}
      </section>
    </main>
  )
}
