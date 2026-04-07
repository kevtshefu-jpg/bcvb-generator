export default function ParentVieClubPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Parent</p>
          <h2 className="dashboard-page__title">Vie associative</h2>
          <p className="dashboard-page__text">
            Découvre le fonctionnement du BCVB, ses valeurs, son organisation
            et la manière dont chaque famille peut participer à la vie du club.
          </p>
        </div>
      </div>

      <div className="dashboard-page__grid">
        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Valeurs du club</h3>
          <p className="dashboard-actionCard__text">
            Intensité, agressivité, maîtrise et jeu, au service d’une identité forte.
          </p>
        </article>

        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Fonctionnement</h3>
          <p className="dashboard-actionCard__text">
            Organisation interne, accompagnement des équipes et rôle des familles.
          </p>
        </article>
      </div>
    </section>
  )
}