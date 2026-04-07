export default function JoueurEngagementPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Joueur</p>
          <h2 className="dashboard-page__title">Arbitrage & table</h2>
          <p className="dashboard-page__text">
            Espace pour sensibiliser les joueurs aux rôles d’arbitrage, de table,
            de chrono, de 24 secondes et d’e-marque.
          </p>
        </div>
      </div>

      <div className="dashboard-page__grid">
        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Connaissances arbitrage</h3>
          <p className="dashboard-actionCard__text">
            Bases de l’arbitrage et lecture des situations de jeu.
          </p>
        </article>

        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Table de marque</h3>
          <p className="dashboard-actionCard__text">
            Feuille, chrono, 24 secondes et e-marque pour aider le club.
          </p>
        </article>
      </div>
    </section>
  )
}