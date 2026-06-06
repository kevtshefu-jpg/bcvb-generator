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
        <p>Aucun joueur rattaché pour le moment. Ajoute tes joueurs ou importe une liste depuis l’administration.</p>
        <button className="bcvb-button-primary" type="button">Ajouter un joueur</button>
      </article>
    </main>
  )
}
