import { useAuth } from '../../auth/context/AuthContext'
import { playerContents } from '../data/playerContents'
import { canPlayerSeeContent } from '../utils/access'
import { usePlayerUnlocks } from '../hooks/usePlayerUnlocks'

export default function JoueurContenusPage() {
  const { profile } = useAuth()

  const playerId = profile?.id
  const categoryId = profile?.category_id || ''

  const { unlockedIds, loading, error } = usePlayerUnlocks(playerId)

  const visibleContents = playerContents.filter((item) =>
    canPlayerSeeContent(categoryId, unlockedIds, item)
  )

  const lockedContents = playerContents.filter(
    (item) => !canPlayerSeeContent(categoryId, unlockedIds, item)
  )

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Joueur</p>
          <h2 className="dashboard-page__title">Mes contenus</h2>
          <p className="dashboard-page__text">
            Retrouve ici les contenus accessibles selon ta catégorie réelle et les déblocages faits
            par ton coach.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Catégorie active</span>
          <strong>{categoryId || 'Non renseignée'}</strong>
        </div>
      </div>

      {loading && <p>Chargement des contenus...</p>}
      {error && <p>{error}</p>}

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