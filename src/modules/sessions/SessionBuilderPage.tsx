import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import { SessionClassificationPanel } from './SessionClassificationPanel'
import { SessionHeaderForm } from './SessionHeaderForm'
import { SessionImportPanel } from './SessionImportPanel'
import { SessionImportModeSelector, type SessionImportMode } from './SessionImportModeSelector'
import { SessionLibraryPicker } from './SessionLibraryPicker'
import { SessionPreview } from './SessionPreview'
import { SessionRightSidebar } from './SessionRightSidebar'
import { SingleSituationImportPanel } from './SingleSituationImportPanel'
import { SessionTemplatePicker } from './SessionTemplatePicker'
import { SessionTimeline } from './SessionTimeline'
import { createCourtFrame, createSession, createSituation, normalizeSession, type SessionSituation, type TrainingSessionV2 } from './sessionModels'
import { getSessionTemplate } from './sessionTemplates'
import { deleteSession, duplicateSession, hardDeleteSession, loadSessionDraft, publishSession, restoreSessionWorkspace, saveLastRoute, saveSession, saveSessionWorkspace, saveSituation, autosaveSession, updateSessionVisibility } from './sessionStorage'
import { exportSessionToJson, exportSessionToMarkdown, printSessionPdf } from './sessionExport'
import { textToList } from './sessionUtils'
import { buildSessionUpgradePrompt } from './sessionTransformer'
import '../../styles/sessions.css'
import '../../styles/courts.css'
import '../../styles/print-session.css'

type PreviewMode = 'edition' | 'coach' | 'print'

function buildInitialSession() {
  return loadSessionDraft() || getSessionTemplate('U13')
}

