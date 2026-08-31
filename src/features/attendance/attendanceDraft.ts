import type {
  AttendanceDraft,
  AttendancePlayer,
  AttendanceRecord,
  AttendanceSession,
  AttendanceStatus,
} from '../../types/attendance'

export function isAttendanceDraftForSession(
  value: unknown,
  session: AttendanceSession,
): value is AttendanceDraft {
  if (!value || typeof value !== 'object') return false

  const draft = value as Partial<AttendanceDraft>
  if (!draft.session || !Array.isArray(draft.records) || typeof draft.updatedAt !== 'string') {
    return false
  }

  return draft.session.id === session.id
    && draft.session.teamId === session.teamId
    && draft.session.date === session.date
    && (draft.session.trainingSlotId ?? null) === (session.trainingSlotId ?? null)
    && draft.records.every((record) =>
      record.sessionId === session.id
      && (record.teamId === undefined || record.teamId === session.teamId),
    )
}

export function setAttendanceDraftStatusForPlayers(input: {
  session: AttendanceSession
  players: AttendancePlayer[]
  records: AttendanceRecord[]
  status: AttendanceStatus
  source: AttendanceRecord['source']
  updatedAt: string
}): AttendanceRecord[] {
  const recordsByPlayer = new Map(input.records.map((record) => [record.playerId, record]))
  const rosterPlayerIds = new Set(input.players.map((player) => player.id))

  const rosterRecords = input.players.map((player) => {
    const record = recordsByPlayer.get(player.id)
    return {
      ...(record ?? {
        id: `draft-${input.session.id}-${player.id}`,
        sessionId: input.session.id,
        teamId: input.session.teamId,
        playerId: player.id,
        source: input.source,
      }),
      status: input.status,
      reason: input.status === 'present' ? '' : record?.reason,
      delayMinutes: input.status === 'late' ? record?.delayMinutes : 0,
      arrivalDelayMinutes: input.status === 'late' ? record?.arrivalDelayMinutes : 0,
      injuryNote: input.status === 'injured' ? record?.injuryNote : '',
      injuryDetails: input.status === 'injured' ? record?.injuryDetails : '',
      updatedAt: input.updatedAt,
    }
  })

  return [
    ...rosterRecords,
    ...input.records.filter((record) => !rosterPlayerIds.has(record.playerId)),
  ]
}
