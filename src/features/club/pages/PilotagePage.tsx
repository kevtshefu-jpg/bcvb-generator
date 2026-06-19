export default function PilotagePage() {
  return (
    <section className="dashboard-page bcvb-premium-page">
      <div className="dashboard-page__hero bcvb-premium-hero">
        <div>
          <p className="dashboard-page__eyebrow bcvb-premium-hero__eyebrow">Pilotage</p>
          <h2 className="dashboard-page__title bcvb-premium-hero__title">Pilotage BCVB</h2>
          <p className="dashboard-page__text bcvb-premium-hero__text">
            Espace de pilotage du club.
          </p>
        </div>
      </div>

      <article className="bcvb-premium-card bcvb-premium-card--priority premium-pilotage-priority bcvb-card-safe">
        <div>
          <p className="bcvb-premium-card__eyebrow bcvb-tag-safe">Priorité pilotage</p>
          <h3 className="bcvb-premium-card__title bcvb-text-clamp-2">Aligner les équipes, les séances et les documents club</h3>
          <p className="bcvb-premium-card__text bcvb-text-clamp-3">
            Une commission sportive doit voir rapidement les points prêts, les sujets à arbitrer et les actions à suivre.
          </p>
        </div>
        <div className="bcvb-premium-actions bcvb-action-row-safe">
          <span className="bcvb-premium-status bcvb-premium-status--progress bcvb-status-safe">Vue synthétique</span>
          <span className="bcvb-premium-status bcvb-premium-status--warning bcvb-status-safe">À compléter avec données live</span>
        </div>
      </article>

      <div className="role-dashboard-grid bcvb-premium-grid bcvb-premium-grid--3 bcvb-grid-safe">
        <article className="role-dashboard-card bcvb-premium-card bcvb-card-safe">
          <p className="bcvb-premium-card__eyebrow bcvb-tag-safe">Organisation</p>
          <h3 className="bcvb-premium-card__title bcvb-text-clamp-2">Suivi club</h3>
          <p className="bcvb-text-clamp-3">Centraliser les priorités d’organisation et de pilotage.</p>
        </article>
        <article className="role-dashboard-card bcvb-premium-card bcvb-card-safe">
          <p className="bcvb-premium-card__eyebrow bcvb-tag-safe">Sportif</p>
          <h3 className="bcvb-premium-card__title bcvb-text-clamp-2">Équipes actives</h3>
          <p className="bcvb-text-clamp-3">Mettre en évidence les groupes suivis, les besoins coachs et les points de vigilance terrain.</p>
        </article>
        <article className="role-dashboard-card bcvb-premium-card bcvb-card-safe">
          <p className="bcvb-premium-card__eyebrow bcvb-tag-safe">Documents</p>
          <h3 className="bcvb-premium-card__title bcvb-text-clamp-2">Ressources prêtes</h3>
          <p className="bcvb-text-clamp-3">Repérer les documents publiables, à relire ou à transformer pour la saison.</p>
        </article>
      </div>
    </section>
  )
}