export default function SessionBuilderPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const currentUser = { id: profile?.id || '', role: profile?.role || 'member' }
  const isAdmin = currentUser.role === 'admin'
  const [session, setSession] = useState<TrainingSessionV2>(() => buildInitialSession())
  const [showTemplates, setShowTemplates] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importMode, setImportMode] = useState<SessionImportMode>('full-session')
  const [showClassification, setShowClassification] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('coach')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(session.updatedAt || null)
  const [restored] = useState(Boolean(loadSessionDraft()))
  const [message, setMessage] = useState('')
  const [upgradePrompt, setUpgradePrompt] = useState('')
  const totalSituations = session.situations.length

  const pageSubtitle = useMemo(() => {
    if (totalSituations === 0) return 'Construire, sauvegarder et exporter une séance terrain BCVB.'
    return `${totalSituations} situations · ${session.durationMinutes} min · ${session.category}`
  }, [session.category, session.durationMinutes, totalSituations])

  useEffect(() => {
    saveLastRoute('/coach/seances')
    const timer = window.setTimeout(() => {
      saveSessionWorkspace(session, { activeTab: previewMode, scrollY: window.scrollY })
      const saved = autosaveSession(session)
      setLastSavedAt(saved.updatedAt)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [previewMode, session])

  useEffect(() => {
    const workspace = restoreSessionWorkspace()
    if (!workspace?.scrollY) return
    window.requestAnimationFrame(() => window.scrollTo({ top: workspace.scrollY, behavior: 'auto' }))
  }, [])

  function updateSession(nextSession: TrainingSessionV2) {
    setSession(normalizeSession({ ...nextSession, updatedAt: new Date().toISOString() }))
  }

  function newSession() {
    updateSession(createSession({ category: session.category, ownerId: currentUser.id, createdBy: currentUser.id, coachName: profile?.full_name || session.coachName }))
  }

  function saveCurrentSession() {
    const saved = saveSession({
      ...session,
      ownerId: session.ownerId || currentUser.id,
      createdBy: session.createdBy || currentUser.id,
      coachName: session.coachName || profile?.full_name || '',
    })
    setSession(saved)
    setLastSavedAt(saved.updatedAt)
    setMessage('Séance enregistrée dans la bibliothèque.')
  }

  function duplicateCurrentSession() {
    updateSession(duplicateSession(session))
  }

  function autoFixSimpleMissing(mode = 'all') {
    updateSession({
      ...session,
      title: session.title || `Séance ${session.category} BCVB`,
      objectives: session.objectives.length ? session.objectives : ['Défendre Fort', 'Courir', 'Partager la Balle'],
      bcvbObjectives: session.bcvbObjectives.length ? session.bcvbObjectives : ['Homme à Homme prioritaire', 'Intensité maîtrisée', 'Lecture et partage'],
      equipment: session.equipment.length ? session.equipment : ['Ballons', 'Plots', 'Chasubles'],
      expectedPlayers: session.expectedPlayers || 12,
      globalOrganization: session.globalOrganization || 'Rotations courtes, passages répétés et feedback coach ciblé.',
      situations: session.situations.length
        ? session.situations.map((situation) => ({
            ...situation,
            organization: situation.organization || 'Groupes courts, rotations actives, espace lisible, coach placé pour observer l’action clé.',
            instructions: situation.instructions || 'Intensité maîtrisée, communication, respect des espaces et transfert match.',
            bcvbObjective: situation.bcvbObjective || 'Relier la situation à Défendre Fort, Courir et Partager la Balle.',
            evolution: situation.evolution || 'Ajouter pression, réduire le temps de décision ou imposer un score.',
            regression: situation.regression || 'Agrandir l’espace, supprimer une contrainte ou ralentir le rythme.',
            observableCriteria: situation.observableCriteria.length ? situation.observableCriteria : ['Posture active', 'Communication', 'Choix pertinent'],
            measurableCriteria: situation.measurableCriteria.length ? situation.measurableCriteria : ['7 réussites sur 10', '3 stops ou avantages consécutifs'],
            bcvbLinks: mode === 'bcvb' || mode === 'all'
              ? {
                  defendreFort: situation.bcvbLinks.defendreFort || 'Pression utile, orientation et aide-reprise.',
                  courir: situation.bcvbLinks.courir || 'Relance ou replacement immédiat.',
                  partager: situation.bcvbLinks.partager || 'Trouver le partenaire mieux placé.',
                  hommeHomme: situation.bcvbLinks.hommeHomme || 'Responsabilité individuelle avant aide.',
                  intensite: situation.bcvbLinks.intensite || 'Rythme élevé et passages courts.',
                  agressiviteMaitrisee: situation.bcvbLinks.agressiviteMaitrisee || 'Contact contrôlé, engagement sans faute.',
                  maitrise: situation.bcvbLinks.maitrise || 'Vitesse avec contrôle.',
                  jeu: situation.bcvbLinks.jeu || 'Lecture libre dans un cadre clair.',
                }
              : situation.bcvbLinks,
            courtFrames: situation.courtFrames.length && mode !== 'courts'
              ? situation.courtFrames
              : [
                  createCourtFrame({ title: 'Frame 1 - mise en place', courtType: 'half-right', intent: 'Placements de départ' }),
                  createCourtFrame({ title: 'Frame 2 - déclenchement', courtType: 'half-right', intent: 'Déplacement ou passe clé' }),
                  createCourtFrame({ title: 'Frame 3 - lecture / choix', courtType: 'half-left', intent: 'Lecture défensive, rotation ou évolution' }),
                ],
          }))
        : [createSituation({ order: 1, title: 'Situation principale', objective: 'Installer l’objectif du jour.' })],
    })
    setMessage(`Séance améliorée automatiquement (${mode}).`)
  }

  function buildUpgradePrompt() {
    const prompt = buildSessionUpgradePrompt(session)
    setUpgradePrompt(prompt)
    navigator.clipboard?.writeText(prompt).then(
      () => setMessage('Prompt de correction massive copié.'),
      () => setMessage('Prompt généré. Copie-le depuis le bloc affiché.')
    )
  }

  function importSession(nextSession: TrainingSessionV2) {
    updateSession({
      ...nextSession,
      ownerId: currentUser.id || nextSession.ownerId,
      createdBy: currentUser.id || nextSession.createdBy,
      coachName: nextSession.coachName || profile?.full_name || '',
    })
    setMessage('Séance importée et transformée en structure BCVB.')
  }

  function addImportedSituation(situation: SessionSituation) {
    const nextSituation = {
      ...situation,
      order: session.situations.length + 1,
      ownerId: currentUser.id || situation.ownerId,
      createdBy: currentUser.id || situation.createdBy,
    }
    saveSituation(nextSituation)
    updateSession({ ...session, situations: [...session.situations, nextSituation] })
    setMessage('Situation importée, ajoutée à la séance et sauvegardée en bibliothèque.')
  }

  function publishCurrentSession() {
    const saved = saveSession(session)
    const published = publishSession(saved.id, currentUser)
    const nextStatus: TrainingSessionV2['status'] = isAdmin ? 'published' : 'to_review'
    const nextVisibility: TrainingSessionV2['visibility'] = isAdmin ? 'club_reference' : 'public_technicians'
    const next = published || { ...saved, status: nextStatus, visibility: nextVisibility }
    updateSession(next)
    setMessage(isAdmin ? 'Séance publiée dans la bibliothèque commune.' : 'Séance proposée en publication.')
  }

  function makePrivate() {
    const saved = saveSession(session)
    const updated = updateSessionVisibility(saved.id, 'private', currentUser)
    updateSession(updated || { ...saved, visibility: 'private' })
    setMessage('Séance rendue privée.')
  }

  function removeCurrentSession(hard = false) {
    if (!window.confirm('Cette action est définitive. Supprimer cette séance ?')) return
    const result = hard ? hardDeleteSession(session.id, currentUser) : deleteSession(session.id, currentUser)
    setMessage(result.message)
    if (result.ok) newSession()
  }

  return (
    <main className="session-page">
      <section className="session-hero">
        <div>
          <p className="bcvb-eyebrow">Terrain / coachs</p>
          <h1>Créateur de séances</h1>
          <p>{pageSubtitle}</p>
        </div>
        <div className="session-actions">
          <button type="button" onClick={newSession}>Nouvelle séance</button>
          <button type="button" onClick={() => { setImportMode('full-session'); setShowImport((value) => !value) }}>Importer une séance</button>
          <button type="button" onClick={() => { setImportMode('single-situation'); setShowImport(true) }}>Importer une situation</button>
          <button type="button" onClick={() => setShowImport(true)}>Transformer en séance BCVB</button>
          <button type="button" onClick={() => { setImportMode('single-situation'); setShowImport(true) }}>Transformer en situation BCVB</button>
          <button type="button" onClick={() => setShowTemplates((value) => !value)}>Charger modèle</button>
          <button type="button" onClick={() => navigate('/coach/seances/bibliotheque')}>Bibliothèque séances</button>
          <button type="button" onClick={() => navigate('/coach/situations/bibliotheque')}>Bibliothèque situations</button>
          <button type="button" onClick={duplicateCurrentSession}>Dupliquer</button>
          <button type="button" onClick={saveCurrentSession}>Enregistrer</button>
          <button type="button" onClick={publishCurrentSession}>Publier dans la bibliothèque</button>
          <button type="button" onClick={makePrivate}>Rendre privée</button>
          {isAdmin && <button type="button" onClick={() => setShowClassification((value) => !value)}>Classer / modifier métadonnées</button>}
          {isAdmin && <button type="button" onClick={() => removeCurrentSession(false)}>Supprimer</button>}
          <button type="button" onClick={() => setPreviewMode('print')}>Prévisualiser</button>
          <button type="button" onClick={printSessionPdf}>Export PDF</button>
        </div>
      </section>

      {showTemplates && <SessionTemplatePicker onPick={(template) => { updateSession(template); setShowTemplates(false) }} />}
      {showImport && (
        <>
          <SessionImportModeSelector mode={importMode} onChange={setImportMode} />
          {importMode === 'full-session'
            ? <SessionImportPanel currentSession={session} onImportSession={importSession} onClose={() => setShowImport(false)} />
            : <SingleSituationImportPanel currentSession={session} currentUser={currentUser} onAddToSession={addImportedSituation} onClose={() => setShowImport(false)} />}
        </>
      )}
      {showClassification && <SessionClassificationPanel session={session} onChange={updateSession} isAdmin={isAdmin} />}
      {message && <p className="session-warning">{message}</p>}
      <div className="session-status-strip">
        <span className={`session-visibility session-visibility--${session.visibility}`}>{session.visibility === 'private' ? 'Privée' : session.visibility === 'public_technicians' ? 'Techniciens' : session.visibility === 'club_reference' ? 'Référence BCVB' : 'Archivée'}</span>
        <span>{session.status}</span>
        <span>{session.transformedFromSource ? 'Transformée BCVB' : 'Création manuelle'}</span>
      </div>

      <div className="session-layout session-workspace session-editor-layout">
        <section className="session-main session-editor-main">
          <SessionHeaderForm session={session} onChange={updateSession} />

          <section className="session-card">
            <header className="session-section-header">
              <p className="bcvb-eyebrow">Objectifs et focus BCVB</p>
              <h2>Résumé coach</h2>
            </header>
            <textarea value={session.summary} onChange={(event) => updateSession({ ...session, summary: event.target.value })} placeholder="Résumé court de la séance, point d’attention principal, intention terrain." />
            <textarea value={session.globalOrganization} onChange={(event) => updateSession({ ...session, globalOrganization: event.target.value })} placeholder="Organisation globale de séance, rotations, contraintes gymnase." />
            <textarea value={session.notes} onChange={(event) => updateSession({ ...session, notes: event.target.value })} placeholder="Notes internes coach, contraintes d’effectif, adaptation matériel." />
          </section>

          <SessionTimeline session={session} onChange={updateSession} />

          <section className="session-card">
            <header className="session-section-header">
              <p className="bcvb-eyebrow">Critères et évaluation</p>
              <h2>Bilan coach</h2>
            </header>
            <div className="session-form-grid">
              <label><span>Ce qui a fonctionné</span><textarea value={session.observations.whatWorked} onChange={(event) => updateSession({ ...session, observations: { ...session.observations, whatWorked: event.target.value } })} /></label>
              <label><span>À répéter</span><textarea value={session.observations.toRepeat} onChange={(event) => updateSession({ ...session, observations: { ...session.observations, toRepeat: event.target.value } })} /></label>
              <label><span>Lien séance suivante</span><textarea value={session.observations.nextSessionLink} onChange={(event) => updateSession({ ...session, observations: { ...session.observations, nextSessionLink: event.target.value } })} /></label>
              <label><span>Notes groupe</span><textarea value={session.observations.groupNotes} onChange={(event) => updateSession({ ...session, observations: { ...session.observations, groupNotes: event.target.value } })} /></label>
            </div>
          </section>

          <section className="session-card">
            <header className="session-section-header">
              <p className="bcvb-eyebrow">Bibliothèque</p>
              <h2>Situations réutilisables</h2>
              <button type="button" onClick={() => setShowLibrary((value) => !value)}>Ouvrir / fermer</button>
            </header>
            {showLibrary && (
              <SessionLibraryPicker
                onInsert={(situation) => updateSession({ ...session, situations: [...session.situations, { ...situation, order: session.situations.length + 1 }] })}
              />
            )}
          </section>

          <section className="session-card">
            <header className="session-section-header">
              <p className="bcvb-eyebrow">Prévisualisation</p>
              <h2>Fiche séance terrain</h2>
              <div className="session-actions">
                <button type="button" className={previewMode === 'edition' ? 'is-active' : ''} onClick={() => setPreviewMode('edition')}>Édition</button>
                <button type="button" className={previewMode === 'coach' ? 'is-active' : ''} onClick={() => setPreviewMode('coach')}>Coach terrain</button>
                <button type="button" className={previewMode === 'print' ? 'is-active' : ''} onClick={() => setPreviewMode('print')}>PDF</button>
              </div>
            </header>
            <SessionPreview session={session} mode={previewMode} />
          </section>

          <section className="session-card">
            <header className="session-section-header">
              <p className="bcvb-eyebrow">Export</p>
              <h2>Sources et impression</h2>
            </header>
            <div className="session-actions">
              <button type="button" onClick={printSessionPdf}>Export PDF</button>
              <button type="button" onClick={() => exportSessionToJson(session)}>Télécharger source JSON</button>
              <button type="button" onClick={() => exportSessionToMarkdown(session)}>Télécharger source Markdown</button>
              <button type="button" onClick={() => updateSession({ ...session, keyFocus: textToList(session.keyFocus.join(', ')) })}>Normaliser tags BCVB</button>
            </div>
            {upgradePrompt && (
              <details className="session-import-prompt" open>
                <summary>Prompt de correction massive</summary>
                <pre>{upgradePrompt}</pre>
              </details>
            )}
          </section>
        </section>

        <SessionRightSidebar session={session} restored={restored} lastSavedAt={lastSavedAt} onAutoFix={autoFixSimpleMissing} onBuildUpgradePrompt={buildUpgradePrompt} onExportPdf={printSessionPdf} />
      </div>
    </main>
  )
}
