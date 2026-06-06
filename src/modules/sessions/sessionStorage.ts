import { createSession, normalizeSession, normalizeSituation, type SessionSituation, type SessionVisibility, type TrainingSessionV2 } from './sessionModels'

const DRAFT_KEY = 'bcvb-session-draft-v2'
const LIBRARY_KEY = 'bcvb-session-library-v2'
const SITUATION_TEMPLATES_KEY = 'bcvb-situation-templates-v2'
const SITUATION_LIBRARY_KEY = 'bcvb-situation-library-v2'
const SITUATION_DRAFT_KEY = 'bcvb-situation-draft-v2'
const WORKSPACE_KEY = 'bcvb-session-workspace-v2'
const LAST_ROUTE_KEY = 'bcvb-last-route-v2'

export type SessionUser = {
  id?: string | null
  role?: string | null
}

function readJson<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(window.localStorage.getItem(key) || '') as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function saveSessionDraft(session: TrainingSessionV2) {
  const next = normalizeSession({ ...session, updatedAt: new Date().toISOString() })
  writeJson(DRAFT_KEY, next)
  return next
}

export function loadSessionDraft(id?: string) {
  const draft = readJson<TrainingSessionV2 | null>(DRAFT_KEY, null)
  const normalizedDraft = draft ? normalizeSession(draft) : null
  if (!id) return normalizedDraft
  return normalizedDraft?.id === id ? normalizedDraft : null
}

export function restoreSessionDraft(id?: string) {
  return loadSessionDraft(id)
}

export function autosaveSession(session: TrainingSessionV2) {
  return saveSessionDraft(session)
}

export function listSessions() {
  return readJson<TrainingSessionV2[]>(LIBRARY_KEY, []).map(normalizeSession)
}

export function saveSession(session: TrainingSessionV2) {
  const next = saveSessionDraft({ ...session, qualityWarnings: session.qualityWarnings || [] })
  const existing = listSessions().filter((item) => item.id !== next.id)
  writeJson(LIBRARY_KEY, [next, ...existing])
  return next
}

export function duplicateSession(session: TrainingSessionV2) {
  const { id, createdAt, updatedAt, ...copy } = session
  void id
  void createdAt
  void updatedAt

  return createSession({
    ...copy,
    title: `${session.title} - copie`,
  })
}

export function saveSessionWorkspace(session: TrainingSessionV2, workspace: { activeTab?: string; scrollY?: number } = {}) {
  saveSessionDraft(session)
  writeJson(WORKSPACE_KEY, {
    sessionId: session.id,
    activeTab: workspace.activeTab || 'editor',
    scrollY: workspace.scrollY ?? window.scrollY ?? 0,
    updatedAt: new Date().toISOString(),
  })
}

export function restoreSessionWorkspace() {
  return readJson<{ sessionId: string; activeTab: string; scrollY: number; updatedAt: string } | null>(WORKSPACE_KEY, null)
}

export function saveLastRoute(route: string) {
  writeJson(LAST_ROUTE_KEY, { route, updatedAt: new Date().toISOString() })
}

export function restoreLastRoute() {
  return readJson<{ route: string; updatedAt: string } | null>(LAST_ROUTE_KEY, null)
}

export function canManageAllSessions(currentUser?: SessionUser | null) {
  return currentUser?.role === 'admin'
}

export function canCreateTechnicalSession(currentUser?: SessionUser | null) {
  return ['admin', 'responsable_technique', 'responsable technique', 'coach', 'team_staff'].includes(currentUser?.role || '')
}

export function canAccessSession(session: TrainingSessionV2, currentUser?: SessionUser | null) {
  if (currentUser?.role === 'admin') return true
  if (session.visibility === 'archived') return false
  if (session.visibility === 'private') return Boolean(currentUser?.id && (session.ownerId === currentUser.id || session.createdBy === currentUser.id))
  if (session.visibility === 'public_technicians' || session.visibility === 'club_reference') {
    return ['responsable_technique', 'responsable technique', 'coach', 'team_staff'].includes(currentUser?.role || '')
  }
  return true
}

