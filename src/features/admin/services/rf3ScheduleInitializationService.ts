import { supabase } from '../../../lib/supabase'
import {
  saveTrainingSlot,
  slotsConflict,
  type SlotInput,
  type TrainingSlot,
} from '../../operational-planning/operationalPlanningService'

export type Rf3ScheduleState = 'READY' | 'ALREADY_INITIALIZED' | 'PARTIAL' | 'CONFLICT' | 'ERROR'
export type ApprovedSlotKey = 'wednesday' | 'friday'

export type Rf3SchedulePrecheck = {
  state: Rf3ScheduleState
  teamCount: number
  playerCount: number
  membershipCount: number
  activeHeadCoachCount: number
  exactWednesdayCount: number
  exactFridayCount: number
  unexpectedRf3SlotCount: number
  facilityConflictCount: number
}

export type Rf3ScheduleWriteResult =
  | { status: 'TWO_CREATED'; created: ApprovedSlotKey[] }
  | { status: 'FIRST_FAILED'; created: []; failed: 'wednesday' }
  | { status: 'PARTIAL'; created: ['wednesday']; failed: 'friday' }

type TeamRow = {
  id: string
  head_coach_id: string | null
}

type MembershipRow = {
  player_id: string
}

type SlotRow = TrainingSlot

const approvedSlots: Record<ApprovedSlotKey, SlotInput> = {
  wednesday: {
    team_id: '',
    season: '2026-2027',
    weekday: 3,
    start_time: '20:30',
    end_time: '22:00',
    location_name: 'Bointon',
    valid_from: '2026-08-31',
    valid_until: null,
  },
  friday: {
    team_id: '',
    season: '2026-2027',
    weekday: 5,
    start_time: '20:30',
    end_time: '22:00',
    location_name: 'Palais',
    valid_from: '2026-08-31',
    valid_until: null,
  },
}

function isExactApprovedSlot(slot: SlotRow, key: ApprovedSlotKey) {
  const approved = approvedSlots[key]
  return slot.is_active === true &&
    slot.season === approved.season &&
    slot.weekday === approved.weekday &&
    slot.start_time.slice(0, 5) === approved.start_time &&
    slot.end_time.slice(0, 5) === approved.end_time &&
    slot.location_name?.trim().toLocaleLowerCase('fr') === approved.location_name?.toLocaleLowerCase('fr') &&
    slot.valid_from === approved.valid_from &&
    slot.valid_until === null
}

export function classifyRf3SchedulePrecheck(input: Omit<Rf3SchedulePrecheck, 'state'>): Rf3SchedulePrecheck {
  const integrityValid = input.teamCount === 1 &&
    input.playerCount === 7 &&
    input.membershipCount === 7 &&
    input.activeHeadCoachCount === 1

  if (!integrityValid) return { ...input, state: 'ERROR' }
  if (
    input.exactWednesdayCount > 1 ||
    input.exactFridayCount > 1 ||
    input.unexpectedRf3SlotCount > 0 ||
    input.facilityConflictCount > 0
  ) return { ...input, state: 'CONFLICT' }
  if (input.exactWednesdayCount === 1 && input.exactFridayCount === 1) {
    return { ...input, state: 'ALREADY_INITIALIZED' }
  }
  if (input.exactWednesdayCount + input.exactFridayCount === 1) {
    return { ...input, state: 'PARTIAL' }
  }
  return { ...input, state: 'READY' }
}

async function resolveCanonicalTeam(): Promise<TeamRow> {
  const { data, error } = await supabase
    .from('teams')
    .select('id,head_coach_id')
    .eq('name', 'RF3 - SF')
    .eq('season', '2026-2027')
    .eq('category', 'Seniors')
    .eq('level', 'RF3')
    .is('archived_at', null)

  if (error || !data || data.length !== 1) throw new Error('TEAM_INTEGRITY')
  return data[0] as TeamRow
}

