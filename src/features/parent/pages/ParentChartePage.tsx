export default function ParentChartePage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Parent</p>
          <h2 className="dashboard-page__title">Charte parent</h2>
          <p className="dashboard-page__text">
            La charte parent rappelle les attitudes attendues pour accompagner
            positivement les enfants et soutenir le fonctionnement du club.
          </p>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Repères essentiels</h3>
        <ul className="dashboard-list">
          <li>Soutenir sans surcoacher.</li>
          <li>Respecter les décisions des encadrants et officiels.</li>
          <li>Contribuer à une ambiance saine et éducative.</li>
        </ul>
      </article>
    </section>
  )
}