export function canEditSession(session: TrainingSessionV2, currentUser?: SessionUser | null) {
  if (currentUser?.role === 'admin') return true
  return Boolean(currentUser?.id && (session.ownerId === currentUser.id || session.createdBy === currentUser.id))
}

export function canDeleteSession(session: TrainingSessionV2, currentUser?: SessionUser | null) {
  if (currentUser?.role === 'admin') return true
  return Boolean(
    currentUser?.id &&
    session.status === 'draft' &&
    session.visibility === 'private' &&
    (session.ownerId === currentUser.id || session.createdBy === currentUser.id)
  )
}

export function updateSessionVisibility(sessionId: string, visibility: SessionVisibility, currentUser?: SessionUser | null) {
  const sessions = listSessions()
  const nextSessions = sessions.map((session) => {
    if (session.id !== sessionId || !canEditSession(session, currentUser)) return session
    return normalizeSession({
      ...session,
      visibility,
      status: visibility === 'club_reference' ? 'published' : session.status,
      publishedAt: visibility === 'club_reference' ? new Date().toISOString() : session.publishedAt,
      updatedAt: new Date().toISOString(),
    })
  })
  writeJson(LIBRARY_KEY, nextSessions)
  return nextSessions.find((session) => session.id === sessionId) || null
}

export function publishSession(sessionId: string, currentUser?: SessionUser | null) {
  const sessions = listSessions()
  const nextSessions = sessions.map((session) => {
    if (session.id !== sessionId || !canEditSession(session, currentUser)) return session
    return normalizeSession({
      ...session,
      status: currentUser?.role === 'admin' ? 'published' : 'to_review',
      visibility: currentUser?.role === 'admin' ? 'club_reference' : 'public_technicians',
      publishedAt: currentUser?.role === 'admin' ? new Date().toISOString() : session.publishedAt,
      updatedAt: new Date().toISOString(),
    })
  })
  writeJson(LIBRARY_KEY, nextSessions)
  return nextSessions.find((session) => session.id === sessionId) || null
}

export function archiveSession(sessionId: string, currentUser?: SessionUser | null) {
  return deleteSession(sessionId, currentUser)
}

export function deleteSession(sessionId: string, currentUser?: SessionUser | null) {
  const sessions = listSessions()
  const target = sessions.find((session) => session.id === sessionId)
  if (!target || !canDeleteSession(target, currentUser)) return { ok: false, message: 'Droits insuffisants pour supprimer cette séance.' }

  const nextSessions = sessions.map((session) =>
    session.id === sessionId
      ? normalizeSession({
          ...session,
          status: 'archived',
          visibility: 'archived',
          archivedAt: new Date().toISOString(),
          deletedAt: new Date().toISOString(),
          deletedBy: currentUser?.id || '',
          updatedAt: new Date().toISOString(),
        })
      : session
  )
  writeJson(LIBRARY_KEY, nextSessions)
  return { ok: true, message: 'Séance archivée. Cette action est définitive côté coach.' }
}

export function hardDeleteSession(sessionId: string, currentUser?: SessionUser | null) {
  if (currentUser?.role !== 'admin') return { ok: false, message: 'Suppression définitive réservée admin.' }
  writeJson(LIBRARY_KEY, listSessions().filter((session) => session.id !== sessionId))
  return { ok: true, message: 'Séance supprimée définitivement.' }
}

export function saveSituationTemplate(situation: SessionSituation) {
  const next = normalizeSituation({ ...situation, updatedAt: new Date().toISOString() } as Partial<SessionSituation>)
  const templates = listSituationTemplates().filter((item) => item.id !== next.id)
  writeJson(SITUATION_TEMPLATES_KEY, [next, ...templates])
  saveSituation(next)
  return next
}

export function listSituationTemplates() {
  return readJson<SessionSituation[]>(SITUATION_TEMPLATES_KEY, []).map(normalizeSituation)
}

