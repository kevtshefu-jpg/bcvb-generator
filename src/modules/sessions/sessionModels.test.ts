import { describe, expect, it } from 'vitest'
import {
  createCourtFrame,
  createSession,
  createSituation,
  emptySession,
  emptySituation,
  normalizeSession,
  normalizeSituation,
  type CourtArrow,
  type CourtObject,
  type SessionCourtFrame,
  type SessionSituation,
  type TrainingSessionV2,
} from './sessionModels'
import { transformRawTextToSession } from './sessionTransformer'
import { transformRawTextToSituation } from './importedSituationParser'
import { SESSION_TEMPLATES } from './sessionTemplates'
import { getTotalSituationDuration, validateSessionDuration } from './sessionUtils'

function expectPointWithinCourt(x: number, y: number, courtType: SessionCourtFrame['courtType']) {
  const maxX = courtType === 'full' ? 28 : 14
  expect(x).toBeGreaterThanOrEqual(0)
  expect(x).toBeLessThanOrEqual(maxX)
  expect(y).toBeGreaterThanOrEqual(0)
  expect(y).toBeLessThanOrEqual(15)
}

describe('createCourtFrame', () => {
  it('crée le socle terrain BCVB attendu avec des identifiants cohérents', () => {
    const frame = createCourtFrame()

    expect(frame.objects.map(({ type }) => type)).toEqual([
      'offense_player',
      'defense_player',
      'ball',
    ])
    expect(frame.arrows.map(({ type }) => type)).toEqual(['arrow_dribble'])
    expect(frame.zones).toEqual([])

    const ids = [frame.id, ...frame.objects.map(({ id }) => id), ...frame.arrows.map(({ id }) => id)]
    expect(ids.every(Boolean)).toBe(true)
    expect(new Set(ids).size).toBe(ids.length)
    expect(frame.objects.every(({ frameId }) => frameId === frame.id)).toBe(true)

    frame.objects.forEach(({ x, y }) => expectPointWithinCourt(x, y, frame.courtType))
    frame.arrows.forEach(({ fromX, fromY, toX, toY }) => {
      expectPointWithinCourt(fromX, fromY, frame.courtType)
      expectPointWithinCourt(toX, toY, frame.courtType)
    })
  })

  it('respecte les tableaux objects, arrows et zones explicitement fournis, même vides', () => {
    const emptyFrame = createCourtFrame({ objects: [], arrows: [], zones: [] })
    expect(emptyFrame.objects).toEqual([])
    expect(emptyFrame.arrows).toEqual([])
    expect(emptyFrame.zones).toEqual([])

    const objects: CourtObject[] = [{ id: 'object-explicit', type: 'cone', x: 2, y: 3, label: 'Plot' }]
    const arrows: CourtArrow[] = [{
      id: 'arrow-explicit',
      type: 'arrow_pass',
      fromX: 2,
      fromY: 3,
      toX: 6,
      toY: 7,
    }]
    const explicitFrame = createCourtFrame({ objects, arrows })
    expect(explicitFrame.objects).toBe(objects)
    expect(explicitFrame.arrows).toBe(arrows)
  })
})

describe('normalizeSituation', () => {
  it('conserve l’identité, les données métier, les frames et normalise les listes', () => {
    const frame = createCourtFrame({ id: 'court-existing', objects: [], arrows: [] })
    const input = {
      id: 'situation-existing',
      title: 'Lecture du close-out',
      durationMinutes: 17,
      objective: 'Attaquer le pied haut',
      equipment: 'Ballons; Plots',
      coachCues: 'Lever la tête\nChanger de rythme',
      courtFrames: [frame],
    } as unknown as Partial<SessionSituation>

    const normalized = normalizeSituation(input)
    expect(normalized).toMatchObject({
      id: 'situation-existing',
      title: 'Lecture du close-out',
      durationMinutes: 17,
      objective: 'Attaquer le pied haut',
      equipment: ['Ballons', 'Plots'],
      coachCues: ['Lever la tête', 'Changer de rythme'],
    })
    expect(normalized.courtFrames).toEqual([frame])
    expect(normalized.courtFrames[0].objects).toEqual([])
    expect(normalized.courtFrames[0].arrows).toEqual([])
  })

  it('génère un id et un terrain uniquement quand ils sont absents', () => {
    const normalized = normalizeSituation({ title: 'Sans identité' })
    expect(normalized.id).toBeTruthy()
    expect(normalized.courtFrames).toHaveLength(1)
    expect(normalizeSituation({ id: 'kept', courtFrames: [] })).toMatchObject({
      id: 'kept',
      courtFrames: [],
    })
  })
})

