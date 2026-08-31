import { supabase } from '../../lib/supabase'
import type { AttendanceSession } from '../../types/attendance'

export type TrainingSlotRow = {
  id: string
  team_id: string
  season: string
  weekday: number
  start_time: string
  end_time: string
  location_name: string | null
  valid_from: string
  valid_until: string | null
  is_active: boolean
}

export type TrainingSlotExceptionRow = {
  training_slot_id: string
  exception_date: string
  exception_type: 'cancelled' | 'moved' | 'modified'
  start_time: string | null
  end_time: string | null
  location_name: string | null
}

export type AttendanceOccurrence = {
  id: string
  trainingSlotId: string
  teamId: string
  date: string
  startTime: string
  endTime: string
  location?: string
  title: string
  session?: AttendanceSession
  state: 'upcoming' | 'missing' | 'draft' | 'validated'
}

export const ATTENDANCE_OCCURRENCE_PAST_DAYS = 14
export const ATTENDANCE_OCCURRENCE_FUTURE_DAYS = 21

export function preferredOperationalSession(
  sessions: AttendanceSession[],
  occurrences: AttendanceOccurrence[],
): AttendanceSession | null {
  if (occurrences.length > 0) {
    return occurrences.find((occurrence) => occurrence.session)?.session ?? null
  }
  return sessions[0] ?? null
}

function civilDate(date: string) {
  // UTC sert uniquement de compteur stable pour une date civile YYYY-MM-DD :
  // aucun horaire local de séance n'est converti en instant UTC.
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function addCivilDays(date: string, days: number) {
  const value = civilDate(date)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}

function isoWeekday(date: string) {
  return civilDate(date).getUTCDay() || 7
}

function time(value: string) {
  return value.slice(0, 5)
}

export function deriveAttendanceOccurrences(input: {
  teamId: string
  teamSeason: string
  today: string
  slots: TrainingSlotRow[]
  exceptions: TrainingSlotExceptionRow[]
  sessions: AttendanceSession[]
  pastDays?: number
  futureDays?: number
}): AttendanceOccurrence[] {
  const start = addCivilDays(input.today, -(input.pastDays ?? ATTENDANCE_OCCURRENCE_PAST_DAYS))
  const end = addCivilDays(input.today, input.futureDays ?? ATTENDANCE_OCCURRENCE_FUTURE_DAYS)
  const exceptionByOccurrence = new Map(
    input.exceptions.map((item) => [`${item.training_slot_id}:${item.exception_date}`, item]),
  )
  const occurrences: AttendanceOccurrence[] = []

  for (const slot of input.slots) {
    if (!slot.is_active || slot.team_id !== input.teamId || slot.season !== input.teamSeason) continue
    for (let date = start; date <= end; date = addCivilDays(date, 1)) {
      if (date < slot.valid_from || (slot.valid_until && date > slot.valid_until)) continue
      if (isoWeekday(date) !== slot.weekday) continue
      const exception = exceptionByOccurrence.get(`${slot.id}:${date}`)
      if (exception?.exception_type === 'cancelled') continue

      const startTime = time(exception?.start_time || slot.start_time)
      const endTime = time(exception?.end_time || slot.end_time)
      const location = exception?.location_name ?? slot.location_name ?? undefined
      const session = input.sessions.find((item) =>
        item.trainingSlotId === slot.id
        && item.date === date
        && item.type === 'entrainement'
        && item.startTime === startTime
      )
      occurrences.push({
        id: `${slot.id}:${date}`,
        trainingSlotId: slot.id,
        teamId: slot.team_id,
        date,
        startTime,
        endTime,
        location,
        title: `Entraînement${location ? ` · ${location}` : ''}`,
        session,
        state: session?.locked ? 'validated' : session ? 'draft' : date > input.today ? 'upcoming' : 'missing',
      })
    }
  }
  return occurrences.sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`))
}

export async function listAttendanceOccurrences(input: {
  teamId: string
  teamSeason: string
  today: string
  sessions: AttendanceSession[]
}) {
  const rangeStart = addCivilDays(input.today, -ATTENDANCE_OCCURRENCE_PAST_DAYS)
  const rangeEnd = addCivilDays(input.today, ATTENDANCE_OCCURRENCE_FUTURE_DAYS)
  const { data: slots, error: slotError } = await supabase
    .from('training_slots')
    .select('id, team_id, season, weekday, start_time, end_time, location_name, valid_from, valid_until, is_active')
    .eq('team_id', input.teamId)
    .eq('season', input.teamSeason)
    .eq('is_active', true)
    .lte('valid_from', rangeEnd)
    .or(`valid_until.is.null,valid_until.gte.${rangeStart}`)
  if (slotError) throw new Error(slotError.message)

  const slotRows = (slots || []) as TrainingSlotRow[]
  if (!slotRows.length) return []
  const { data: exceptions, error: exceptionError } = await supabase
    .from('training_slot_exceptions')
    .select('training_slot_id, exception_date, exception_type, start_time, end_time, location_name')
    .in('training_slot_id', slotRows.map((slot) => slot.id))
    .gte('exception_date', rangeStart)
    .lte('exception_date', rangeEnd)
  if (exceptionError) throw new Error(exceptionError.message)

  return deriveAttendanceOccurrences({
    ...input,
    slots: slotRows,
    exceptions: (exceptions || []) as TrainingSlotExceptionRow[],
  })
}
