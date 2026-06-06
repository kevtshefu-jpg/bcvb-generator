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
    <main className="bcvb-page coach-tool-page">
      <section className="bcvb-dashboard-hero">
        <p className="bcvb-eyebrow">Pilotage club</p>
        <h1 className="bcvb-title-xl">Tableau de bord club</h1>
        <p className="bcvb-subtitle">
          Une vue simple pour piloter le projet sportif, suivre les équipes et garder une cohérence BCVB.
        </p>
      </section>

      <section className="bcvb-grid-4">
        {clubCards.map((card) => (
          <Link className="bcvb-tool-card" to={card.path} key={card.path}>
            <span className="bcvb-status-pill">Club</span>
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
