export default function ParentProjetClubPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Parent</p>
          <h2 className="dashboard-page__title">Projet sportif et éducatif</h2>
          <p className="dashboard-page__text">
            Une présentation claire du projet BCVB : former, responsabiliser
            et construire une identité commune du mini-basket aux seniors.
          </p>
        </div>
      </div>

      <div className="dashboard-page__grid">
        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Projet sportif</h3>
          <p className="dashboard-actionCard__text">
            Défendre fort, courir et partager la balle comme cadre commun club.
          </p>
        </article>

        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Projet éducatif</h3>
          <p className="dashboard-actionCard__text">
            Responsabilité, autonomie, respect et progression à travers le basket.
          </p>
        </article>
      </div>
    </section>
  )
}