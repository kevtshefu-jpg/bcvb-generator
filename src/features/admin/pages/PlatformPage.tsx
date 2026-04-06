export default function PlatformPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Administration</p>
          <h2 className="dashboard-page__title">Plateforme</h2>
          <p className="dashboard-page__text">
            Espace d’administration de la plateforme BCVB.
          </p>
        </div>
      </div>

      <div className="role-dashboard-grid">
        <article className="role-dashboard-card">
          <h3>Modules</h3>
          <p>Préparer les futurs espaces joueurs, parents, coachs et pilotage.</p>
        </article>
      </div>
    </section>
  )
}