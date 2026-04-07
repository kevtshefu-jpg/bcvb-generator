export default function JoueurChartePage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Joueur</p>
          <h2 className="dashboard-page__title">Charte du club</h2>
          <p className="dashboard-page__text">
            La charte rappelle les engagements attendus d’un joueur BCVB :
            respect, investissement, attitude et esprit collectif.
          </p>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Engagement joueur</h3>
        <ul className="dashboard-list">
          <li>Respecter les coachs, partenaires, adversaires et officiels.</li>
          <li>Être ponctuel, investi et impliqué dans la vie du groupe.</li>
          <li>Adopter l’identité BCVB en séance comme en match.</li>
        </ul>
      </article>
    </section>
  )
}