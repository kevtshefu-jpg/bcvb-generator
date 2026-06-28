import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/context/AuthContext'
import CoachToolModeGuide from '../../features/coach-tools/mode/CoachToolModeGuide'
import CoachToolModeToggle from '../../features/coach-tools/mode/CoachToolModeToggle'
import { useCoachToolMode } from '../../features/coach/hooks/useCoachToolMode'
import { SessionClassificationPanel } from './SessionClassificationPanel'
import { SessionHeaderForm } from './SessionHeaderForm'
import { SessionImportPanel } from './SessionImportPanel'
import { SessionImportModeSelector, type SessionImportMode } from './SessionImportModeSelector'
import { SessionLibraryPicker } from './SessionLibraryPicker'
import { SessionPreview } from './SessionPreview'
import { SingleSituationImportPanel } from './SingleSituationImportPanel'
import { SessionTemplatePicker } from './SessionTemplatePicker'
import { SessionTimeline } from './SessionTimeline'
import {
  createCourtFrame,
  createSession,
  createSituation,
  normalizeSession,
  type SessionSituation,
  type TrainingSessionV2,
} from './sessionModels'
import { getSessionTemplate } from './sessionTemplates'
import {
  autosaveSession,
  deleteSession,
  duplicateSession,
  hardDeleteSession,
  loadSessionDraft,
  publishSession,
  restoreSessionWorkspace,
  saveLastRoute,
  saveSession,
  saveSessionWorkspace,
  saveSituation,
  updateSessionVisibility,
} from './sessionStorage'
import { exportSessionToJson, exportSessionToMarkdown, printSessionPdf } from './sessionExport'
import { textToList } from './sessionUtils'
import { buildSessionUpgradePrompt } from './sessionTransformer'
import '../../styles/sessions.css'
import '../../styles/courts.css'
import '../../styles/print-session.css'

type PreviewMode = 'edition' | 'coach' | 'print'
type AutoFixMode = 'all' | 'bcvb' | 'courts'

type SessionSectionId =
  | 'session-infos'
  | 'session-resume'
  | 'session-situations'
  | 'session-bilan'
  | 'session-library'
  | 'session-preview'
  | 'session-export'

const SESSION_SECTION_IDS: SessionSectionId[] = [
  'session-infos',
  'session-resume',
  'session-situations',
  'session-bilan',
  'session-library',
  'session-preview',
  'session-export',
]

function buildInitialSession() {
  const draft = loadSessionDraft()
  const baseSession = draft || getSessionTemplate('U13')

  return normalizeSession(baseSession)
}

function formatSavedTime(value: string | null) {
  if (!value) return 'Non sauvegardé'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `Sauvegardé ${date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })}`
}

function getVisibilityLabel(visibility: TrainingSessionV2['visibility']) {
  if (visibility === 'private') return 'Privée'
  if (visibility === 'public_technicians') return 'Techniciens'
  if (visibility === 'club_reference') return 'Référence BCVB'
  return 'Archivée'
}

function getQualityScore(session: TrainingSessionV2) {
  let score = 0

  if (session.title) score += 8
  if (session.category) score += 6
  if (session.coachName) score += 6
  if (session.durationMinutes > 0) score += 6
  if (session.expectedPlayers > 0) score += 6
  if (session.objectives.length > 0) score += 8
  if (session.bcvbObjectives.length > 0) score += 8
  if (session.equipment.length > 0) score += 6
  if (session.summary) score += 6
  if (session.globalOrganization) score += 6
  if (session.situations.length > 0) score += 10

  const situationsWithCriteria = session.situations.filter(
    (situation) =>
      situation.observableCriteria.length > 0 ||
      situation.measurableCriteria.length > 0
  ).length

  if (situationsWithCriteria > 0) score += 8

  const situationsWithCourts = session.situations.filter(
    (situation) => situation.courtFrames.length > 0
  ).length

  if (situationsWithCourts > 0) score += 8

  if (session.notes || session.observations.groupNotes) score += 4

  return Math.min(100, score)
}

function getQualityLabel(score: number) {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'publiable'
  if (score >= 55) return 'à renforcer'
  return 'à compléter'
}

