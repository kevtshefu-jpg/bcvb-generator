import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { createSessionReadService } from './sessionService'

function envFile(path: string) {
  return Object.fromEntries(readFileSync(path, 'utf8').split(/\r?\n/).flatMap((line) => {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) return []
    const index = trimmed.indexOf('=')
    return [[trimmed.slice(0, index), trimmed.slice(index + 1).replace(/^['"]|['"]$/g, '')]]
  }))
}

describe('sessionService contre Supabase local', () => {
  it('lit réellement la fixture riche sans aucune mutation serveur', async () => {
    const env = envFile(`${process.cwd()}/.env.rls.local`)
    expect(env.RLS_TEST_ENVIRONMENT).toBe('local')
    expect(env.SUPABASE_URL).toMatch(/^http:\/\/(127\.0\.0\.1|localhost):/)
    const fixtureState = JSON.parse(readFileSync(`${process.cwd()}/.rls-test-fixtures.json`, 'utf8')) as {
      accounts: { member: { email: string; password: string } }
      fixtures: { sessionRichA: string; richBlockFirst: string; richBlockSecond: string }
    }
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } })
    const { error: authError } = await client.auth.signInWithPassword(fixtureState.accounts.member)
    expect(authError).toBeNull()

    const before = await client.from('sessions').select('version,updated_at').eq('id', fixtureState.fixtures.sessionRichA).single()
    expect(before.error).toBeNull()
    const session = await createSessionReadService(client).getSessionById(fixtureState.fixtures.sessionRichA)
    const after = await client.from('sessions').select('version,updated_at').eq('id', fixtureState.fixtures.sessionRichA).single()

    expect(session.id).toBe(fixtureState.fixtures.sessionRichA)
    expect(session.version).toBe(7)
    expect(session.tags.sort()).toEqual(['fixture-read', 'fixture-rich'])
    expect(session.situations.map(({ id }) => id)).toEqual([fixtureState.fixtures.richBlockFirst, fixtureState.fixtures.richBlockSecond])
    const court = session.situations[0]?.courtFrames[0]
    expect(court?.id).toBe('court-server-1')
    expect(court?.objects.map(({ id, type }) => [id, type])).toEqual([
      ['attack-server-1', 'offense_player'], ['defense-server-1', 'defense_player'], ['ball-server-1', 'ball'],
    ])
    expect(court?.arrows).toEqual([expect.objectContaining({ id: 'arrow-server-1', type: 'arrow_dribble' })])
    expect(session.objectives).toEqual(['Objectif de test explicitement défini'])
    expect(session.equipment).toEqual(['Matériel de test'])
    expect(session.notes).toBe('Notes de fixture')
    expect(after.error).toBeNull()
    expect(after.data).toEqual(before.data)
  })
})
