export default function JoueurContenusPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Joueur</p>
          <h2 className="dashboard-page__title">Mes contenus</h2>
          <p className="dashboard-page__text">
            Retrouve ici les contenus de ta catégorie, débloqués par ton coach,
            pour progresser avec les repères du BCVB.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Formation</span>
          <strong>Catégorie joueur</strong>
        </div>
      </div>

      <div className="dashboard-page__grid">
        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Contenus de catégorie</h3>
          <p className="dashboard-actionCard__text">
            Situations, priorités, thèmes de jeu et repères adaptés à ton niveau.
          </p>
        </article>

        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Repères BCVB</h3>
          <p className="dashboard-actionCard__text">
            Défendre fort, courir et partager la balle dans chaque séance et chaque match.
          </p>
        </article>
      </div>
    </section>
  )
}