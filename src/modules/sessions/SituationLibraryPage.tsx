import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { sessionCategories, sessionSubThemes, sessionThemes, sessionVisibilityOptions, type SessionSituation, type SessionVisibility } from './sessionModels'
import { analyzeSituationQuality } from './situationQuality'
import {
  canAccessSituation,
  canEditSituation,
  deleteSituation,
  duplicateLibrarySituation,
  hardDeleteSituation,
  listSituations,
  saveSessionDraft,
  saveSituationDraft,
  updateSituationVisibility,
  type SessionUser,
} from './sessionStorage'
import { exportSituationToMarkdown, printSessionPdf } from './sessionExport'
import { createSession } from './sessionModels'
import '../../styles/sessions.css'
import '../../styles/courts.css'

function currentUserFromProfile(profile: ReturnType<typeof useAuth>['profile']): SessionUser {
  return { id: profile?.id || '', role: profile?.role || 'member' }
}

function visibilityLabel(visibility: string) {
  if (visibility === 'private') return 'Privée'
  if (visibility === 'public_technicians') return 'Techniciens'
  if (visibility === 'club_reference') return 'Référence BCVB'
  if (visibility === 'archived') return 'Archivée'
  return visibility
}

function searchableText(situation: SessionSituation) {
  return [
    situation.title,
    situation.category,
    situation.theme,
    situation.subTheme,
    situation.playerCount,
    situation.space,
    situation.level,
    ...situation.equipment,
    situation.objective,
    situation.organization,
    situation.description,
    situation.instructions,
    ...situation.observableCriteria,
    ...situation.measurableCriteria,
  ].join(' ').toLowerCase()
}