export function saveSituationDraft(situation: SessionSituation) {
  const next = normalizeSituation(situation)
  writeJson(SITUATION_DRAFT_KEY, next)
  return next
}

export function restoreSituationDraft(id?: string) {
  const draft = readJson<SessionSituation | null>(SITUATION_DRAFT_KEY, null)
  const normalizedDraft = draft ? normalizeSituation(draft) : null
  if (!id) return normalizedDraft
  return normalizedDraft?.id === id ? normalizedDraft : null
}

export function listSituations() {
  return readJson<SessionSituation[]>(SITUATION_LIBRARY_KEY, []).map(normalizeSituation)
}

export function saveSituation(situation: SessionSituation) {
  const next = saveSituationDraft(normalizeSituation(situation))
  const existing = listSituations().filter((item) => item.id !== next.id)
  writeJson(SITUATION_LIBRARY_KEY, [next, ...existing])
  return next
}

export function duplicateLibrarySituation(situation: SessionSituation, currentUser?: SessionUser | null) {
  return saveSituation(normalizeSituation({
    ...situation,
    id: '',
    title: `${situation.title} - copie`,
    visibility: 'private',
    status: 'draft',
    ownerId: currentUser?.id || situation.ownerId,
    createdBy: currentUser?.id || situation.createdBy,
    publishedAt: '',
    archivedAt: '',
    deletedAt: '',
  }))
}

export function canAccessSituation(situation: SessionSituation, currentUser?: SessionUser | null) {
  if (currentUser?.role === 'admin') return true
  if (situation.visibility === 'archived') return false
  if (situation.visibility === 'private') return Boolean(currentUser?.id && (situation.ownerId === currentUser.id || situation.createdBy === currentUser.id))
  if (situation.visibility === 'public_technicians' || situation.visibility === 'club_reference') {
    return ['responsable_technique', 'responsable technique', 'coach', 'team_staff'].includes(currentUser?.role || '')
  }
  return true
}

export function canEditSituation(situation: SessionSituation, currentUser?: SessionUser | null) {
  if (currentUser?.role === 'admin') return true
  return Boolean(currentUser?.id && (situation.ownerId === currentUser.id || situation.createdBy === currentUser.id))
}

export function updateSituationVisibility(situationId: string, visibility: SessionVisibility, currentUser?: SessionUser | null) {
  const situations = listSituations()
  const nextSituations = situations.map((situation) => {
    if (situation.id !== situationId || !canEditSituation(situation, currentUser)) return situation
    return normalizeSituation({
      ...situation,
      visibility,
      status: visibility === 'club_reference' ? 'published' : situation.status,
      publishedAt: visibility === 'club_reference' ? new Date().toISOString() : situation.publishedAt,
    })
  })
  writeJson(SITUATION_LIBRARY_KEY, nextSituations)
  return nextSituations.find((situation) => situation.id === situationId) || null
}

export function deleteSituation(situationId: string, currentUser?: SessionUser | null) {
  const situations = listSituations()
  const target = situations.find((situation) => situation.id === situationId)
  if (!target || !canEditSituation(target, currentUser)) return { ok: false, message: 'Droits insuffisants pour supprimer cette situation.' }
  const nextSituations = situations.map((situation) =>
    situation.id === situationId
      ? normalizeSituation({
          ...situation,
          status: 'archived',
          visibility: 'archived',
          archivedAt: new Date().toISOString(),
          deletedAt: new Date().toISOString(),
        })
      : situation
  )
  writeJson(SITUATION_LIBRARY_KEY, nextSituations)
  return { ok: true, message: 'Situation archivée. Cette action est définitive côté coach.' }
}

export function hardDeleteSituation(situationId: string, currentUser?: SessionUser | null) {
  if (currentUser?.role !== 'admin') return { ok: false, message: 'Suppression définitive réservée admin.' }
  writeJson(SITUATION_LIBRARY_KEY, listSituations().filter((situation) => situation.id !== situationId))
  return { ok: true, message: 'Situation supprimée définitivement.' }
}