/**
 * IMPORTANT :
 * Cette fonction ne vide plus les objets.
 * Elle laisse createCourtFrame() produire le terrain corrigé :
 * - attaquant
 * - défenseur
 * - ballon
 * - flèche de drive
 */
function createCorrectedSessionCourtFrame(
  params: Parameters<typeof createCourtFrame>[0]
): ReturnType<typeof createCourtFrame> {
  return createCourtFrame({
    ...params,
    intent: params?.intent || '',
  })
}

/**
 * Nettoyage volontaire uniquement quand Kevin clique sur “Nettoyer terrains”.
 * À ne pas utiliser pour créer les terrains par défaut.
 */
function clearCourtFrameObjects(
  frame: ReturnType<typeof createCourtFrame>
): ReturnType<typeof createCourtFrame> {
  return {
    ...frame,
    players: [],
    defenders: [],
    attackers: [],
    balls: [],
    cones: [],
    screens: [],
    zones: [],
    arrows: [],
    passes: [],
    dribbles: [],
    runs: [],
    movements: [],
    labels: [],
    annotations: [],
    drawings: [],
    freeDrawings: [],
    elements: [],
    objects: [],
    items: [],
  } as ReturnType<typeof createCourtFrame>
}

export default function SessionBuilderPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { mode, isExpert, setMode } = useCoachToolMode()

  const currentUser = {
    id: profile?.id || '',
    role: profile?.role || 'member',
  }

  const isAdmin = currentUser.role === 'admin'

  const [session, setSession] = useState<TrainingSessionV2>(() => buildInitialSession())
  const [showTemplates, setShowTemplates] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importMode, setImportMode] = useState<SessionImportMode>('full-session')
  const [showClassification, setShowClassification] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [showMoreActions, setShowMoreActions] = useState(false)
  const [previewMode, setPreviewMode] = useState<PreviewMode>('coach')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(session.updatedAt || null)
  const [restored] = useState(Boolean(loadSessionDraft()))
  const [message, setMessage] = useState('')
  const [upgradePrompt, setUpgradePrompt] = useState('')
  const [activeSection, setActiveSection] = useState<SessionSectionId>('session-infos')

  const totalSituations = session.situations.length
  const qualityScore = getQualityScore(session)
  const qualityLabel = getQualityLabel(qualityScore)

  const pageSubtitle = useMemo(() => {
    if (totalSituations === 0) {
      return 'Construire, sauvegarder et exporter une séance terrain BCVB.'
    }

    return `${totalSituations} situations · ${session.durationMinutes} min · ${session.category}`
  }, [session.category, session.durationMinutes, totalSituations])

  useEffect(() => {
    saveLastRoute('/coach/seances')

    const timer = window.setTimeout(() => {
      saveSessionWorkspace(session, {
        activeTab: previewMode,
        scrollY: window.scrollY,
      })

      const saved = autosaveSession(session)
      setLastSavedAt(saved.updatedAt)
    }, 5000)

    return () => window.clearTimeout(timer)
  }, [previewMode, session])

  useEffect(() => {
    const workspace = restoreSessionWorkspace()

    if (!workspace?.scrollY) return

    window.requestAnimationFrame(() => {
      window.scrollTo({
        top: workspace.scrollY,
        behavior: 'auto',
      })
    })
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        const firstVisible = visibleEntries[0]

        if (!firstVisible?.target?.id) return

        if (SESSION_SECTION_IDS.includes(firstVisible.target.id as SessionSectionId)) {
          setActiveSection(firstVisible.target.id as SessionSectionId)
        }
      },
      {
        root: null,
        rootMargin: '-120px 0px -55% 0px',
        threshold: [0.15, 0.25, 0.4, 0.6],
      }
    )

    SESSION_SECTION_IDS.forEach((sectionId) => {
      const section = document.getElementById(sectionId)

      if (section) {
        observer.observe(section)
      }
    })

    return () => observer.disconnect()
  }, [])

  function updateSession(nextSession: TrainingSessionV2) {
    setSession(
      normalizeSession({
        ...nextSession,
        updatedAt: new Date().toISOString(),
      })
    )
  }

  function newSession() {
    updateSession(
      createSession({
        category: session.category,
        ownerId: currentUser.id,
        createdBy: currentUser.id,
        coachName: profile?.full_name || session.coachName,
      })
    )

    setShowMoreActions(false)
    setMessage('Nouvelle séance créée avec terrains corrigés.')
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
    setMessage('Séance dupliquée.')
  }

  function autoFixSimpleMissing(mode: AutoFixMode = 'all') {
    updateSession({
      ...session,
      title: session.title || `Séance ${session.category} BCVB`,
      objectives: session.objectives.length
        ? session.objectives
        : ['Défendre Fort', 'Courir', 'Partager la Balle'],
      bcvbObjectives: session.bcvbObjectives.length
        ? session.bcvbObjectives
        : ['Homme à Homme prioritaire', 'Intensité maîtrisée', 'Lecture et partage'],
      equipment: session.equipment.length ? session.equipment : ['Ballons', 'Plots', 'Chasubles'],
      expectedPlayers: session.expectedPlayers || 12,
      globalOrganization:
        session.globalOrganization ||
        'Rotations courtes, passages répétés et feedback coach ciblé.',
      situations: session.situations.length
        ? session.situations.map((situation) => {
            const currentLinks = situation.bcvbLinks || {
              defendreFort: '',
              courir: '',
              partager: '',
              hommeHomme: '',
              intensite: '',
              agressiviteMaitrisee: '',
              maitrise: '',
              jeu: '',
            }

            return {
              ...situation,
              organization:
                situation.organization ||
                'Groupes courts, rotations actives, espace lisible, coach placé pour observer l’action clé.',
              instructions:
                situation.instructions ||
                'Intensité maîtrisée, communication, respect des espaces et transfert match.',
              bcvbObjective:
                situation.bcvbObjective ||
                'Relier la situation à Défendre Fort, Courir et Partager la Balle.',
              evolution:
                situation.evolution ||
                'Ajouter pression, réduire le temps de décision ou imposer un score.',
              regression:
                situation.regression ||
                'Agrandir l’espace, supprimer une contrainte ou ralentir le rythme.',
              observableCriteria: situation.observableCriteria.length
                ? situation.observableCriteria
                : ['Posture active', 'Communication', 'Choix pertinent'],
              measurableCriteria: situation.measurableCriteria.length
                ? situation.measurableCriteria
                : ['7 réussites sur 10', '3 stops ou avantages consécutifs'],
              bcvbLinks:
                mode === 'bcvb' || mode === 'all'
                  ? {
                      defendreFort:
                        currentLinks.defendreFort ||
                        'Pression utile, orientation et aide-reprise.',
                      courir: currentLinks.courir || 'Relance ou replacement immédiat.',
                      partager: currentLinks.partager || 'Trouver le partenaire mieux placé.',
                      hommeHomme:
                        currentLinks.hommeHomme || 'Responsabilité individuelle avant aide.',
                      intensite: currentLinks.intensite || 'Rythme élevé et passages courts.',
                      agressiviteMaitrisee:
                        currentLinks.agressiviteMaitrisee ||
                        'Contact contrôlé, engagement sans faute.',
                      maitrise: currentLinks.maitrise || 'Vitesse avec contrôle.',
                      jeu: currentLinks.jeu || 'Lecture libre dans un cadre clair.',
                    }
                  : situation.bcvbLinks,
              courtFrames:
                situation.courtFrames.length && mode !== 'courts'
                  ? situation.courtFrames
                  : [
                      createCorrectedSessionCourtFrame({
                        title: 'Terrain 1 - mise en place',
                        courtType: 'half-right',
                      }),
                      createCorrectedSessionCourtFrame({
                        title: 'Terrain 2 - déclenchement',
                        courtType: 'half-right',
                      }),
                      createCorrectedSessionCourtFrame({
                        title: 'Terrain 3 - lecture / choix',
                        courtType: 'half-left',
                      }),
                    ],
            }
          })
        : [
            createSituation({
              order: 1,
              title: 'Situation principale',
              objective: 'Installer l’objectif du jour.',
              courtFrames: [
                createCorrectedSessionCourtFrame({
                  title: 'Terrain 1 - mise en place',
                  courtType: 'half-right',
                }),
              ],
            }),
          ],
    })

    setMessage(
      mode === 'courts'
        ? 'Terrains corrigés : attaquant, défenseur, ballon et flèche de drive ajoutés.'
        : `Séance améliorée automatiquement (${mode}).`
    )
  }

  function cleanAllCourtFrames() {
    updateSession({
      ...session,
      situations: session.situations.map((situation) => ({
        ...situation,
        courtFrames: situation.courtFrames.map((frame) => clearCourtFrameObjects(frame)),
      })),
    })

    setMessage('Tous les terrains ont été nettoyés : dessins, flèches, zones et objets supprimés.')
  }

  function buildUpgradePrompt() {
    const prompt = buildSessionUpgradePrompt(session)

    setUpgradePrompt(prompt)

    navigator.clipboard?.writeText(prompt).then(
      () => setMessage('Consigne de correction massive copiée.'),
      () => setMessage('Consigne générée. Copie-la depuis le bloc affiché.')
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

    updateSession({
      ...session,
      situations: [...session.situations, nextSituation],
    })

    setMessage('Situation importée, ajoutée à la séance et sauvegardée en bibliothèque.')
  }

  function publishCurrentSession() {
    const saved = saveSession(session)
    const published = publishSession(saved.id, currentUser)

    const nextStatus: TrainingSessionV2['status'] = isAdmin ? 'published' : 'to_review'
    const nextVisibility: TrainingSessionV2['visibility'] = isAdmin
      ? 'club_reference'
      : 'public_technicians'

    const next =
      published ||
      ({
        ...saved,
        status: nextStatus,
        visibility: nextVisibility,
      } as TrainingSessionV2)

    updateSession(next)

    setMessage(
      isAdmin
        ? 'Séance publiée dans la bibliothèque commune.'
        : 'Séance proposée en publication.'
    )
  }

  function makePrivate() {
    const saved = saveSession(session)
    const updated = updateSessionVisibility(saved.id, 'private', currentUser)

    updateSession(updated || { ...saved, visibility: 'private' })
    setMessage('Séance rendue privée.')
  }

  function removeCurrentSession(hard = false) {
    if (!window.confirm('Cette action est définitive. Supprimer cette séance ?')) return

    const result = hard
      ? hardDeleteSession(session.id, currentUser)
      : deleteSession(session.id, currentUser)

    setMessage(result.message)

    if (result.ok) {
      newSession()
    }
  }

  function scrollToSessionSection(sectionId: SessionSectionId) {
    const target = document.getElementById(sectionId)

    if (!target) return

    setActiveSection(sectionId)

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <main
      className={[
        'session-page',
        'session-page--with-fixed-dock',
        'session-builder-page',
        `session-builder-page--${mode}`,
      ].join(' ')}
    >
      <section className="session-hero">
        <div className="session-hero__content">
          <p className="bcvb-eyebrow">Terrain / coachs</p>
          <h1>Créateur de séances</h1>
          <p>{pageSubtitle}</p>
        </div>

        <div className="session-hero-actions">
          <div className="session-hero-actions__primary">
            <button
              type="button"
              className="session-hero-btn session-hero-btn--primary"
              onClick={newSession}
            >
              <span className="session-hero-btn__icon" aria-hidden="true">
                ＋
              </span>
              <span>Nouvelle séance</span>
            </button>

            <button
              type="button"
              className="session-hero-btn"
              onClick={() => {
                setImportMode('full-session')
                setShowImport((value) => !value)
              }}
            >
              <span className="session-hero-btn__icon" aria-hidden="true">
                📥
              </span>
              <span>Importer</span>
            </button>

            <button
              type="button"
              className="session-hero-btn"
              onClick={() => navigate('/coach/seances/bibliotheque')}
            >
              <span className="session-hero-btn__icon" aria-hidden="true">
                📚
              </span>
              <span>Bibliothèques</span>
            </button>

            <button type="button" className="session-hero-btn" onClick={printSessionPdf}>
              <span className="session-hero-btn__icon" aria-hidden="true">
                📄
              </span>
              <span>Export PDF</span>
            </button>

            <button
              type="button"
              className={`session-hero-btn session-hero-btn--more${
                showMoreActions ? ' is-open' : ''
              }`}
              onClick={() => setShowMoreActions((value) => !value)}
              aria-expanded={showMoreActions}
            >
              <span className="session-hero-btn__icon" aria-hidden="true">
                ⋯
              </span>
              <span>Plus d’actions</span>
            </button>
          </div>

          {showMoreActions && (
            <div className="session-more-actions" aria-label="Actions secondaires de séance">
              <div className="session-more-actions__group">
                <p>Importer / transformer</p>

                <button
                  type="button"
                  onClick={() => {
                    setImportMode('single-situation')
                    setShowImport(true)
                    setShowMoreActions(false)
                  }}
                >
                  Importer une situation
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportMode('full-session')
                    setShowImport(true)
                    setShowMoreActions(false)
                  }}
                >
                  Transformer en séance BCVB
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setImportMode('single-situation')
                    setShowImport(true)
                    setShowMoreActions(false)
                  }}
                >
                  Transformer en situation BCVB
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowTemplates((value) => !value)
                    setShowMoreActions(false)
                  }}
                >
                  Charger modèle
                </button>
              </div>

              <div className="session-more-actions__group">
                <p>Bibliothèques</p>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/coach/seances/bibliotheque')
                    setShowMoreActions(false)
                  }}
                >
                  Bibliothèque séances
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigate('/coach/situations/bibliotheque')
                    setShowMoreActions(false)
                  }}
                >
                  Bibliothèque situations
                </button>
              </div>

              <div className="session-more-actions__group">
                <p>Gestion</p>

                <button
                  type="button"
                  onClick={() => {
                    duplicateCurrentSession()
                    setShowMoreActions(false)
                  }}
                >
                  Dupliquer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    saveCurrentSession()
                    setShowMoreActions(false)
                  }}
                >
                  Enregistrer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    publishCurrentSession()
                    setShowMoreActions(false)
                  }}
                >
                  Publier dans la bibliothèque
                </button>

                <button
                  type="button"
                  onClick={() => {
                    makePrivate()
                    setShowMoreActions(false)
                  }}
                >
                  Rendre privée
                </button>
              </div>

              <div className="session-more-actions__group">
                <p>Contrôle</p>

                <button
                  type="button"
                  onClick={() => {
                    setPreviewMode('print')
                    setShowMoreActions(false)
                  }}
                >
                  Prévisualiser
                </button>

                <button
                  type="button"
                  onClick={() => {
                    autoFixSimpleMissing('courts')
                    setShowMoreActions(false)
                  }}
                >
                  Corriger terrains
                </button>

                <button
                  type="button"
                  onClick={() => {
                    cleanAllCourtFrames()
                    setShowMoreActions(false)
                  }}
                >
                  Nettoyer tous les terrains
                </button>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowClassification((value) => !value)
                      setShowMoreActions(false)
                    }}
                  >
                    Classer / modifier métadonnées
                  </button>
                )}

                {isAdmin && (
                  <button
                    type="button"
                    className="session-more-actions__danger"
                    onClick={() => {
                      removeCurrentSession(false)
                      setShowMoreActions(false)
                    }}
                  >
                    Supprimer
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section
        className={[
          'coach-tool-mode-shell',
          isExpert ? 'coach-tool-mode-shell--expert' : '',
        ].filter(Boolean).join(' ')}
      >
        <CoachToolModeToggle mode={mode} onChange={setMode} />
        <CoachToolModeGuide mode={mode} context="session" />
      </section>

      {showTemplates && (
        <SessionTemplatePicker
          onPick={(template) => {
            updateSession(template)
            setShowTemplates(false)
          }}
        />
      )}

      {showImport && (
        <>
          <SessionImportModeSelector mode={importMode} onChange={setImportMode} />

          {importMode === 'full-session' ? (
            <SessionImportPanel
              currentSession={session}
              onImportSession={importSession}
              onClose={() => setShowImport(false)}
            />
          ) : (
            <SingleSituationImportPanel
              currentSession={session}
              currentUser={currentUser}
              onAddToSession={addImportedSituation}
              onClose={() => setShowImport(false)}
            />
          )}
        </>
      )}

      {showClassification && (
        <SessionClassificationPanel session={session} onChange={updateSession} isAdmin={isAdmin} />
      )}

      {message && <p className="session-warning">{message}</p>}

      <div className="session-status-strip">
        <span className={`session-visibility session-visibility--${session.visibility}`}>
          {getVisibilityLabel(session.visibility)}
        </span>

        <span>{session.status}</span>

        <span>{session.transformedFromSource ? 'Transformée BCVB' : 'Création manuelle'}</span>
      </div>

      <nav className="session-step-nav" aria-label="Navigation rapide dans la séance">
        <button
          type="button"
          className={activeSection === 'session-infos' ? 'is-active' : ''}
          onClick={() => scrollToSessionSection('session-infos')}
        >
          <span>1</span>
          Infos générales
        </button>

        <button
          type="button"
          className={activeSection === 'session-resume' ? 'is-active' : ''}
          onClick={() => scrollToSessionSection('session-resume')}
        >
          <span>2</span>
          Résumé coach
        </button>

        <button
          type="button"
          className={activeSection === 'session-situations' ? 'is-active' : ''}
          onClick={() => scrollToSessionSection('session-situations')}
        >
          <span>3</span>
          Situations
        </button>

        <button
          type="button"
          className={activeSection === 'session-bilan' ? 'is-active' : ''}
          onClick={() => scrollToSessionSection('session-bilan')}
        >
          <span>4</span>
          Bilan
        </button>

        <button
          type="button"
          className={activeSection === 'session-library' ? 'is-active' : ''}
          onClick={() => scrollToSessionSection('session-library')}
        >
          <span>5</span>
          Bibliothèque
        </button>

        <button
          type="button"
          className={activeSection === 'session-preview' ? 'is-active' : ''}
          onClick={() => scrollToSessionSection('session-preview')}
        >
          <span>6</span>
          Prévisualisation
        </button>

        <button
          type="button"
          className={activeSection === 'session-export' ? 'is-active' : ''}
          onClick={() => scrollToSessionSection('session-export')}
        >
          <span>7</span>
          Export
        </button>
      </nav>

      <div className="session-layout session-workspace session-editor-layout session-editor-layout--bottom-dock">
        <section className="session-main session-workspace__main session-editor-main">
          <section id="session-infos" className="session-anchor-block">
            <SessionHeaderForm session={session} onChange={updateSession} />
          </section>

          <section id="session-resume" className="session-card session-card--resume session-anchor-block">
            <header className="session-section-header session-section-header--premium">
              <div>
                <p className="bcvb-eyebrow">Objectifs et focus BCVB</p>
                <h2>Résumé coach</h2>
                <p className="session-section-intro">
                  Clarifie l’intention de la séance, l’organisation terrain et les points de
                  vigilance avant de construire le déroulé.
                </p>
              </div>

              <div className="session-resume-badge">
                <span>Identité</span>
                <strong>Défendre · Courir · Partager</strong>
              </div>
            </header>

            <div className="session-resume-layout">
              <div className="session-resume-fields">
                <label className="session-premium-field">
                  <span>Intention prioritaire de séance</span>
                  <textarea
                    value={session.summary}
                    onChange={(event) =>
                      updateSession({
                        ...session,
                        summary: event.target.value,
                      })
                    }
                    placeholder="Exemple : installer une pression défensive forte sur porteur, provoquer des courses rapides et finir par un choix collectif simple."
                  />
                </label>

                <label className="session-premium-field">
                  <span>Organisation générale</span>
                  <textarea
                    value={session.globalOrganization}
                    onChange={(event) =>
                      updateSession({
                        ...session,
                        globalOrganization: event.target.value,
                      })
                    }
                    placeholder="Exemple : groupes de 4 à 5 joueurs, rotations courtes, passages intenses, feedback rapide après chaque séquence."
                  />
                </label>

                <label className="session-premium-field">
                  <span>Notes internes coach</span>
                  <textarea
                    value={session.notes}
                    onChange={(event) =>
                      updateSession({
                        ...session,
                        notes: event.target.value,
                      })
                    }
                    placeholder="Contraintes d’effectif, joueur à observer, adaptation matériel, vigilance comportementale ou physique."
                  />
                </label>
              </div>

              <aside
                className="session-resume-helper"
                aria-label="Aide à la rédaction du résumé coach"
              >
                <div className="session-resume-helper__header">
                  <span>Repère coach</span>
                  <strong>Une bonne séance BCVB doit répondre à 4 questions.</strong>
                </div>

                <ul>
                  <li>
                    <strong>Qu’est-ce qu’on apprend ?</strong>
                    <span>Objectif clair, observable et transférable.</span>
                  </li>

                  <li>
                    <strong>Comment on joue ?</strong>
                    <span>Intensité, rythme, agressivité maîtrisée.</span>
                  </li>

                  <li>
                    <strong>Comment on défend ?</strong>
                    <span>Responsabilité Homme à Homme avant l’aide.</span>
                  </li>

                  <li>
                    <strong>Comment on régule ?</strong>
                    <span>Critères simples, feedback court, adaptation terrain.</span>
                  </li>
                </ul>

                <button type="button" onClick={() => autoFixSimpleMissing('courts')}>
                  Corriger terrains
                </button>
              </aside>
            </div>
          </section>

          <section id="session-situations" className="session-anchor-block">
            <SessionTimeline session={session} onChange={updateSession} />
          </section>

          <section id="session-bilan" className="session-card session-anchor-block">
            <header className="session-section-header">
              <p className="bcvb-eyebrow">Critères et évaluation</p>
              <h2>Bilan coach</h2>
            </header>

            <div className="session-form-grid">
              <label>
                <span>Ce qui a fonctionné</span>
                <textarea
                  value={session.observations.whatWorked}
                  onChange={(event) =>
                    updateSession({
                      ...session,
                      observations: {
                        ...session.observations,
                        whatWorked: event.target.value,
                      },
                    })
                  }
                />
              </label>

              <label>
                <span>À répéter</span>
                <textarea
                  value={session.observations.toRepeat}
                  onChange={(event) =>
                    updateSession({
                      ...session,
                      observations: {
                        ...session.observations,
                        toRepeat: event.target.value,
                      },
                    })
                  }
                />
              </label>

              <label>
                <span>Lien séance suivante</span>
                <textarea
                  value={session.observations.nextSessionLink}
                  onChange={(event) =>
                    updateSession({
                      ...session,
                      observations: {
                        ...session.observations,
                        nextSessionLink: event.target.value,
                      },
                    })
                  }
                />
              </label>

              <label>
                <span>Notes groupe</span>
                <textarea
                  value={session.observations.groupNotes}
                  onChange={(event) =>
                    updateSession({
                      ...session,
                      observations: {
                        ...session.observations,
                        groupNotes: event.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
          </section>

          <section id="session-library" className="session-card session-anchor-block">
            <header className="session-section-header">
              <p className="bcvb-eyebrow">Bibliothèque</p>
              <h2>Situations réutilisables</h2>

              <button type="button" onClick={() => setShowLibrary((value) => !value)}>
                Ouvrir / fermer
              </button>
            </header>

            {showLibrary && (
              <SessionLibraryPicker
                onInsert={(situation) =>
                  updateSession({
                    ...session,
                    situations: [
                      ...session.situations,
                      {
                        ...situation,
                        order: session.situations.length + 1,
                      },
                    ],
                  })
                }
              />
            )}
          </section>

          <section id="session-preview" className="session-card session-anchor-block">
            <header className="session-section-header">
              <p className="bcvb-eyebrow">Prévisualisation</p>
              <h2>Fiche séance terrain</h2>

              <div className="session-actions">
                <button
                  type="button"
                  className={previewMode === 'edition' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('edition')}
                >
                  Édition
                </button>

                <button
                  type="button"
                  className={previewMode === 'coach' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('coach')}
                >
                  Coach terrain
                </button>

                <button
                  type="button"
                  className={previewMode === 'print' ? 'is-active' : ''}
                  onClick={() => setPreviewMode('print')}
                >
                  PDF
                </button>
              </div>
            </header>

            <SessionPreview session={session} mode={previewMode} />
          </section>

          <section id="session-export" className="session-card session-anchor-block">
            <header className="session-section-header">
              <p className="bcvb-eyebrow">Export</p>
              <h2>Sources et impression</h2>
            </header>

            <div className="session-actions">
              <button type="button" onClick={printSessionPdf}>
                Export PDF
              </button>

              <button type="button" onClick={() => exportSessionToJson(session)}>
                Télécharger source JSON
              </button>

              <button type="button" onClick={() => exportSessionToMarkdown(session)}>
                Télécharger source Markdown
              </button>

              <button
                type="button"
                onClick={() =>
                  updateSession({
                    ...session,
                    keyFocus: textToList(session.keyFocus.join(', ')),
                  })
                }
              >
                Normaliser tags BCVB
              </button>
            </div>

            {upgradePrompt && (
              <details className="session-import-prompt" open>
                <summary>Consigne de correction massive</summary>
                <pre>{upgradePrompt}</pre>
              </details>
            )}
          </section>
        </section>
      </div>

      <aside
        className="session-fixed-dock"
        aria-label="Résumé, qualité et actions rapides de la séance"
      >
        <div className="session-fixed-dock__inner">
          <div className="session-fixed-dock__header">
            <div>
              <span>Suivi séance</span>
              <strong>{session.title || `Séance ${session.category}`}</strong>
            </div>

            <small>Glisser horizontalement →</small>
          </div>

          <div className="session-fixed-dock__scroll">
            <article className="session-dock-card session-dock-card--save">
              <span className="session-dock-card__label">
                {restored ? 'Brouillon restauré' : 'Sauvegarde'}
              </span>
              <strong>{formatSavedTime(lastSavedAt)}</strong>
            </article>

            <article className="session-dock-card">
              <span className="session-dock-card__label">Durée prévue</span>
              <strong>{session.durationMinutes} min</strong>
            </article>

            <article className="session-dock-card">
              <span className="session-dock-card__label">Déroulé</span>
              <strong>{session.durationMinutes} min</strong>
            </article>

            <article className="session-dock-card">
              <span className="session-dock-card__label">Situations</span>
              <strong>{totalSituations}</strong>
            </article>

            <article className="session-dock-card">
              <span className="session-dock-card__label">Effectif</span>
              <strong>{session.expectedPlayers || 0}</strong>
            </article>

            <article className="session-dock-card session-dock-card--quality">
              <div>
                <span className="session-dock-card__label">Qualité séance</span>
                <strong>{qualityLabel}</strong>
              </div>

              <div className="session-dock-score">{qualityScore}</div>
            </article>

            <article className="session-dock-card session-dock-card--actions">
              <span className="session-dock-card__label">Améliorer</span>

              <div className="session-dock-actions">
                <button type="button" onClick={() => autoFixSimpleMissing('all')}>
                  Compléter
                </button>

                <button type="button" onClick={() => autoFixSimpleMissing('bcvb')}>
                  Valeurs BCVB
                </button>

                <button type="button" onClick={() => autoFixSimpleMissing('courts')}>
                  Corriger terrains
                </button>

                <button type="button" onClick={cleanAllCourtFrames}>
                  Nettoyer terrains
                </button>

                <button type="button" onClick={buildUpgradePrompt}>
                  Consigne
                </button>
              </div>
            </article>

            <article className="session-dock-card session-dock-card--actions">
              <span className="session-dock-card__label">Exporter</span>

              <div className="session-dock-actions">
                <button type="button" onClick={printSessionPdf}>
                  PDF
                </button>

                <button type="button" onClick={() => exportSessionToJson(session)}>
                  JSON
                </button>

                <button type="button" onClick={() => exportSessionToMarkdown(session)}>
                  Markdown
                </button>
              </div>
            </article>
          </div>
        </div>
      </aside>
    </main>
  )
}
