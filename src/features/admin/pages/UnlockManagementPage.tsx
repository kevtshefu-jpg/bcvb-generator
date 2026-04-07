import { useMemo, useState } from 'react'
import { useAuth } from '../../auth/context/AuthContext'
import { playerContents } from '../../joueur/data/playerContents'
import { usePlayerProfiles } from '../../joueur/hooks/usePlayerProfiles'
import { usePlayerUnlocks } from '../../joueur/hooks/usePlayerUnlocks'

export default function UnlockManagementPage() {
  const { user } = useAuth()
  const { players, loading: playersLoading, error: playersError } = usePlayerProfiles()
  const [selectedPlayerId, setSelectedPlayerId] = useState('')

  const selectedPlayer = useMemo(
    () => players.find((player) => player.id === selectedPlayerId),
    [players, selectedPlayerId]
  )

  const { unlockedIds, loading, error, toggle } = usePlayerUnlocks(selectedPlayerId || undefined, user?.id)

  const relevantContents = useMemo(() => {
    if (!selectedPlayer?.category_id) return []

    return playerContents.filter(
      (content) =>
        content.categoryIds.includes(selectedPlayer.category_id as string) ||
        content.unlockedByCoachOnly
    )
  }, [selectedPlayer])

  return (
    <section className="dashboard-page">
      <div className="dashboard-page__hero">
        <div>
          <p className="dashboard-page__eyebrow">Administration</p>
          <h2 className="dashboard-page__title">Déblocage contenus joueur</h2>
          <p className="dashboard-page__text">
            Débloquer ou rebloquer des contenus spécifiques pour un joueur réel du club,
            selon sa catégorie et la progression décidée par le staff.
          </p>
        </div>

        <div className="dashboard-page__badge">
          <span className="dashboard-page__badgeLabel">Mode</span>
          <strong>Profils réels Supabase</strong>
        </div>
      </div>

      <article className="dashboard-panelCard">
        <h3 className="dashboard-panelCard__title">Choisir un joueur</h3>

        {playersLoading && <p>Chargement des profils joueurs...</p>}
        {playersError && <p>{playersError}</p>}

        {!playersLoading && !playersError && (
          <div style={{ marginTop: 12 }}>
            <select
              className="bcvb-input"
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
            >
              <option value="">Sélectionner un joueur</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.full_name || player.email || player.id}
                  {player.category_id ? ` — ${player.category_id}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </article>

      {selectedPlayer && (
        <>
          {loading && <p>Chargement des déblocages...</p>}
          {error && <p>{error}</p>}

          <div className="dashboard-page__grid">
            <article className="dashboard-actionCard">
              <h3 className="dashboard-actionCard__title">Joueur sélectionné</h3>
              <p className="dashboard-actionCard__text">
                {selectedPlayer.full_name || selectedPlayer.email || selectedPlayer.id}
              </p>
              <p className="dashboard-actionCard__text">
                Catégorie : {selectedPlayer.category_id || 'Non renseignée'}
              </p>
            </article>

            <article className="dashboard-actionCard">
              <h3 className="dashboard-actionCard__title">Contenus débloqués</h3>
              <p className="dashboard-actionCard__text">
                {unlockedIds.length > 0 ? unlockedIds.length : 'Aucun'} contenu spécifique débloqué.
              </p>
            </article>
          </div>

          <div className="dashboard-page__grid">
            {relevantContents.map((content) => {
              const isUnlocked = unlockedIds.includes(content.id)

              return (
                <article className="dashboard-actionCard" key={content.id}>
                  <p className="dashboard-page__eyebrow">{content.theme}</p>
                  <h3 className="dashboard-actionCard__title">{content.title}</h3>
                  <p className="dashboard-actionCard__text">{content.description}</p>
                  <p className="dashboard-actionCard__text" style={{ marginTop: 10 }}>
                    <strong>Statut :</strong> {isUnlocked ? 'Débloqué' : 'Verrouillé'}
                  </p>

                  <div style={{ marginTop: 14 }}>
                    <button className="topbar__logout" onClick={() => toggle(content.id)}>
                      {isUnlocked ? 'Rebloquer' : 'Débloquer'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}