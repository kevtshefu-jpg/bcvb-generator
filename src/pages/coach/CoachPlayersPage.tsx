import { Link } from 'react-router-dom'

export default function CoachPlayersPage() {
  return (
    <main className="bcvb-page coach-tool-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Espace coach</p>
        <h1 className="bcvb-title-xl">Mes joueurs</h1>
        <p className="bcvb-subtitle">Suivre les joueurs, leurs catégories, leurs points forts et leurs axes de progression.</p>
      </section>

      <article className="bcvb-tool-card">
        <span className="bcvb-status-pill">Suivi joueur</span>
        <h3>Liste joueurs</h3>
        <p>Consulte les joueurs rattachés aux équipes auxquelles tu as accès.</p>
        <Link className="bcvb-button-primary" to="/effectifs">Consulter les effectifs</Link>
      </article>
    </main>
  )
}
