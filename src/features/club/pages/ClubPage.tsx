export default function ClubPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Club</p>
          <h2 className="dashboard-page__title">Projet club BCVB</h2>
          <p className="dashboard-page__text">
            Vision, identité, principes de jeu, cadre éducatif et structuration sportive du BCVB.
          </p>
        </div>
      </div>

      <div className="role-dashboard-grid">
        <article className="role-dashboard-card">
          <h3>Identité BCVB</h3>
          <p>Défendre fort • Courir • Partager la balle.</p>
        </article>

        <article className="role-dashboard-card">
          <h3>Démarche pédagogique</h3>
          <p>Je découvre • Je m’exerce • Je retranscris • Je régule.</p>
        </article>

        <article className="role-dashboard-card">
          <h3>Projet sportif</h3>
          <p>Structurer la progression des joueurs, coachs et familles dans un cadre commun.</p>
        </article>
      </div>
    </section>
  )
}