export default function SituationLibraryPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const currentUser = currentUserFromProfile(profile)
  const isAdmin = currentUser.role === 'admin'
  const [situations, setSituations] = useState(() => listSituations())
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    theme: '',
    subTheme: '',
    visibility: '',
    minQuality: '',
    includeArchived: false,
  })
  const [message, setMessage] = useState('')

  const visibleSituations = useMemo(() => situations
    .filter((situation) => canAccessSituation(situation, currentUser))
    .filter((situation) => filters.includeArchived || situation.visibility !== 'archived')
    .filter((situation) => !filters.category || situation.category === filters.category)
    .filter((situation) => !filters.theme || situation.theme === filters.theme)
    .filter((situation) => !filters.subTheme || situation.subTheme === filters.subTheme)
    .filter((situation) => !filters.visibility || situation.visibility === filters.visibility)
    .filter((situation) => !filters.minQuality || analyzeSituationQuality(situation).score >= Number(filters.minQuality))
    .filter((situation) => !filters.search || searchableText(situation).includes(filters.search.toLowerCase())), [currentUser.id, currentUser.role, filters, situations])

  const stats = useMemo(() => {
    const scores = visibleSituations.map(analyzeSituationQuality)
    return {
      total: visibleSituations.length,
      references: visibleSituations.filter((situation) => situation.visibility === 'club_reference').length,
      ready: scores.filter((report) => report.score >= 72).length,
      toFix: scores.filter((report) => report.score < 72).length,
    }
  }, [visibleSituations])

  function reload() {
    setSituations(listSituations())
  }

  function openSituation(situation: SessionSituation) {
    saveSituationDraft(situation)
    saveSessionDraft(createSession({
      title: `Séance depuis ${situation.title}`,
      category: (situation.category || 'U13') as ReturnType<typeof createSession>['category'],
      theme: situation.theme,
      subTheme: situation.subTheme,
      situations: [{ ...situation, order: 1 }],
      ownerId: currentUser.id || situation.ownerId,
      createdBy: currentUser.id || situation.createdBy,
    }))
    navigate('/coach/seances')
  }

  function duplicate(situation: SessionSituation) {
    duplicateLibrarySituation(situation, currentUser)
    setMessage('Situation dupliquée dans ton espace privé.')
    reload()
  }

  function updateVisibility(situation: SessionSituation, visibility: SessionVisibility) {
    updateSituationVisibility(situation.id, visibility, currentUser)
    setMessage('Visibilité mise à jour.')
    reload()
  }

  function archive(situation: SessionSituation) {
    if (!window.confirm('Cette action est définitive. Archiver cette situation ?')) return
    const result = deleteSituation(situation.id, currentUser)
    setMessage(result.message)
    reload()
  }

  function hardDelete(situation: SessionSituation) {
    if (!window.confirm('Cette action est définitive. Supprimer définitivement cette situation ?')) return
    const result = hardDeleteSituation(situation.id, currentUser)
    setMessage(result.message)
    reload()
  }

  return (
    <main className="session-page">
      <section className="session-hero">
        <div>
          <p className="bcvb-eyebrow">Studio séance BCVB</p>
          <h1>Bibliothèque situations</h1>
          <p>Retrouver, filtrer, dupliquer, publier et exporter les situations pédagogiques individuelles.</p>
        </div>
        <div className="session-actions">
          <button type="button" onClick={() => navigate('/coach/seances')}>Ajouter à une séance</button>
          <button type="button" onClick={() => setFilters({ search: '', category: '', theme: '', subTheme: '', visibility: '', minQuality: '', includeArchived: false })}>Réinitialiser filtres</button>
        </div>
      </section>

      <section className="session-stats-grid">
        <article><span>Total visible</span><strong>{stats.total}</strong></article>
        <article><span>Références</span><strong>{stats.references}</strong></article>
        <article><span>Coach-ready</span><strong>{stats.ready}</strong></article>
        <article><span>À corriger</span><strong>{stats.toFix}</strong></article>
      </section>

      <section className="session-card session-library-filters">
        <input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Rechercher titre, thème, matériel, critères..." />
        <select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">Catégories</option>{sessionCategories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select value={filters.theme} onChange={(event) => setFilters({ ...filters, theme: event.target.value })}><option value="">Thèmes</option>{sessionThemes.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select value={filters.subTheme} onChange={(event) => setFilters({ ...filters, subTheme: event.target.value })}><option value="">Sous-thèmes</option>{sessionSubThemes.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        <select value={filters.visibility} onChange={(event) => setFilters({ ...filters, visibility: event.target.value })}><option value="">Visibilité</option>{sessionVisibilityOptions.map((item) => <option key={item} value={item}>{visibilityLabel(item)}</option>)}</select>
        <input type="number" value={filters.minQuality} onChange={(event) => setFilters({ ...filters, minQuality: event.target.value })} placeholder="Score min" />
        <label className="session-checkbox"><input type="checkbox" checked={filters.includeArchived} onChange={(event) => setFilters({ ...filters, includeArchived: event.target.checked })} /> Archives</label>
      </section>

      {message && <p className="session-warning">{message}</p>}

      <section className="session-library-grid">
        {visibleSituations.map((situation) => {
          const report = analyzeSituationQuality(situation)
          const editable = canEditSituation(situation, currentUser)
          return (
            <article className="session-library-card" key={situation.id}>
              <div className="session-library-card__top">
                <span className={`session-visibility session-visibility--${situation.visibility}`}>{visibilityLabel(situation.visibility)}</span>
                <strong>{report.score}/100</strong>
              </div>
              <h2>{situation.title}</h2>
              <p>{situation.objective || 'Situation à compléter.'}</p>
              <div className="session-card-meta">
                <span>{situation.category || 'Catégorie'}</span>
                <span>{situation.theme || 'Thème'}</span>
                <span>{situation.subTheme || 'Sous-thème'}</span>
                <span>{situation.durationMinutes} min</span>
                <span>{situation.playerCount || 'Effectif'}</span>
              </div>
              <div className="session-actions">
                <button type="button" onClick={() => openSituation(situation)}>Ouvrir</button>
                <button type="button" onClick={() => duplicate(situation)}>Dupliquer</button>
                <button type="button" onClick={() => openSituation(situation)}>Ajouter à une séance</button>
                <button type="button" onClick={() => exportSituationToMarkdown(situation)}>Exporter</button>
                <button type="button" onClick={printSessionPdf}>Exporter la situation PDF</button>
                {editable && <button type="button" onClick={() => updateVisibility(situation, 'public_technicians')}>Rendre public techniciens</button>}
                {editable && <button type="button" onClick={() => updateVisibility(situation, 'private')}>Rendre privé</button>}
                {editable && <button type="button" onClick={() => updateVisibility(situation, 'club_reference')}>Publier référence BCVB</button>}
                {editable && <button type="button" onClick={() => archive(situation)}>Supprimer</button>}
                {isAdmin && <button type="button" onClick={() => hardDelete(situation)}>Supprimer définitivement</button>}
              </div>
            </article>
          )
        })}
      </section>
    </main>
  )
}
