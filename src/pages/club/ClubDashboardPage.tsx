import { Link } from 'react-router-dom'

const clubCards = [
  {
    title: 'Équipes du club',
    path: '/club/equipes',
    text: 'Visualiser les catégories, les groupes, les référents et les priorités sportives.',
  },
  {
    title: 'Indicateurs sportifs',
    path: '/club/indicateurs',
    text: 'Suivre les repères clés : effectifs, assiduité, séances, progression et documents publiés.',
  },
  {
    title: 'Suivi des coachs',
    path: '/club/suivi-coachs',
    text: 'Accompagner les coachs, identifier les besoins et harmoniser les pratiques terrain.',
  },
  {
    title: 'Bibliothèque club',
    path: '/bibliotheque',
    text: 'Accéder aux cahiers techniques, guides, séances et ressources partagées.',
  },
]

export default function ClubDashboardPage() {
  return (
    <main className="bcvb-page coach-tool-page bcvb-premium-page">
      <section className="bcvb-dashboard-hero bcvb-premium-hero">
        <p className="bcvb-eyebrow bcvb-premium-hero__eyebrow">Pilotage club</p>
        <h1 className="bcvb-title-xl bcvb-premium-hero__title">Tableau de bord club</h1>
        <p className="bcvb-subtitle bcvb-premium-hero__text">
          Une vue simple pour piloter le projet sportif, suivre les équipes et garder une cohérence BCVB.
        </p>
      </section>

      <section className="bcvb-premium-card bcvb-premium-card--priority premium-pilotage-priority bcvb-card-safe">
        <div>
          <p className="bcvb-premium-card__eyebrow bcvb-tag-safe">Action commission sportive</p>
          <h2 className="bcvb-premium-card__title bcvb-text-clamp-2">Identifier les priorités de la semaine</h2>
          <p className="bcvb-premium-card__text bcvb-text-clamp-3">
            Commencer par les équipes, puis vérifier les indicateurs sportifs, les besoins coachs et les ressources à publier.
          </p>
        </div>
        <div className="bcvb-premium-actions bcvb-action-row-safe">
          <Link className="bcvb-premium-button bcvb-premium-button--primary" to="/club/equipes">Voir les équipes</Link>
          <Link className="bcvb-premium-button bcvb-premium-button--ghost" to="/club/indicateurs">Suivre les indicateurs</Link>
        </div>
      </section>

      <section className="bcvb-grid-4 bcvb-premium-grid bcvb-premium-grid--4 bcvb-grid-safe">
        {clubCards.map((card) => (
          <Link className="bcvb-tool-card bcvb-premium-card bcvb-card-safe" to={card.path} key={card.path}>
            <span className="bcvb-status-pill bcvb-premium-status bcvb-premium-status--neutral bcvb-status-safe">Club</span>
            <h3 className="bcvb-premium-card__title bcvb-text-clamp-2">{card.title}</h3>
            <p className="bcvb-premium-card__text bcvb-text-clamp-3">{card.text}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