describe('normalizeSession', () => {
  it('conserve les données valides et normalise les listes sans perdre les situations', () => {
    const situation = createSituation({ id: 'situation-1', title: 'Bloc 1', durationMinutes: 25 })
    const input = {
      id: 'session-existing',
      title: 'Séance test',
      category: 'U15',
      status: 'validated',
      visibility: 'club_reference',
      objectives: 'Défendre; Courir',
      equipment: 'Ballons\nChasubles',
      situations: [situation],
    } as unknown as Partial<TrainingSessionV2>

    const normalized = normalizeSession(input)
    expect(normalized).toMatchObject({
      id: 'session-existing',
      title: 'Séance test',
      category: 'U15',
      status: 'validated',
      visibility: 'club_reference',
      objectives: ['Défendre', 'Courir'],
      equipment: ['Ballons', 'Chasubles'],
    })
    expect(normalized.situations).toHaveLength(1)
    expect(normalized.situations[0].id).toBe('situation-1')
  })

  it('reste stable sur un cycle create puis deux normalisations', () => {
    const created = createSession({
      id: 'session-cycle',
      title: 'Cycle stable',
      status: 'to_review',
      visibility: 'public_technicians',
      situations: [createSituation({ id: 'situation-cycle', courtFrames: [] })],
    })
    const once = normalizeSession(created)
    const twice = normalizeSession(once)
    expect(twice).toEqual(once)
    expect(twice.situations[0].courtFrames).toEqual([])
  })

  it('documente les valeurs par défaut actuelles sans les présenter comme des données importées', () => {
    const session = createSession()
    expect(session).toMatchObject({
      title: 'Séance BCVB',
      category: 'U13',
      durationMinutes: 90,
      expectedPlayers: 12,
      season: '2025-2026',
      intensityLevel: 'medium',
      status: 'draft',
      visibility: 'private',
    })
    expect(emptySituation.durationMinutes).toBe(10)
    expect(emptySession.durationMinutes).toBe(90)
  })
})

describe('durées de séance', () => {
  it('calcule la somme et signale un écart sans modifier la séance', () => {
    const session = createSession({
      durationMinutes: 60,
      situations: [
        createSituation({ durationMinutes: 20 }),
        createSituation({ durationMinutes: 25 }),
      ],
    })
    const snapshot = structuredClone(session)

    expect(getTotalSituationDuration(session)).toBe(45)
    expect(validateSessionDuration(session)).toEqual({
      announcedMinutes: 60,
      calculatedMinutes: 45,
      differenceMinutes: -15,
      valid: false,
    })
    expect(session).toEqual(snapshot)
  })

  it('valide une durée annoncée égale à la somme des situations', () => {
    const session = createSession({
      durationMinutes: 45,
      situations: [createSituation({ durationMinutes: 20 }), createSituation({ durationMinutes: 25 })],
    })
    expect(validateSessionDuration(session)).toEqual({
      announcedMinutes: 45,
      calculatedMinutes: 45,
      differenceMinutes: 0,
      valid: true,
    })
  })

  it('caractérise les écarts de durée actuels des templates sans les corriger', () => {
    const reports = Object.fromEntries(
      SESSION_TEMPLATES.map((session) => [session.category, validateSessionDuration(session)]),
    )

    expect(reports.U13).toMatchObject({ calculatedMinutes: 90, differenceMinutes: 0, valid: true })
    expect(reports.U7).toMatchObject({ calculatedMinutes: 52, differenceMinutes: -8, valid: false })
    expect(reports.U9).toMatchObject({ calculatedMinutes: 65, differenceMinutes: -10, valid: false })
    expect(reports.U11).toMatchObject({ calculatedMinutes: 73, differenceMinutes: -17, valid: false })
    expect(reports.U15).toMatchObject({ calculatedMinutes: 82, differenceMinutes: -18, valid: false })
    expect(reports.U18).toMatchObject({ calculatedMinutes: 92, differenceMinutes: -13, valid: false })
    expect(reports.Seniors).toMatchObject({ calculatedMinutes: 95, differenceMinutes: -15, valid: false })
  })
})

describe('fallbacks des transformations', () => {
  it('caractérise les données métier ajoutées par le transformeur de séance', () => {
    const session = transformRawTextToSession('Atelier sans durée ni effectif explicite mais avec une description suffisamment longue pour créer un bloc.')
    expect(session).toMatchObject({
      category: 'U13',
      theme: 'Défense Homme à Homme',
      subTheme: 'Close-out',
      durationMinutes: 15,
      expectedPlayers: 12,
      equipment: ['Ballons', 'Plots', 'Chasubles', 'Chronomètre'],
    })
    expect(session.situations[0]).toMatchObject({
      durationMinutes: 15,
      playerCount: '8 à 12',
      equipment: ['Ballons', 'Plots', 'Chasubles'],
    })
  })

  it('caractérise les données métier ajoutées par le parseur de situation', () => {
    const situation = transformRawTextToSituation('Atelier de lecture sans durée ni effectif')
    expect(situation).toMatchObject({
      category: 'U13',
      theme: 'Défense Homme à Homme',
      subTheme: 'Close-out',
      durationMinutes: 12,
      playerCount: '6 à 10',
      equipment: ['Ballons', 'Plots', 'Chasubles'],
    })
    expect(situation.courtFrames).toHaveLength(3)
  })
})
