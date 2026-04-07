export default function ParentRolesPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Parent</p>
          <h2 className="dashboard-page__title">Tours de rôles</h2>
          <p className="dashboard-page__text">
            Comprendre les désignations, les besoins du week-end et l’importance
            de la participation de chacun au bon fonctionnement des rencontres.
          </p>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Rôles à connaître</h3>
        <ul className="dashboard-list">
          <li>Table de marque</li>
          <li>Chronomètre</li>
          <li>24 secondes</li>
          <li>e-marque selon niveau de pratique</li>
        </ul>
      </article>
    </section>
  )
}