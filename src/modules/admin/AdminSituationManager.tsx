import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { analyzeSituationQuality } from '../sessions/situationQuality'
import { hardDeleteSituation, listSituations, saveSituationDraft, updateSituationVisibility } from '../sessions/sessionStorage'
import type { SessionVisibility } from '../sessions/sessionModels'
import '../../styles/sessions.css'

export default function AdminSituationManager() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const currentUser = { id: profile?.id || '', role: profile?.role || 'member' }
  const [situations, setSituations] = useState(() => listSituations())
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  const filteredSituations = useMemo(() => situations.filter((situation) =>
    [situation.title, situation.category, situation.theme, situation.subTheme, situation.visibility, situation.status]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  ), [search, situations])

  function reload() {
    setSituations(listSituations())
  }

  function open(situationId: string) {
    const situation = situations.find((item) => item.id === situationId)
    if (!situation) return
    saveSituationDraft(situation)
    navigate('/coach/situations/bibliotheque')
  }

  function updateVisibility(situationId: string, visibility: SessionVisibility) {
    updateSituationVisibility(situationId, visibility, currentUser)
    setMessage('Visibilité modifiée.')
    reload()
  }

  function remove(situationId: string) {
    if (!window.confirm('Cette action est définitive. Supprimer définitivement cette situation ?')) return
    const result = hardDeleteSituation(situationId, currentUser)
    setMessage(result.message)
    reload()
  }

  return (
    <main className="session-page">
      <section className="session-hero">
        <div>
          <p className="bcvb-eyebrow">Administration</p>
          <h1>Gestion situations</h1>
          <p>Voir, classifier, publier, archiver et supprimer les situations pédagogiques BCVB.</p>
        </div>
      </section>
      <section className="session-card">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une situation..." />
      </section>
      {message && <p className="session-warning">{message}</p>}
      <section className="session-library-grid">
        {filteredSituations.map((situation) => {
          const report = analyzeSituationQuality(situation)
          return (
            <article className="session-library-card" key={situation.id}>
              <div className="session-library-card__top">
                <span className={`session-visibility session-visibility--${situation.visibility}`}>{situation.visibility}</span>
                <strong>{report.score}/100</strong>
              </div>
              <h2>{situation.title}</h2>
              <p>{situation.category} · {situation.theme} · {situation.subTheme}</p>
              <div className="session-actions">
                <button type="button" onClick={() => open(situation.id)}>Ouvrir</button>
                <button type="button" onClick={() => updateVisibility(situation.id, 'private')}>Privée</button>
                <button type="button" onClick={() => updateVisibility(situation.id, 'public_technicians')}>Techniciens</button>
                <button type="button" onClick={() => updateVisibility(situation.id, 'club_reference')}>Référence club</button>
                <button type="button" onClick={() => updateVisibility(situation.id, 'archived')}>Archiver</button>
                <button type="button" onClick={() => remove(situation.id)}>Supprimer</button>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
