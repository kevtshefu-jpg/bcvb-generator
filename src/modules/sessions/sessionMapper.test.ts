import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { mapSessionRowToDomain, mapSessionSituationRowToDomain, mapSituationRowToDomain, SessionMappingError, type SessionRow, type SessionSituationRow, type SituationRow } from './sessionMapper'
import { validateSessionDuration } from './sessionUtils'

const richFrame = {
  id: 'court-server-1', title: 'Terrain test', courtType: 'half', intent: 'Fixture technique', notes: '',
  objects: [
    { id: 'attack-server-1', type: 'offense_player', x: 1, y: 2, label: 'A' },
    { id: 'defense-server-1', type: 'defense_player', x: 3, y: 4, label: 'D' },
    { id: 'ball-server-1', type: 'ball', x: 2, y: 2, label: 'B' },
  ],
  arrows: [{ id: 'arrow-server-1', type: 'arrow_pass', fromX: 1, fromY: 2, toX: 3, toY: 4 }],
  zones: [{ id: 'zone-server-1', x: 0, y: 0, width: 2, height: 2, label: 'Zone' }],
}

const sessionRow = (overrides: Partial<SessionRow> = {}): SessionRow => ({
  id: '50000000-0000-4000-8000-000000000010', title: 'Titre SQL', category: 'U15', level: 'confirmé', theme: 'Passe', sub_theme: 'Fixation-passe',
  team_id: '10000000-0000-4000-8000-000000000001', coach_id: 'coach-server', owner_id: 'owner-server', visibility: 'club', status: 'published',
  duration_minutes: 30, expected_players: 8, source_type: 'manual', source_file_name: 'source.md', source_raw_text: 'source brute', source_text: 'source extraite',
  quality_score: 84, created_at: '2026-08-01T10:00:00Z', updated_at: '2026-08-02T10:00:00Z', published_at: '2026-08-03T10:00:00Z',
  archived_at: null, deleted_at: null, deleted_by: null, version: 7,
  content_json: {
    title: 'Titre JSON ignoré', category: 'U7', durationMinutes: 120, expectedPlayers: 12, visibility: 'private', status: 'draft', ownerId: 'json-owner', coachId: 'json-coach',
    objectives: ['Objectif fixture'], equipment: ['Matériel fixture'], intensityLevel: 'high', notes: 'Notes riches', unknownFutureField: { preservedByServer: true },
    metricsSummary: [{ id: 'metric-server-1', label: 'Réussites', type: 'count', target: '5', observed: '', unit: '', notes: '' }],
  },
  ...overrides,
})

const blockRow = (overrides: Partial<SessionSituationRow> = {}): SessionSituationRow => ({
  id: '61000000-0000-4000-8000-000000000010', session_id: sessionRow().id, order_index: 2, title: 'Bloc SQL', duration_minutes: 20,
  theme: 'Passe', sub_theme: 'Fixation-passe', pedagogical_phase: 'je-m-exerce', created_at: '2026-08-01T10:00:00Z', updated_at: '2026-08-02T10:00:00Z',
  content_json: { title: 'Bloc JSON ignoré', durationMinutes: 99, objective: 'Objectif riche', metrics: [{ id: 'metric-block-1' }], courtFrames: [richFrame], commonMistakes: ['Erreur fixture'], coachCorrections: ['Correction fixture'], matchTransfer: 'Transfert fixture' },
  ...overrides,
})

const situationRow = (overrides: Partial<SituationRow> = {}): SituationRow => ({
  id: '60000000-0000-4000-8000-000000000010', session_id: null, team_id: sessionRow().team_id, title: 'Situation SQL', category: 'U15', theme: 'Passe', sub_theme: 'Fixation-passe',
  level: 'confirmé', duration_minutes: 20, player_count: '8', visibility: 'club', status: 'published', quality_score: 81,
  created_by: 'creator-server', owner_id: 'owner-server', created_at: '2026-08-01T10:00:00Z', updated_at: '2026-08-02T10:00:00Z',
  published_at: '2026-08-03T10:00:00Z', archived_at: null, deleted_at: null, version: 4,
  content_json: { title: 'JSON ignoré', visibility: 'private', status: 'draft', objective: 'Bibliothèque riche', courtFrames: [richFrame] },
  ...overrides,
})

