import { Link } from 'react-router-dom'

const tools = [
  ['Mes équipes', '/coach/equipes', 'Suivre les groupes, catégories et priorités de travail.'],
  ['Mes joueurs', '/coach/joueurs', 'Garder une vue claire sur les joueurs et leurs axes de progression.'],
  ['Mes séances', '/coach/seances', 'Préparer, archiver et exporter les séances d’entraînement.'],
  ['Mes planifications', '/coach/planifications', 'Organiser les objectifs par période et par semaine.'],
  ['Présences / absences', '/coach/presences', 'Suivre l’assiduité et les motifs d’absence.'],
  ['Évaluations joueurs', '/coach/evaluations', 'Observer, noter et fixer les prochains objectifs individuels.'],
]

export default function CoachDashboardPage() {
  return (
    <main className="bcvb-page coach-tool-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Espace coach</p>
        <h1 className="bcvb-title-xl">Outils terrain</h1>
        <p className="bcvb-subtitle">
          Préparer les entraînements, suivre les joueurs et garder une trace utile du travail réalisé au gymnase.
        </p>
      </section>

      <section className="bcvb-grid-4">
        {tools.map(([title, path, text]) => (
          <Link className="bcvb-tool-card" to={path} key={path}>
            <span className="bcvb-status-pill">Coach</span>
            <h3>{title}</h3>
            <p>{text}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
