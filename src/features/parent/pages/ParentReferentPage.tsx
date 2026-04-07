export default function ParentReferentPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Parent</p>
          <h2 className="dashboard-page__title">Parent référent</h2>
          <p className="dashboard-page__text">
            Le parent référent facilite la circulation des informations
            et aide le collectif à mieux s’organiser sur la saison.
          </p>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Son rôle</h3>
        <ul className="dashboard-list">
          <li>Relayer les informations pratiques.</li>
          <li>Aider à l’organisation des déplacements et tours de rôles.</li>
          <li>Créer du lien entre les familles et l’équipe.</li>
        </ul>
      </article>
    </section>
  )
}