import { fundamentals, masteryLabels, type MasteryLevel } from '../data/fundamentals'

const playerMastery: Record<string, MasteryLevel> = {
  dribble_main_forte: 3,
  dribble_main_faible: 2,
  passe: 3,
  tir_proche: 3,
  tir_loin: 1,
  finition: 2,
  appuis: 2,
  un_contre_un_offensif: 2,
  un_contre_un_defensif: 2,
  lecture_du_jeu: 1,
  rebond: 2,
}

function computeGlobalLevel() {
  const values = fundamentals.map((item) => Number(playerMastery[item.key] ?? 0))
  const total = values.reduce((sum: number, value: number) => sum + value, 0)
  return (total / values.length).toFixed(1)
}

export default function JoueurProgressionPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Joueur</p>
          <h2 className="dashboard-page__title">Ma progression</h2>
          <p className="dashboard-page__text">
            Visualise ton avancée actuelle, les axes déjà travaillés et les priorités suivantes.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Progression globale</span>
          <strong>{computeGlobalLevel()} / 4</strong>
        </div>
      </div>

      <div className="dashboard-page__grid">
        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Points forts actuels</h3>
          <p className="dashboard-actionCard__text">
            Dribble main forte, passe, tir proche : les bases avancent bien dans la catégorie.
          </p>
        </article>

        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Axe prioritaire</h3>
          <p className="dashboard-actionCard__text">
            Développer la lecture du jeu et la maîtrise du tir loin.
          </p>
        </article>

        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Repère BCVB</h3>
          <p className="dashboard-actionCard__text">
            Je découvre, je m’exerce, je retranscris en match, je régule.
          </p>
        </article>

        <article className="dashboard-actionCard">
          <h3 className="dashboard-actionCard__title">Niveau actuel</h3>
          <p className="dashboard-actionCard__text">
            La majorité des fondamentaux est entre “En cours” et “Maîtrisé en séance”.
          </p>
        </article>
      </div>

      <div className="dashboard-page__grid">
        {fundamentals.map((item) => {
          const level = playerMastery[item.key] ?? 0

          return (
            <article className="dashboard-actionCard" key={item.key}>
              <h3 className="dashboard-actionCard__title">{item.title}</h3>
              <p className="dashboard-actionCard__text">{masteryLabels[level]}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}