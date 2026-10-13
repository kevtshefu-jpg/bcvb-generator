import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { createSessionWriteService, SessionWriteConflictError } from './sessionWriteService'
import { createSession, createSituation } from './sessionModels'
import { duplicateSession } from './sessionStorage'
import { ensurePersistentSituationIds, mapBuilderSessionToWritePayload } from './sessionBuilderServerAdapter'

function localEnvironment() {
  const env = process.env.RLS_TEST_ENVIRONMENT === 'local' && process.env.SUPABASE_URL
    ? process.env
    : Object.fromEntries(readFileSync(`${process.cwd()}/.env.rls.local`, 'utf8')
      .split(/\r?\n/).flatMap((line) => {
        const value = line.trim()
        if (!value || value.startsWith('#') || !value.includes('=')) return []
        const index = value.indexOf('=')
        return [[value.slice(0, index), value.slice(index + 1).replace(/^['"]|['"]$/g, '')]]
      }))
  expect(env.RLS_TEST_ENVIRONMENT).toBe('local')
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error('Clés Supabase local manquantes')
  expect(new URL(env.SUPABASE_URL).hostname).toMatch(/^(localhost|127\.0\.0\.1)$/)
  return { SUPABASE_URL: env.SUPABASE_URL, SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY }
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
  it('refuse une version obsolète de la copie sans altérer source et copie', async () => {
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
    const source = await service.createSessionDraft({
      teamId: fixture.fixtures.teamA,
      coachId: fixture.accounts.coachA.id,
      ...mapBuilderSessionToWritePayload(ensurePersistentSituationIds(createSession({
        title: 'Source protégée conflit', teamId: fixture.fixtures.teamA,
        visibility: 'private', durationMinutes: 15,
        situations: [createSituation({ title: 'Test conflit', durationMinutes: 15 })],
      }), randomUUID)),
    })
    const copyDraft = ensurePersistentSituationIds(duplicateSession(source), randomUUID)
    const copy = await service.createSessionDraft({
      teamId: fixture.fixtures.teamA, coachId: fixture.accounts.coachA.id,
      ...mapBuilderSessionToWritePayload(copyDraft),
    })
    const updated = await service.saveSessionDraft({
      sessionId: copy.id, expectedVersion: 1,
      ...mapBuilderSessionToWritePayload({ ...copy, title: 'Copie version actuelle' }),
    })
    expect(updated.version).toBe(2)
    await expect(service.saveSessionDraft({
      sessionId: copy.id, expectedVersion: 1,
      ...mapBuilderSessionToWritePayload({ ...copy, title: 'Écrasement obsolète refusé' }),
    })).rejects.toBeInstanceOf(SessionWriteConflictError)

    const result = await client.from('sessions').select('id,title,version')
      .in('id', [source.id, copy.id])
    expect(result.error).toBeNull()
    expect(result.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: source.id, title: source.title, version: source.version }),
      expect.objectContaining({ id: copy.id, title: 'Copie version actuelle', version: 2 }),
    ]))
  }, 20_000)

  it('refuse à un coach extérieur la modification d’une copie privée', async () => {
    const env = localEnvironment()
    const fixture = JSON.parse(readFileSync(`${process.cwd()}/.rls-test-fixtures.json`, 'utf8')) as {
      accounts: {
        coachA: { id: string; email: string; password: string }
        coachB: { id: string; email: string; password: string }
      }
      fixtures: { teamA: string }
    }
    const clientA = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const clientB = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    expect((await clientA.auth.signInWithPassword(fixture.accounts.coachA)).error).toBeNull()
    expect((await clientB.auth.signInWithPassword(fixture.accounts.coachB)).error).toBeNull()
    const serviceA = createSessionWriteService(clientA)
    const serviceB = createSessionWriteService(clientB)
    const source = await serviceA.createSessionDraft({
      teamId: fixture.fixtures.teamA, coachId: fixture.accounts.coachA.id,
      ...mapBuilderSessionToWritePayload(ensurePersistentSituationIds(createSession({
        title: 'Source privée autorisation', teamId: fixture.fixtures.teamA,
        visibility: 'private', durationMinutes: 10,
        situations: [createSituation({ title: 'Bloc privé', durationMinutes: 10 })],
      }), randomUUID)),
    })
    const copy = await serviceA.createSessionDraft({
      teamId: fixture.fixtures.teamA, coachId: fixture.accounts.coachA.id,
      ...mapBuilderSessionToWritePayload(ensurePersistentSituationIds(duplicateSession(source), randomUUID)),
    })
    await expect(serviceB.saveSessionDraft({
      sessionId: copy.id, expectedVersion: 1,
      ...mapBuilderSessionToWritePayload({ ...copy, title: 'Modification extérieure refusée' }),
    })).rejects.toThrow()
    const result = await clientA.from('sessions').select('id,title,version').eq('id', copy.id).single()
    expect(result.error).toBeNull()
    expect(result.data).toMatchObject({ id: copy.id, title: copy.title, version: 1 })
  }, 20_000)

  it('refuse une soumission à durée incohérente et accepte la version équilibrée', async () => {
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
    const draft = ensurePersistentSituationIds(createSession({
      title: 'Contrôle de durée serveur', teamId: fixture.fixtures.teamA,
      coachId: fixture.accounts.coachA.id, visibility: 'private',
      durationMinutes: 30,
      situations: [createSituation({ title: 'Bloc partiel', durationMinutes: 20 })],
    }), randomUUID)
    const saved = await service.createSessionDraft({
      teamId: fixture.fixtures.teamA, coachId: fixture.accounts.coachA.id,
      ...mapBuilderSessionToWritePayload(draft),
    })
    await expect(service.submitSessionForReview({ sessionId: saved.id, expectedVersion: 1 }))
      .rejects.toThrow()
    const unchanged = await client.from('sessions').select('status,version').eq('id', saved.id).single()
    expect(unchanged.error).toBeNull()
    expect(unchanged.data).toMatchObject({ status: 'draft', version: 1 })

    const corrected = await service.saveSessionDraft({
      sessionId: saved.id, expectedVersion: 1,
      ...mapBuilderSessionToWritePayload({
        ...saved,
        situations: saved.situations.map((item) => ({ ...item, durationMinutes: 30 })),
      }),
    })
    expect(corrected.version).toBe(2)
    const submitted = await service.submitSessionForReview({ sessionId: saved.id, expectedVersion: 2 })
    expect(submitted).toMatchObject({ status: 'to_review', version: 3 })
  }, 20_000)

  it('empêche la publication d’une séance héritée incohérente sans altérer son statut', async () => {
    const env = localEnvironment()
    const privilegedKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!privilegedKey) throw new Error('Clé service-role Supabase local manquante')
    const fixture = JSON.parse(readFileSync(`${process.cwd()}/.rls-test-fixtures.json`, 'utf8')) as {
      accounts: {
        coachA: { id: string; email: string; password: string }
        admin: { email: string; password: string }
      }
      fixtures: { teamA: string }
    }
    const client = (key: string) => createClient(env.SUPABASE_URL, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const coachClient = client(env.SUPABASE_ANON_KEY)
    const adminClient = client(env.SUPABASE_ANON_KEY)
    const privileged = client(privilegedKey)
    expect((await coachClient.auth.signInWithPassword(fixture.accounts.coachA)).error).toBeNull()
    expect((await adminClient.auth.signInWithPassword(fixture.accounts.admin)).error).toBeNull()
    const coach = createSessionWriteService(coachClient)
    const admin = createSessionWriteService(adminClient)
    const builder = ensurePersistentSituationIds(createSession({
      title: 'Publication héritée contrôle durée', teamId: fixture.fixtures.teamA,
      coachId: fixture.accounts.coachA.id, visibility: 'team', durationMinutes: 30,
      situations: [createSituation({ title: 'Bloc conforme', durationMinutes: 30 })],
    }), randomUUID)
    const draft = await coach.createSessionDraft({
      teamId: fixture.fixtures.teamA, coachId: fixture.accounts.coachA.id,
      ...mapBuilderSessionToWritePayload(builder),
    })
    const review = await coach.submitSessionForReview({ sessionId: draft.id, expectedVersion: 1 })
    expect(review).toMatchObject({ status: 'to_review', version: 2 })
    // Simule un ancien enregistrement à relire, déjà incohérent lors de son import historique.
    const tampered = await privileged.from('session_situations')
      .update({ duration_minutes: 20 }).eq('session_id', draft.id)
    expect(tampered.error).toBeNull()
    await expect(admin.publishSession({
      sessionId: draft.id, expectedVersion: 2, visibility: 'club',
    })).rejects.toThrow()
    const afterReject = await privileged.from('sessions')
      .select('status,version,visibility').eq('id', draft.id).single()
    expect(afterReject.error).toBeNull()
    expect(afterReject.data).toMatchObject({ status: 'to_review', version: 2, visibility: 'team' })

    const corrected = await privileged.from('session_situations')
      .update({ duration_minutes: 30 }).eq('session_id', draft.id)
    expect(corrected.error).toBeNull()
    const published = await admin.publishSession({
      sessionId: draft.id, expectedVersion: 2, visibility: 'club',
    })
    expect(published).toMatchObject({ status: 'published', version: 3, visibility: 'club' })
  }, 20_000)

})
