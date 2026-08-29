import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import {
  sessionCategories,
  sessionThemes,
  sessionVisibilityOptions,
  type TrainingSessionV2,
} from './sessionModels'
import { analyzeSessionQuality } from './sessionQuality'
import {
  canAccessSession,
  canDeleteSession,
  deleteSession,
  duplicateSession,
  hardDeleteSession,
  listSessions,
  saveSession,
  saveSessionDraft,
  type SessionUser,
} from './sessionStorage'
import { exportSessionToJson, exportSessionToMarkdown, printSessionPdf } from './sessionExport'
import { transformRawTextToSession } from './sessionTransformer'
import { getSessionById, listServerSessions } from './sessionService'
import {
  archiveSession,
  publishSession,
  returnSessionToDraft,
  SessionTransitionError,
  SessionWriteConflictError,
} from './sessionWriteService'
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
  if (visibility === 'team') return 'Équipe'
  if (visibility === 'club') return 'Référence club'
  if (visibility === 'public_technicians') return 'Techniciens'
  if (visibility === 'club_reference') return 'Référence BCVB'
  if (visibility === 'archived') return 'Archivée'
  return visibility
}

function statusLabel(status: string) {
  if (status === 'draft') return 'Brouillon'
  if (status === 'to_review') return 'À valider'
  if (status === 'published') return 'Publiée'
  if (status === 'archived') return 'Archivée'
  return status
}

