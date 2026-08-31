import { supabase } from '../../lib/supabase'
import type {
  AttendancePlayer,
  AttendanceRecord,
  AttendanceSession,
  AttendanceSessionType,
  AttendanceStatus,
} from '../../types/attendance'

export type AttendanceTeamRow = {
  id: string
  name: string
  category: string
  season: string
}

export type AttendanceCapabilities = {
  canView: boolean
  canNavigate: boolean
  canEditDraft: boolean
  canValidate: boolean
  canExport: boolean
  canViewSensitiveNotes: boolean
  canManagePlanning: boolean
}

type AttendanceCapabilitiesRow = {
  can_view: boolean
  can_navigate: boolean
  can_edit_draft: boolean
  can_validate: boolean
  can_export: boolean
  can_view_sensitive_notes: boolean
  can_manage_planning: boolean
}

export type AttendanceMembershipRow = {
  team_id: string
  status: string
  season: string
  player:
    | {
        id: string
        first_name: string
        last_name: string
        category: string | null
        archived_at: string | null
        deleted_at: string | null
      }
    | Array<{
        id: string
        first_name: string
        last_name: string
        category: string | null
        archived_at: string | null
        deleted_at: string | null
      }>
    | null
}

type SessionRow = {
  id: string
  team_id: string
  training_slot_id: string | null
  session_date: string
  title: string
  session_type: AttendanceSessionType
  start_time: string | null
  end_time: string | null
  location_name: string | null
  notes: string | null
  status: 'draft' | 'validated' | 'cancelled'
  created_by: string
  created_at: string
  updated_at: string
}

type RecordRow = {
  id: string
  session_id: string
  player_id: string
  status: AttendanceStatus
  reason: string | null
  delay_minutes: number | null
  injury_note: string | null
  logistic_note: string | null
  coach_comment: string | null
  source: AttendanceRecord['source']
  parent_confirmed: boolean
  validated_by_coach: boolean
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
  version: number
}

export class AttendanceConflictError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AttendanceConflictError'
  }
}

export async function listAttendanceTeams(): Promise<AttendanceTeamRow[]> {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, category, season')
    .is('archived_at', null)
    .order('category')
    .order('name')

  if (error) throw new Error(error.message)
  return (data || []) as AttendanceTeamRow[]
}

export async function loadAttendancePlayers(
  input: { teamId: string; season: string },
): Promise<AttendancePlayer[]> {
  const { teamId, season } = input
  const { data, error } = await supabase
    .from('team_memberships')
    .select(
      'team_id, status, season, player:players(id, first_name, last_name, category, archived_at, deleted_at)',
    )
    .eq('team_id', teamId)
    .eq('season', season)
    .eq('status', 'active')

  if (error) throw new Error(error.message)

  return mapAttendanceMemberships(
    (data || []) as unknown as AttendanceMembershipRow[],
    input,
  )
}

export function mapAttendanceMemberships(
  memberships: AttendanceMembershipRow[],
  input: { teamId: string; season: string },
): AttendancePlayer[] {
  return memberships.flatMap((membership) => {
    if (membership.team_id !== input.teamId || membership.status !== 'active' || membership.season !== input.season) return []
    const player = Array.isArray(membership.player)
      ? membership.player[0]
      : membership.player

    if (!player || player.archived_at || player.deleted_at) return []

    return [{
      id: player.id,
      firstName: player.first_name,
      lastName: player.last_name,
      category: player.category || undefined,
      teamId: input.teamId,
    }]
  })
}

export async function getAttendanceCapabilities(
  teamId: string,
): Promise<AttendanceCapabilities> {
  const { data, error } = await supabase.rpc('get_attendance_capabilities', {
    p_team_id: teamId,
  })
  if (error) throw new Error(error.message)

  const row = (data as AttendanceCapabilitiesRow[] | null)?.[0]
  if (!row) throw new Error('Les capacités Attendance n’ont pas été confirmées par le serveur.')

  return {
    canView: row.can_view === true,
    canNavigate: row.can_navigate === true,
    canEditDraft: row.can_edit_draft === true,
    canValidate: row.can_validate === true,
    canExport: row.can_export === true,
    canViewSensitiveNotes: row.can_view_sensitive_notes === true,
    canManagePlanning: row.can_manage_planning === true,
  }
}

export async function listAttendanceSessions(
  teamId: string,
): Promise<AttendanceSession[]> {
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(
      'id, team_id, training_slot_id, session_date, title, session_type, start_time, end_time, location_name, notes, status, created_by, created_at, updated_at',
    )
    .eq('team_id', teamId)
    .neq('status', 'cancelled')
    .order('session_date', { ascending: false })
    .order('start_time', { ascending: false })

  if (error) throw new Error(error.message)

  return ((data || []) as SessionRow[]).map(mapSession)
}

