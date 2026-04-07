import { playerContents } from '../data/playerContents'
import { canPlayerSeeContent } from '../utils/access'

const playerCategory = 'U13'
const unlockedContentIds = ['u13-1c1-contact-1']

export default function JoueurContenusPage() {
  const visibleContents = playerContents.filter((item) =>
    canPlayerSeeContent(playerCategory, unlockedContentIds, item)
  )

  const lockedContents = playerContents.filter(
    (item) => !canPlayerSeeContent(playerCategory, unlockedContentIds, item)
  )

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Joueur</p>
          <h2 className="dashboard-page__title">Mes contenus</h2>
          <p className="dashboard-page__text">
            Retrouve ici les contenus accessibles selon ta catégorie et les déblocages faits par ton coach.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Catégorie active</span>
          <strong>{playerCategory}</strong>
        </div>
      </div>

      <div className="dashboard-page__grid">
        {visibleContents.map((item) => (
          <article className="dashboard-actionCard" key={item.id}>
            <p className="dashboard-page__eyebrow">{item.theme}</p>
            <h3 className="dashboard-actionCard__title">{item.title}</h3>
            <p className="dashboard-actionCard__text">{item.description}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-panelCard">
        <p className="dashboard-page__eyebrow">Contenus verrouillés</p>
        <h3 className="dashboard-panelCard__title">À débloquer plus tard</h3>
        <ul className="dashboard-list">
          {lockedContents.map((item) => (
            <li key={item.id}>
              {item.title} — {item.theme}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}