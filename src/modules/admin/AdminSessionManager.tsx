import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { analyzeSessionQuality } from '../sessions/sessionQuality'
import { hardDeleteSession, listSessions, saveSessionDraft, updateSessionVisibility } from '../sessions/sessionStorage'
import type { SessionVisibility } from '../sessions/sessionModels'
import '../../styles/sessions.css'

export default function AdminSessionManager() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const currentUser = { id: profile?.id || '', role: profile?.role || 'member' }
  const [sessions, setSessions] = useState(() => listSessions())
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  const filteredSessions = useMemo(() => sessions.filter((session) =>
    [session.title, session.category, session.theme, session.subTheme, session.coachName, session.visibility, session.status]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  ), [search, sessions])

  function reload() {
    setSessions(listSessions())
  }

  function open(sessionId: string) {
    const session = sessions.find((item) => item.id === sessionId)
    if (!session) return
    saveSessionDraft(session)
    navigate('/coach/seances')
  }

  function updateVisibility(sessionId: string, visibility: SessionVisibility) {
    updateSessionVisibility(sessionId, visibility, currentUser)
    setMessage('Visibilité modifiée.')
    reload()
  }

  function remove(sessionId: string) {
    if (!window.confirm('Cette action est définitive. Supprimer définitivement cette séance ?')) return
    const result = hardDeleteSession(sessionId, currentUser)
    setMessage(result.message)
    reload()
  }

  return (
    <main className="session-page">
      <section className="session-hero">
        <div>
          <p className="bcvb-eyebrow">Administration</p>
          <h1>Gestion séances</h1>
          <p>Voir, corriger, classifier, publier, archiver ou supprimer les séances BCVB.</p>
        </div>
      </section>
      <section className="session-card">
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une séance..." />
      </section>
      {message && <p className="session-warning">{message}</p>}
      <section className="session-library-grid">
        {filteredSessions.map((session) => {
          const report = analyzeSessionQuality(session)
          return (
            <article className="session-library-card" key={session.id}>
              <div className="session-library-card__top">
                <span className={`session-visibility session-visibility--${session.visibility}`}>{session.visibility}</span>
                <strong>{report.score}/100</strong>
              </div>
              <h2>{session.title}</h2>
              <p>{session.category} · {session.theme} · {session.subTheme}</p>
              <div className="session-actions">
                <button type="button" onClick={() => open(session.id)}>Corriger</button>
                <button type="button" onClick={() => updateVisibility(session.id, 'private')}>Privée</button>
                <button type="button" onClick={() => updateVisibility(session.id, 'public_technicians')}>Techniciens</button>
                <button type="button" onClick={() => updateVisibility(session.id, 'club_reference')}>Référence club</button>
                <button type="button" onClick={() => updateVisibility(session.id, 'archived')}>Archiver</button>
                <button type="button" onClick={() => remove(session.id)}>Supprimer</button>
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
