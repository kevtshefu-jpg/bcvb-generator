import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import {
  sessionCategories,
  sessionThemes,
  sessionVisibilityOptions,
  type SessionVisibility,
  type TrainingSessionV2,
} from './sessionModels'
import { analyzeSessionQuality } from './sessionQuality'
import {
  canAccessSession,
  canDeleteSession,
  canEditSession,
  deleteSession,
  duplicateSession,
  hardDeleteSession,
  listSessions,
  publishSession,
  saveSession,
  saveSessionDraft,
  updateSessionVisibility,
  type SessionUser,
} from './sessionStorage'
import { exportSessionToJson, exportSessionToMarkdown, printSessionPdf } from './sessionExport'
import { transformRawTextToSession } from './sessionTransformer'
import '../../styles/sessions.css'
import '../../styles/courts.css'

type SessionFilterState = {
  search: string
  category: string
  theme: string
  status: string
  visibility: string
  tag: string
  minQuality: string
  includeArchived: boolean
}

const initialFilters: SessionFilterState = {
  search: '',
  category: '',
  theme: '',
  status: '',
  visibility: '',
  tag: '',
  minQuality: '',
  includeArchived: false,
}

function buildCurrentUser(profile: ReturnType<typeof useAuth>['profile']): SessionUser {
  return { id: profile?.id || '', role: profile?.role || 'member' }
}

function getSessionSearchText(session: TrainingSessionV2) {
  return [
    session.title,
    session.summary,
    session.category,
    session.theme,
    session.subTheme,
    session.coachName,
    session.status,
    session.visibility,
    ...session.tags,
    ...session.objectives,
    ...session.bcvbObjectives,
    ...session.situations.flatMap((situation) => [
      situation.title,
      situation.objective,
      situation.description,
      situation.instructions,
      ...situation.observableCriteria,
      ...situation.measurableCriteria,
    ]),
  ].join(' ').toLowerCase()
}

function visibilityLabel(visibility: string) {
  if (visibility === 'private') return 'Privée'
  if (visibility === 'public_technicians') return 'Techniciens'
  if (visibility === 'club_reference') return 'Référence BCVB'
  if (visibility === 'archived') return 'Archivée'
  return visibility
}