async function precheck(): Promise<Rf3SchedulePrecheck> {
  let team: TeamRow
  try {
    team = await resolveCanonicalTeam()
  } catch {
    return classifyRf3SchedulePrecheck({
      teamCount: 0,
      playerCount: 0,
      membershipCount: 0,
      activeHeadCoachCount: 0,
      exactWednesdayCount: 0,
      exactFridayCount: 0,
      unexpectedRf3SlotCount: 0,
      facilityConflictCount: 0,
    })
  }

  const [membershipsResponse, headCoachResponse, rf3SlotsResponse, activeSlotsResponse] = await Promise.all([
    supabase.from('team_memberships').select('player_id').eq('team_id', team.id).eq('season', '2026-2027').eq('status', 'active'),
    team.head_coach_id
      ? supabase.from('profiles').select('id').eq('id', team.head_coach_id).eq('is_active', true).eq('profile_status', 'active')
      : Promise.resolve({ data: [], error: null }),
    supabase.from('training_slots').select('id,team_id,season,weekday,start_time,end_time,location_name,valid_from,valid_until,is_active').eq('team_id', team.id),
    supabase.from('training_slots').select('id,team_id,season,weekday,start_time,end_time,location_name,valid_from,valid_until,is_active').eq('is_active', true),
  ])

  const firstError = membershipsResponse.error || headCoachResponse.error || rf3SlotsResponse.error || activeSlotsResponse.error
  if (firstError) throw new Error('PRECHECK_UNAVAILABLE')

  const memberships = (membershipsResponse.data || []) as MembershipRow[]
  const playerIds = [...new Set(memberships.map((item) => item.player_id))]
  const playersResponse = playerIds.length
    ? await supabase.from('players').select('id').in('id', playerIds).is('archived_at', null).is('deleted_at', null)
    : { data: [], error: null }
  if (playersResponse.error) throw new Error('PRECHECK_UNAVAILABLE')

  const rf3Slots = (rf3SlotsResponse.data || []) as SlotRow[]
  const activeSlots = (activeSlotsResponse.data || []) as SlotRow[]
  const exactWednesday = rf3Slots.filter((slot) => isExactApprovedSlot(slot, 'wednesday'))
  const exactFriday = rf3Slots.filter((slot) => isExactApprovedSlot(slot, 'friday'))
  const exactIds = new Set([...exactWednesday, ...exactFriday].map((slot) => slot.id))
  const proposedWednesday = { ...approvedSlots.wednesday, team_id: team.id }
  const proposedFriday = { ...approvedSlots.friday, team_id: team.id }
  const facilityConflicts = activeSlots.filter((slot) =>
    !exactIds.has(slot.id) &&
    (slotsConflict(slot, proposedWednesday) || slotsConflict(slot, proposedFriday)),
  )

  return classifyRf3SchedulePrecheck({
    teamCount: 1,
    playerCount: (playersResponse.data || []).length,
    membershipCount: memberships.length,
    activeHeadCoachCount: (headCoachResponse.data || []).length,
    exactWednesdayCount: exactWednesday.length,
    exactFridayCount: exactFriday.length,
    unexpectedRf3SlotCount: rf3Slots.filter((slot) => !exactIds.has(slot.id)).length,
    facilityConflictCount: facilityConflicts.length,
  })
}

type SaveApprovedSlot = typeof saveTrainingSlot

export async function createApprovedScheduleForTeam(
  teamId: string,
  saveSlot: SaveApprovedSlot = saveTrainingSlot,
): Promise<Rf3ScheduleWriteResult> {
  try {
    const response = await saveSlot({ ...approvedSlots.wednesday, team_id: teamId })
    if (response.conflicts.length) return { status: 'FIRST_FAILED', created: [], failed: 'wednesday' }
  } catch {
    return { status: 'FIRST_FAILED', created: [], failed: 'wednesday' }
  }

  try {
    const response = await saveSlot({ ...approvedSlots.friday, team_id: teamId })
    if (response.conflicts.length) return { status: 'PARTIAL', created: ['wednesday'], failed: 'friday' }
  } catch {
    return { status: 'PARTIAL', created: ['wednesday'], failed: 'friday' }
  }

  return { status: 'TWO_CREATED', created: ['wednesday', 'friday'] }
}

async function createApprovedSchedule(): Promise<Rf3ScheduleWriteResult> {
  const team = await resolveCanonicalTeam()
  return createApprovedScheduleForTeam(team.id)
}

export const rf3ScheduleInitializationService = {
  precheck,
  createApprovedSchedule,
}

export const rf3ApprovedSchedule = approvedSlots