describe('sessionMapper Supabase read-only', () => {
  it('préserve les colonnes SQL autoritaires, les identités, timestamps, version et contenu riche', () => {
    const result = mapSessionRowToDomain(sessionRow(), [blockRow()], ['tag-a', 'tag-b'])
    expect(result).toMatchObject({ id: sessionRow().id, title: 'Titre SQL', category: 'U15', durationMinutes: 30, expectedPlayers: 8, status: 'published', visibility: 'club', teamId: sessionRow().team_id, coachId: 'coach-server', ownerId: 'owner-server', createdAt: sessionRow().created_at, updatedAt: sessionRow().updated_at, publishedAt: sessionRow().published_at, version: 7, objectives: ['Objectif fixture'], equipment: ['Matériel fixture'], notes: 'Notes riches', tags: ['tag-a', 'tag-b'] })
    expect(result.metricsSummary[0]?.id).toBe('metric-server-1')
  })

  it('ignore content_json.situations et trie la table canonique session_situations', () => {
    const content_json = { ...(sessionRow().content_json as object), situations: [{ id: 'legacy-invented' }] }
    const first = blockRow({ id: 'block-first', order_index: 1, title: 'Premier' })
    const result = mapSessionRowToDomain(sessionRow({ content_json }), [blockRow(), first])
    expect(result.situations.map(({ id }) => id)).toEqual(['block-first', blockRow().id])
    expect(result.situations.some(({ id }) => id === 'legacy-invented')).toBe(false)
  })

  it('préserve le bloc, son ordre, son JSON riche et tous les IDs terrain sans en créer', () => {
    const result = mapSessionSituationRowToDomain(blockRow())
    expect(result).toMatchObject({ id: blockRow().id, order: 2, title: 'Bloc SQL', durationMinutes: 20, theme: 'Passe', objective: 'Objectif riche', matchTransfer: 'Transfert fixture' })
    expect(result.courtFrames).toEqual([richFrame])
    expect(result.courtFrames[0]?.objects.map(({ id }) => id)).toEqual(['attack-server-1', 'defense-server-1', 'ball-server-1'])
    expect(result.courtFrames[0]?.arrows[0]?.id).toBe('arrow-server-1')
    expect(result.courtFrames[0]?.zones[0]?.id).toBe('zone-server-1')
    expect(mapSessionSituationRowToDomain(blockRow({ content_json: {} })).courtFrames).toEqual([])
  })

  it('reconstruit une situation autonome avec priorité SQL sans fallback sportif', () => {
    const result = mapSituationRowToDomain(situationRow())
    expect(result).toMatchObject({ id: situationRow().id, title: 'Situation SQL', category: 'U15', ownerId: 'owner-server', createdBy: 'creator-server', visibility: 'club', status: 'published', version: 4, objective: 'Bibliothèque riche' })
    expect(result.courtFrames).toEqual([richFrame])
  })

  it('échoue explicitement si une colonne obligatoire est absente et ne fabrique aucune valeur', () => {
    expect(() => mapSessionRowToDomain(sessionRow({ expected_players: null as unknown as number }))).toThrow(SessionMappingError)
    expect(() => mapSessionRowToDomain(sessionRow({ category: null as unknown as string }))).toThrow(SessionMappingError)
    expect(() => mapSituationRowToDomain(situationRow({ content_json: 'invalide' }))).toThrow(/incompatible/)
  })

  it('préserve explicitement les absences sans inventer false, zéro, private ou draft', () => {
    const session = mapSessionRowToDomain(sessionRow({ content_json: {} }))
    const block = mapSessionSituationRowToDomain(blockRow({ content_json: {} }))
    const situation = mapSituationRowToDomain(situationRow({ content_json: {} }))
    expect(session.transformedFromSource).toBeUndefined()
    expect(block.visibility).toBeUndefined()
    expect(block.status).toBeUndefined()
    expect(block.qualityScore).toBeUndefined()
    expect(situation.order).toBeUndefined()
    expect(block.courtFrames).toEqual([])
  })

  it('accepte un champ JSON inconnu et refuse les identités internes absentes', () => {
    expect(() => mapSessionRowToDomain(sessionRow())).not.toThrow()
    expect(() => mapSessionSituationRowToDomain(blockRow({ content_json: { courtFrames: [{ title: 'sans id' }] } }))).toThrow(/identifiant serveur/)
  })

  it('valide la durée sans corriger les valeurs serveur', () => {
    const coherent = mapSessionRowToDomain(sessionRow({ duration_minutes: 20 }), [blockRow({ duration_minutes: 20 })])
    const incoherent = mapSessionRowToDomain(sessionRow({ duration_minutes: 30 }), [blockRow({ duration_minutes: 20 })])
    expect(validateSessionDuration(coherent)).toMatchObject({ valid: true, announcedMinutes: 20, calculatedMinutes: 20 })
    expect(validateSessionDuration(incoherent)).toMatchObject({ valid: false, announcedMinutes: 30, calculatedMinutes: 20, differenceMinutes: -10 })
    expect(incoherent.durationMinutes).toBe(30)
  })

  it('maintient le service strictement read-only et sans factory à fallback', () => {
    const source = readFileSync(`${process.cwd()}/src/modules/sessions/sessionService.ts`, 'utf8')
    expect(source).not.toMatch(/\.(insert|update|upsert|delete)\s*\(/)
    expect(source).not.toMatch(/\b(saveSession|publishSession|archiveSession|deleteSession|createSession)\s*\(/)
    expect(source).not.toMatch(/\b(createCourtFrame|createSession|createSituation|normalizeSession)\s*\(/)
    expect(source).toContain(".is('deleted_at', null)")
  })
})