export default function SessionLibraryPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const currentUser = buildCurrentUser(profile)
  const isAdmin = currentUser.role === 'admin'
  const [sessions, setSessions] = useState(() => listSessions())
  const [filters, setFilters] = useState(initialFilters)
  const [message, setMessage] = useState('')

  const visibleSessions = useMemo(() => sessions
    .filter((session) => canAccessSession(session, currentUser))
    .filter((session) => filters.includeArchived || session.visibility !== 'archived')
    .filter((session) => !filters.category || session.category === filters.category)
    .filter((session) => !filters.theme || session.theme === filters.theme)
    .filter((session) => !filters.status || session.status === filters.status)
    .filter((session) => !filters.visibility || session.visibility === filters.visibility)
    .filter((session) => !filters.tag || session.tags.some((tag) => tag.toLowerCase().includes(filters.tag.toLowerCase())))
    .filter((session) => {
      if (!filters.minQuality) return true
      return analyzeSessionQuality(session).score >= Number(filters.minQuality)
    })
    .filter((session) => !filters.search || getSessionSearchText(session).includes(filters.search.toLowerCase()))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')), [currentUser.id, currentUser.role, filters, sessions])

  const stats = useMemo(() => {
    const scores = visibleSessions.map((session) => analyzeSessionQuality(session))
    return {
      total: visibleSessions.length,
      publishable: scores.filter((report) => report.score >= 82).length,
      toFix: scores.filter((report) => report.score < 70).length,
      references: visibleSessions.filter((session) => session.visibility === 'club_reference').length,
      privateCount: visibleSessions.filter((session) => session.visibility === 'private').length,
      archived: visibleSessions.filter((session) => session.visibility === 'archived').length,
    }
  }, [visibleSessions])

  function reload() {
    setSessions(listSessions())
  }

  function openSession(session: TrainingSessionV2) {
    saveSessionDraft(session)
    navigate('/coach/seances')
  }

  function duplicateAndOpen(session: TrainingSessionV2) {
    const nextSession = saveSession({
      ...duplicateSession(session),
      ownerId: currentUser.id || session.ownerId,
      createdBy: currentUser.id || session.createdBy,
      visibility: 'private',
      status: 'draft',
    })
    setMessage('Séance dupliquée dans ton espace privé.')
    setSessions([nextSession, ...listSessions().filter((item) => item.id !== nextSession.id)])
    saveSessionDraft(nextSession)
    navigate('/coach/seances')
  }

  function transformSession(session: TrainingSessionV2) {
    const source = session.sourceExtractedText || session.sourceRawText || JSON.stringify(session, null, 2)
    const nextSession = saveSession({
      ...transformRawTextToSession(source, {
        category: session.category,
        theme: session.theme,
        subTheme: session.subTheme,
        coachName: profile?.full_name || session.coachName,
        teamLabel: session.teamLabel,
        sourceFileName: session.sourceFileName || session.title,
      }),
      ownerId: currentUser.id || session.ownerId,
      createdBy: currentUser.id || session.createdBy,
      sourceRawText: source,
      sourceExtractedText: source,
      visibility: 'private',
    })
    saveSessionDraft(nextSession)
    navigate('/coach/seances')
  }

  function publish(session: TrainingSessionV2) {
    const updated = publishSession(session.id, currentUser)
    setMessage(updated?.status === 'to_review' ? 'Séance proposée en publication.' : 'Séance publiée comme référence BCVB.')
    reload()
  }

  function updateVisibility(session: TrainingSessionV2, visibility: SessionVisibility) {
    const updated = updateSessionVisibility(session.id, visibility, currentUser)
    setMessage(updated ? 'Visibilité mise à jour.' : 'Visibilité non modifiée.')
    reload()
  }

  function archive(session: TrainingSessionV2) {
    if (!window.confirm('Cette action est définitive. Archiver cette séance ?')) return
    const result = deleteSession(session.id, currentUser)
    setMessage(result.message)
    reload()
  }

  function hardDelete(session: TrainingSessionV2) {
    if (!window.confirm('Cette action est définitive. Supprimer définitivement cette séance ?')) return
    const result = hardDeleteSession(session.id, currentUser)
    setMessage(result.message)
    reload()
  }

  return (
    <main className="session-page">
      <section className="session-hero">
        <div>
          <p className="bcvb-eyebrow">Studio séance BCVB</p>
          <h1>Bibliothèque de séances</h1>
          <p>Classer, rechercher, modifier, dupliquer, publier et exporter les séances terrain BCVB.</p>
        </div>
        <div className="session-actions">
          <button type="button" onClick={() => navigate('/coach/seances')}>Créer une séance</button>
          <button type="button" onClick={() => setFilters(initialFilters)}>Réinitialiser filtres</button>
        </div>
      </section>

      <section className="session-stats-grid">
        <article><span>Total visible</span><strong>{stats.total}</strong></article>
        <article><span>Publiables</span><strong>{stats.publishable}</strong></article>
        <article><span>À corriger</span><strong>{stats.toFix}</strong></article>
        <article><span>Références</span><strong>{stats.references}</strong></article>
        <article><span>Privées</span><strong>{stats.privateCount}</strong></article>
        <article><span>Archivées</span><strong>{stats.archived}</strong></article>
      </section>

      <section className="session-card session-library-filters">
        <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Rechercher titre, thème, contenu, tags, coach..." />
        <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Toutes catégories</option>
          {sessionCategories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <select value={filters.theme} onChange={(event) => setFilters({ ...filters, theme: event.target.value })}>
          <option value="">Tous thèmes</option>
          {sessionThemes.map((theme) => <option key={theme} value={theme}>{theme}</option>)}
        </select>
        <select value={filters.visibility} onChange={(event) => setFilters({ ...filters, visibility: event.target.value })}>
          <option value="">Toutes visibilités</option>
          {sessionVisibilityOptions.map((visibility) => <option key={visibility} value={visibility}>{visibilityLabel(visibility)}</option>)}
        </select>
        <input value={filters.tag} onChange={(event) => setFilters({ ...filters, tag: event.target.value })} placeholder="Tag" />
        <input type="number" min="0" max="100" value={filters.minQuality} onChange={(event) => setFilters({ ...filters, minQuality: event.target.value })} placeholder="Score min" />
        <label className="session-checkbox"><input type="checkbox" checked={filters.includeArchived} onChange={(event) => setFilters({ ...filters, includeArchived: event.target.checked })} /> Archives</label>
      </section>

      {message && <p className="session-warning">{message}</p>}

      <section className="session-library-grid">
        {visibleSessions.map((session) => {
          const report = analyzeSessionQuality(session)
          const editable = canEditSession(session, currentUser)
          const deletable = canDeleteSession(session, currentUser)
          return (
            <article className="session-library-card" key={session.id}>
              <div className="session-library-card__top">
                <span className={`session-visibility session-visibility--${session.visibility}`}>{visibilityLabel(session.visibility)}</span>
                <strong>{report.score}/100</strong>
              </div>
              <h2>{session.title}</h2>
              <p>{session.summary || session.globalOrganization || 'Séance BCVB prête à classer et enrichir.'}</p>
              <div className="session-card-meta">
                <span>{session.category}</span>
                <span>{session.theme || 'Thème à classer'}</span>
                <span>{session.subTheme || 'Sous-thème à classer'}</span>
                <span>{session.durationMinutes} min</span>
                <span>{session.coachName || 'Coach non renseigné'}</span>
              </div>
              <div className="session-tags">
                {session.tags.slice(0, 6).map((tag) => <span className="session-tag-pill" key={tag}>{tag}</span>)}
              </div>
              <p className="session-card-date">Modifiée le {session.updatedAt ? new Date(session.updatedAt).toLocaleDateString('fr-FR') : 'non renseigné'}</p>
              <div className="session-actions">
                <button type="button" onClick={() => openSession(session)}>Ouvrir</button>
                <button type="button" onClick={() => duplicateAndOpen(session)}>Dupliquer</button>
                <button type="button" onClick={() => transformSession(session)}>Transformer</button>
                <button type="button" onClick={() => exportSessionToJson(session)}>JSON</button>
                <button type="button" onClick={() => exportSessionToMarkdown(session)}>Markdown</button>
                <button type="button" onClick={printSessionPdf}>PDF</button>
                {editable && <button type="button" onClick={() => publish(session)}>Publier</button>}
                {editable && <button type="button" onClick={() => updateVisibility(session, 'private')}>Rendre privée</button>}
                {isAdmin && (
                  <select value={session.visibility} onChange={(event) => updateVisibility(session, event.target.value as SessionVisibility)}>
                    {sessionVisibilityOptions.map((visibility) => <option key={visibility} value={visibility}>{visibilityLabel(visibility)}</option>)}
                  </select>
                )}
                {deletable && <button type="button" onClick={() => archive(session)}>Supprimer</button>}
                {isAdmin && <button type="button" onClick={() => hardDelete(session)}>Supprimer définitivement</button>}
              </div>
            </article>
          )
        })}
        {visibleSessions.length === 0 && (
          <article className="session-card">
            <h2>Aucune séance visible</h2>
            <p>Crée ou importe une séance depuis le Studio Séance BCVB, puis enregistre-la dans la bibliothèque.</p>
            <button type="button" onClick={() => navigate('/coach/seances')}>Ouvrir le studio</button>
          </article>
        )}
      </section>
    </main>
  )
}