export default function SessionLibraryPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const currentUser = buildCurrentUser(profile)
  const isAdmin = currentUser.role === 'admin'
  const canReview = isAdmin || currentUser.role === 'responsable_technique'
  const [sessions, setSessions] = useState(() => listSessions())
  const [filters, setFilters] = useState(initialFilters)
  const [message, setMessage] = useState('')
  const [serverSessions, setServerSessions] = useState<TrainingSessionV2[]>([])
  const [serverLoading, setServerLoading] = useState(true)
  const [serverError, setServerError] = useState('')
  const [mutationSessionId, setMutationSessionId] = useState<string | null>(null)
  const [publicationChoices, setPublicationChoices] = useState<Record<string, 'team' | 'club' | undefined>>({})
  const mutationLock = useRef(false)

  const loadServerSessions = useCallback(async () => {
    setServerLoading(true)
    setServerError('')
    try {
      setServerSessions(await listServerSessions())
    } catch {
      setServerError('Impossible de charger les séances sauvegardées sur BCVB.')
    } finally {
      setServerLoading(false)
    }
  }, [])

  useEffect(() => { void loadServerSessions() }, [loadServerSessions])

  const reviewSessions = useMemo(
    () => canReview ? serverSessions.filter(({ status }) => status === 'to_review') : [],
    [canReview, serverSessions],
  )

  async function verifyTransition(sessionId: string, expectedStatus: string, expectedVisibility?: 'team' | 'club') {
    const verified = await getSessionById(sessionId)
    if (verified.status !== expectedStatus || (expectedVisibility && verified.visibility !== expectedVisibility)) {
      throw new Error("L'état serveur relu ne confirme pas la transition demandée.")
    }
    await loadServerSessions()
    return verified
  }

  function transitionFailure(error: unknown) {
    if (error instanceof SessionWriteConflictError) {
      setServerError('La séance a été modifiée depuis votre dernier chargement.')
      return
    }
    setServerError(error instanceof SessionTransitionError || error instanceof Error ? error.message : 'La transition serveur a échoué.')
  }

  async function publish(serverSession: TrainingSessionV2) {
    const visibility = publicationChoices[serverSession.id]
    if (!visibility || mutationLock.current) return
    if (serverSession.version === undefined) {
      setServerError('La version serveur de cette séance est absente. Publication impossible.')
      return
    }
    const targetLabel = visibility === 'team' ? "pour l'équipe" : 'comme référence club'
    if (!window.confirm(`Publier cette séance ${targetLabel} ?`)) return
    mutationLock.current = true
    setMutationSessionId(serverSession.id)
    setServerError('')
    try {
      await publishSession({ sessionId: serverSession.id, expectedVersion: serverSession.version, visibility })
      await verifyTransition(serverSession.id, 'published', visibility)
      setMessage(`Séance publiée ${targetLabel}.`)
    } catch (error: unknown) {
      transitionFailure(error)
    } finally {
      mutationLock.current = false
      setMutationSessionId(null)
    }
  }

  async function returnToDraft(serverSession: TrainingSessionV2) {
    if (mutationLock.current || !window.confirm('Renvoyer cette séance en correction ?')) return
    if (serverSession.version === undefined) {
      setServerError('La version serveur de cette séance est absente. Retour en correction impossible.')
      return
    }
    mutationLock.current = true
    setMutationSessionId(serverSession.id)
    setServerError('')
    try {
      await returnSessionToDraft({ sessionId: serverSession.id, expectedVersion: serverSession.version })
      await verifyTransition(serverSession.id, 'draft')
      setMessage('Séance renvoyée en correction.')
    } catch (error: unknown) {
      transitionFailure(error)
    } finally {
      mutationLock.current = false
      setMutationSessionId(null)
    }
  }

  async function archiveServerSession(serverSession: TrainingSessionV2) {
    if (mutationLock.current || !window.confirm('Archiver cette séance publiée ?')) return
    if (serverSession.version === undefined) {
      setServerError('La version serveur de cette séance est absente. Archivage impossible.')
      return
    }
    mutationLock.current = true
    setMutationSessionId(serverSession.id)
    setServerError('')
    try {
      await archiveSession({ sessionId: serverSession.id, expectedVersion: serverSession.version })
      await verifyTransition(serverSession.id, 'archived')
      setMessage('Séance archivée.')
    } catch (error: unknown) {
      transitionFailure(error)
    } finally {
      mutationLock.current = false
      setMutationSessionId(null)
    }
  }

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
          <p>Consulter les séances officielles et récupérer les brouillons historiques de ce navigateur.</p>
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
      {serverError && <div className="session-warning" role="alert"><p>{serverError}</p>{serverError.includes('modifiée') && <button type="button" onClick={() => void loadServerSessions()}>Recharger la version serveur</button>}</div>}

      {canReview && (
        <section className="session-card" aria-labelledby="review-session-library-title">
          <header className="session-section-header"><div><p className="bcvb-eyebrow">Décision institutionnelle</p><h2 id="review-session-library-title">À valider ({reviewSessions.length})</h2></div></header>
          {!serverLoading && reviewSessions.length === 0 && <p>Aucune séance en attente de validation.</p>}
          <div className="session-library-grid">
            {reviewSessions.map((serverSession) => {
              const pending = mutationSessionId === serverSession.id
              return <article className="session-library-card" key={serverSession.id}>
                <div className="session-library-card__top"><span>{statusLabel(serverSession.status)}</span><strong>Version {serverSession.version}</strong></div>
                <h3>{serverSession.title || 'Non renseigné'}</h3>
                <p>{serverSession.teamLabel || 'Équipe non renseignée'} · {serverSession.category || 'Catégorie non renseignée'} · {serverSession.coachName || 'Coach non renseigné'}</p>
                <p>Modifiée le {serverSession.updatedAt ? new Date(serverSession.updatedAt).toLocaleString('fr-FR') : 'Non renseigné'}</p>
                <button type="button" onClick={() => navigate(`/coach/seances?sessionId=${encodeURIComponent(serverSession.id)}`)}>Consulter</button>
                <fieldset className="session-publication-choice" disabled={pending}>
                  <legend>Diffusion après publication</legend>
                  <label><input type="radio" name={`visibility-${serverSession.id}`} checked={publicationChoices[serverSession.id] === 'team'} onChange={() => setPublicationChoices((choices) => ({ ...choices, [serverSession.id]: 'team' }))} /> Équipe</label>
                  <label><input type="radio" name={`visibility-${serverSession.id}`} checked={publicationChoices[serverSession.id] === 'club'} onChange={() => setPublicationChoices((choices) => ({ ...choices, [serverSession.id]: 'club' }))} /> Référence club</label>
                </fieldset>
                <div className="session-actions">
                  <button type="button" disabled={pending || !publicationChoices[serverSession.id]} onClick={() => void publish(serverSession)}>{pending ? 'Traitement…' : 'Publier'}</button>
                  <button type="button" disabled={pending} onClick={() => void returnToDraft(serverSession)}>Renvoyer en correction</button>
                </div>
              </article>
            })}
          </div>
        </section>
      )}

      <section className="session-card" aria-labelledby="server-session-library-title">
        <header className="session-section-header">
          <div>
            <p className="bcvb-eyebrow">Source officielle</p>
            <h2 id="server-session-library-title">Séances sauvegardées sur BCVB</h2>
          </div>
        </header>
        {serverLoading ? <p>Chargement depuis BCVB…</p> : serverError ? null : serverSessions.length === 0 ? <p>Aucune séance serveur accessible.</p> : (
          <div className="session-library-grid">
            {serverSessions.map((serverSession) => (
              <article className="session-library-card" key={serverSession.id}>
                <div><span>{serverSession.category}</span><h3>{serverSession.title}</h3></div>
                <p>{serverSession.theme || 'Thème non renseigné'} · {statusLabel(serverSession.status)} · {visibilityLabel(serverSession.visibility)} · version {serverSession.version}</p>
                <button type="button" onClick={() => navigate(`/coach/seances?sessionId=${encodeURIComponent(serverSession.id)}`)}>Ouvrir depuis BCVB</button>
                {canReview && serverSession.status === 'published' && <button type="button" disabled={mutationSessionId === serverSession.id} onClick={() => void archiveServerSession(serverSession)}>{mutationSessionId === serverSession.id ? 'Traitement…' : 'Archiver'}</button>}
              </article>
            ))}
          </div>
        )}
      </section>

      <header className="session-section-header">
        <div><p className="bcvb-eyebrow">Récupération navigateur</p><h2>Brouillons locaux historiques</h2></div>
      </header>
      <section className="session-library-grid">
        {visibleSessions.map((session) => {
          const report = analyzeSessionQuality(session)
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
                {deletable && <button type="button" onClick={() => archive(session)}>Retirer du stockage local</button>}
                {isAdmin && <button type="button" onClick={() => hardDelete(session)}>Effacer définitivement du navigateur</button>}
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
