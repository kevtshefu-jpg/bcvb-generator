import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { createSessionWriteService } from './sessionWriteService'
import { createSession, createSituation } from './sessionModels'
import { duplicateSession } from './sessionStorage'
import { ensurePersistentSituationIds, mapBuilderSessionToWritePayload } from './sessionBuilderServerAdapter'

function localEnvironment() {
  const env = Object.fromEntries(readFileSync(`${process.cwd()}/.env.rls.local`, 'utf8')
    .split(/\r?\n/).flatMap((line) => {
      const value = line.trim()
      if (!value || value.startsWith('#') || !value.includes('=')) return []
      const index = value.indexOf('=')
      return [[value.slice(0, index), value.slice(index + 1).replace(/^['"]|['"]$/g, '')]]
    }))
  expect(env.RLS_TEST_ENVIRONMENT).toBe('local')
  expect(new URL(env.SUPABASE_URL).hostname).toMatch(/^(localhost|127\.0\.0\.1)$/)
  return env
}

describe('duplication de séance — intégrité Supabase locale', () => {
  it('crée un nouveau brouillon sans modifier la séance source ni ses situations', async () => {
    const env = localEnvironment()
    const fixture = JSON.parse(readFileSync(`${process.cwd()}/.rls-test-fixtures.json`, 'utf8')) as {
      accounts: { coachA: { id: string; email: string; password: string } }
      fixtures: { teamA: string }
    }
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    expect((await client.auth.signInWithPassword(fixture.accounts.coachA)).error).toBeNull()
    const service = createSessionWriteService(client)
    const sourceDraft = ensurePersistentSituationIds(createSession({
      title: 'Source duplication locale',
      teamId: fixture.fixtures.teamA,
      coachId: fixture.accounts.coachA.id,
      ownerId: fixture.accounts.coachA.id,
      visibility: 'private',
      durationMinutes: 20,
      situations: [createSituation({ title: 'Situation source', durationMinutes: 20 })],
    }), randomUUID)
    const original = await service.createSessionDraft({
      teamId: sourceDraft.teamId,
      coachId: fixture.accounts.coachA.id,
      ...mapBuilderSessionToWritePayload(sourceDraft),
    })
    const snapshot = structuredClone(original)
    const copyDraft = ensurePersistentSituationIds(duplicateSession(original), randomUUID)
    expect(copyDraft.id).not.toBe(original.id)
    expect(copyDraft.situations[0].id).not.toBe(original.situations[0].id)
    expect(copyDraft.status).toBe('draft')

    const copy = await service.createSessionDraft({
      teamId: fixture.fixtures.teamA,
      coachId: fixture.accounts.coachA.id,
      ...mapBuilderSessionToWritePayload(copyDraft),
    })
    expect(copy.id).not.toBe(original.id)
    expect(copy.version).toBe(1)
    expect(copy.situations[0].id).not.toBe(original.situations[0].id)
    expect(copy.situations[0].courtFrames[0].objects).toEqual(original.situations[0].courtFrames[0].objects)

    const changed = { ...copy, title: 'Copie indépendante modifiée' }
    const saved = await service.saveSessionDraft({
      sessionId: copy.id,
      expectedVersion: 1,
      ...mapBuilderSessionToWritePayload(changed),
    })
    expect(saved.version).toBe(2)

    const sourceAfter = await client.from('sessions')
      .select('id,title,version,session_situations(id,title,order_index)')
      .eq('id', original.id).single()
    expect(sourceAfter.error).toBeNull()
    expect(sourceAfter.data).toMatchObject({
      id: snapshot.id,
      title: snapshot.title,
      version: snapshot.version,
    })
    expect((sourceAfter.data?.session_situations || []).map((s: { id: string }) => s.id))
      .toContain(snapshot.situations[0].id)
  }, 20_000)
})