export async function createAttendanceSession(input: {
  teamId: string
  title: string
  date: string
  startTime?: string
  endTime?: string
  location?: string
  type: AttendanceSessionType
  trainingSlotId?: string | null
}): Promise<AttendanceSession> {
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error('Authentification requise.')
  }

  const { data, error } = await supabase.rpc('create_attendance_session_idempotent', {
    session_payload: {
      team_id: input.teamId,
      training_slot_id: input.trainingSlotId || null,
      session_date: input.date,
      title: input.title.trim() || 'Appel séance',
      session_type: input.type,
      start_time: input.startTime || null,
      end_time: input.endTime || null,
      location_name: input.location?.trim() || null,
      created_by: userData.user.id,
    },
  })

  if (error) throw new Error(error.message)
  const sessions = await listAttendanceSessions(input.teamId)
  const created = sessions.find((session) => session.id === data?.id)
  if (!created) throw new Error("La séance créée n'a pas été confirmée par le serveur.")
  return created
}

export async function loadAttendanceRecords(
  sessionId: string,
): Promise<AttendanceRecord[]> {
  const { data, error } = await supabase.rpc('read_attendance_records_versioned', {
    target_session_id: sessionId,
    target_player_id: null,
  })

  if (error) throw new Error(error.message)
  return ((data || []) as RecordRow[]).map(mapRecord)
}

export async function saveAttendanceRecord(input: {
  recordId?: string
  version?: number
  sessionId: string
  playerId: string
  status: AttendanceStatus
  reason?: string
  delayMinutes?: number
  injuryNote?: string
  logisticNote?: string
  coachComment?: string
  source?: AttendanceRecord['source']
}): Promise<AttendanceRecord> {
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    throw new Error('Authentification requise.')
  }

  const payload = {
    session_id: input.sessionId,
    player_id: input.playerId,
    status: input.status,
    reason: input.reason?.trim() || null,
    delay_minutes:
      input.status === 'late'
        ? Math.max(1, Number(input.delayMinutes || 0))
        : null,
    injury_note:
      input.status === 'injured'
        ? input.injuryNote?.trim() || null
        : null,
    logistic_note: input.logisticNote?.trim() || null,
    coach_comment: input.coachComment?.trim() || null,
    source: input.source || 'coach',

    // Une saisie client n'est jamais une validation officielle.
    validated_by_coach: false,

    created_by: userData.user.id,
    updated_by: userData.user.id,
  }

  const { data: saveResult, error } = await supabase.rpc('save_attendance_record', {
    record_payload: { ...payload, id: input.recordId || null },
    expected_version: input.version ?? null,
  })

  if (error?.code === 'PT409') throw new AttendanceConflictError(error.message)
  if (error) throw new Error(error.message)

  const { data: savedRows, error: readError } = await supabase.rpc(
    'read_attendance_records_versioned',
    {
      target_session_id: input.sessionId,
      target_player_id: input.playerId,
    },
  )

  if (readError) throw new Error(readError.message)

  const savedRecord = ((savedRows || []) as RecordRow[])[0]

  if (!savedRecord) {
    throw new Error("L'enregistrement de la présence n'a pas été confirmé par le serveur.")
  }

  return {
    ...mapRecord(savedRecord),
    version: Number(saveResult?.version),
  }
}

export async function validateAttendanceSession(
  sessionId: string,
): Promise<void> {
  const { data, error } = await supabase.rpc(
    'validate_attendance_session',
    {
      target_session_id: sessionId,
    },
  )

  if (error) throw new Error(error.message)

  if (!data?.ok || data?.session_id !== sessionId) {
    throw new Error(
      'La validation de l’appel n’a pas été confirmée par le serveur.',
    )
  }
}

function mapSession(row: SessionRow): AttendanceSession {
  return {
    id: row.id,
    teamId: row.team_id,
    trainingSlotId: row.training_slot_id || undefined,
    title: row.title,
    date: row.session_date,
    startTime: row.start_time?.slice(0, 5) || undefined,
    endTime: row.end_time?.slice(0, 5) || undefined,
    location: row.location_name || undefined,
    type: row.session_type,
    createdBy: row.created_by,
    locked: row.status === 'validated',
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapRecord(row: RecordRow): AttendanceRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    playerId: row.player_id,
    status: row.status,
    reason: row.reason || undefined,
    delayMinutes: row.delay_minutes || undefined,
    arrivalDelayMinutes: row.delay_minutes || undefined,
    injuryNote: row.injury_note || undefined,
    injuryDetails: row.injury_note || undefined,
    logisticNote: row.logistic_note || undefined,
    coachComment: row.coach_comment || undefined,
    source: row.source || undefined,
    parentConfirmed: row.parent_confirmed,
    validatedByCoach: row.validated_by_coach,
    createdBy: row.created_by,
    updatedBy: row.updated_by || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    version: row.version,
  }
}
