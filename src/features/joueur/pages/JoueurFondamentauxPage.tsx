import { fundamentals, masteryLabels, type MasteryLevel } from '../data/fundamentals'

const playerCategory = 'U13'

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

export default function JoueurFondamentauxPage() {
  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Joueur</p>
          <h2 className="dashboard-page__title">Mes fondamentaux</h2>
          <p className="dashboard-page__text">
            Suis ton avancée dans la maîtrise des fondamentaux travaillés dans ta catégorie.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Catégorie</span>
          <strong>{playerCategory}</strong>
        </div>
      </div>

      <div className="dashboard-page__grid">
        {fundamentals.map((item) => {
          const level = playerMastery[item.key] ?? 0

          return (
            <article className="dashboard-actionCard" key={item.key}>
              <p className="dashboard-page__eyebrow">{item.family}</p>
              <h3 className="dashboard-actionCard__title">{item.title}</h3>
              <p className="dashboard-actionCard__text">{item.description}</p>
              <p className="dashboard-actionCard__text" style={{ marginTop: 10 }}>
                <strong>Niveau :</strong> {masteryLabels[level]}
              </p>
            </article>
          )
        })}
      </div>
    </section>
  )
}