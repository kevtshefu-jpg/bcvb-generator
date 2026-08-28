import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { createSessionWriteService, SessionWriteConflictError, type SessionDraftPayload } from './sessionWriteService'

function envFile(path: string) {
  return Object.fromEntries(readFileSync(path, 'utf8').split(/\r?\n/).flatMap((line) => {
    const value = line.trim(); if (!value || value.startsWith('#') || !value.includes('=')) return []
    const index = value.indexOf('='); return [[value.slice(0, index), value.slice(index + 1).replace(/^['"]|['"]$/g, '')]]
  }))
}

const payload = (title: string): SessionDraftPayload => ({
  title, category: 'U15', level: 'fixture', theme: 'Passe', sub_theme: 'Fixation-passe', visibility: 'private', duration_minutes: 30,
  expected_players: 8, source_type: 'manual', source_file_name: '', source_raw_text: '', source_text: '', content_json: { objectives: ['Objectif fixture write'] }, quality_score: 70,
})
const blocks = () => [
  { id: randomUUID(), order_index: 1, title: 'Bloc 1', duration_minutes: 10, theme: 'Passe', sub_theme: '', pedagogical_phase: 'je-m-exerce', content_json: {} },
  { id: randomUUID(), order_index: 2, title: 'Bloc 2', duration_minutes: 20, theme: 'Passe', sub_theme: '', pedagogical_phase: 'je-m-exerce', content_json: {} },
]

describe('sessionWriteService contre Supabase local', () => {
  it('crée, sauvegarde, détecte le conflit et garantit le rollback atomique', async () => {
    const env = envFile(`${process.cwd()}/.env.rls.local`)
    expect(env.RLS_TEST_ENVIRONMENT).toBe('local')
    const fixture = JSON.parse(readFileSync(`${process.cwd()}/.rls-test-fixtures.json`, 'utf8')) as { accounts: { coachA: { id: string; email: string; password: string } }; fixtures: { teamA: string } }
    const makeClient = async () => {
      const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
      expect((await client.auth.signInWithPassword(fixture.accounts.coachA)).error).toBeNull(); return client
    }
    const clientA = await makeClient(); const clientB = await makeClient()
    const serviceA = createSessionWriteService(clientA); const serviceB = createSessionWriteService(clientB)
    const initialBlocks = blocks()
    const created = await serviceA.createSessionDraft({ teamId: fixture.fixtures.teamA, coachId: fixture.accounts.coachA.id, session: payload('Draft transactionnel'), situations: initialBlocks, tags: [' alpha ', 'beta', 'alpha'] })
    expect(created).toMatchObject({ status: 'draft', version: 1, ownerId: fixture.accounts.coachA.id, tags: ['alpha', 'beta'] })
    expect(created.situations.map(({ id }) => id)).toEqual(initialBlocks.map(({ id }) => id))
    const initialUpdatedAt = created.updatedAt

    const savedA = await serviceA.saveSessionDraft({ sessionId: created.id, expectedVersion: 1, session: payload('État A'), situations: blocks().reverse().map((item, index) => ({ ...item, order_index: index + 1 })), tags: ['gamma'] })
    expect(savedA.version).toBe(2); expect(savedA.title).toBe('État A'); expect(savedA.updatedAt).not.toBe(initialUpdatedAt)
    const readState = (id: string) => clientA.from('sessions').select('title,version,updated_at,session_situations(id,order_index),session_tags(tag)').eq('id', id).single()
    const stateA = await readState(created.id)

    await expect(serviceB.saveSessionDraft({ sessionId: created.id, expectedVersion: 1, session: payload('État B obsolète'), situations: blocks(), tags: ['stale'] })).rejects.toBeInstanceOf(SessionWriteConflictError)
    expect((await readState(created.id)).data).toEqual(stateA.data)

    const otherBlocks = blocks()
    const createdB = await serviceA.createSessionDraft({ teamId: fixture.fixtures.teamA, coachId: fixture.accounts.coachA.id, session: payload('Draft B'), situations: otherBlocks, tags: ['session-b'] })
    const stateB = await readState(createdB.id)
    const saveArgs = (sessionPayload: object, situations: unknown[], tags: unknown[]) => ({
      target_session_id: created.id, expected_version: 2, session_payload: sessionPayload, situations_payload: situations, tags_payload: tags,
    })
    const foreignId = await clientA.rpc('save_session_draft', saveArgs(payload('Injection refusée'), [{ ...blocks()[0], id: otherBlocks[0].id }], ['foreign']))
    expect(foreignId.error?.code).toBe('22023')
    expect((await readState(created.id)).data).toEqual(stateA.data)
    expect((await readState(createdB.id)).data).toEqual(stateB.data)

    const forbiddenChild = await clientA.rpc('save_session_draft', saveArgs(payload('Clé refusée'), [{ ...blocks()[0], status: 'present' }], ['forbidden']))
    expect(forbiddenChild.error?.code).toBe('22023')
    expect((await readState(created.id)).data).toEqual(stateA.data)

    const invalidTag = await clientA.rpc('save_session_draft', saveArgs(payload('Tag refusé'), blocks(), ['attaque', 42, 'défense']))
    expect(invalidTag.error?.code).toBe('22023')
    expect((await readState(created.id)).data).toEqual(stateA.data)

    const { title: _omitted, ...missingTitle } = payload('Champ absent')
    const missingParent = await clientA.rpc('save_session_draft', saveArgs(missingTitle, blocks(), ['missing']))
    expect(missingParent.error?.code).toBe('22023')
    expect((await readState(created.id)).data).toEqual(stateA.data)

    const invalidBlocks = blocks().map((item) => ({ ...item, order_index: 1 }))
    await expect(serviceA.saveSessionDraft({ sessionId: created.id, expectedVersion: 2, session: payload('Ne doit pas persister'), situations: invalidBlocks, tags: ['rollback'] })).rejects.toThrow()
    expect((await readState(created.id)).data).toEqual(stateA.data)

    const directVersion = await clientA.from('sessions').update({ version: 999 }).eq('id', created.id)
    expect(directVersion.error?.code).toBe('42501')
  }, 15_000)
})
