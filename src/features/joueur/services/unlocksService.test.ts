import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock('../../../lib/supabase', () => ({
  supabase: { from: mocks.from },
}))

import { unlockContentForPlayer } from './unlocksService'

const saved = {
  id: 'unlock-1',
  player_id: 'player-1',
  content_id: 'content-1',
  unlocked_by: 'coach-1',
  created_at: '2026-10-21T00:00:00Z',
}

describe('unlockContentForPlayer — RLS-compatible idempotence', () => {
  beforeEach(() => mocks.from.mockReset())

  it('creates a new unlock using INSERT, never UPDATE or UPSERT', async () => {
    const single = vi.fn().mockResolvedValue({ data: saved, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    mocks.from.mockReturnValue({ insert })

    await expect(unlockContentForPlayer('player-1', 'content-1', 'coach-1')).resolves.toEqual(saved)
    expect(mocks.from).toHaveBeenCalledTimes(1)
    expect(mocks.from).toHaveBeenCalledWith('player_content_unlocks')
    expect(insert).toHaveBeenCalledWith({
      player_id: 'player-1', content_id: 'content-1', unlocked_by: 'coach-1',
    })
  })

  it('on unique conflict reads the existing row without requiring UPDATE permission', async () => {
    const insertSingle = vi.fn().mockResolvedValue({ data: null, error: { code: '23505' } })
    const existingSingle = vi.fn().mockResolvedValue({ data: saved, error: null })
    const secondEq = vi.fn().mockReturnValue({ single: existingSingle })
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq })
    const readSelect = vi.fn().mockReturnValue({ eq: firstEq })
    mocks.from
      .mockReturnValueOnce({ insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: insertSingle }) }) })
      .mockReturnValueOnce({ select: readSelect })

    await expect(unlockContentForPlayer('player-1', 'content-1')).resolves.toEqual(saved)
    expect(firstEq).toHaveBeenCalledWith('player_id', 'player-1')
    expect(secondEq).toHaveBeenCalledWith('content_id', 'content-1')
    expect(mocks.from).toHaveBeenCalledTimes(2)
  })

  it('does not swallow RLS denial or other database errors', async () => {
    const denial = { code: '42501', message: 'permission denied' }
    const single = vi.fn().mockResolvedValue({ data: null, error: denial })
    mocks.from.mockReturnValue({ insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) }) })
    await expect(unlockContentForPlayer('player-1', 'content-1')).rejects.toEqual(denial)
    expect(mocks.from).toHaveBeenCalledTimes(1)
  })

  it('does not claim success when the conflicting row is not readable', async () => {
    const denial = { code: '42501', message: 'not visible' }
    const insertSingle = vi.fn().mockResolvedValue({ data: null, error: { code: '23505' } })
    const existingSingle = vi.fn().mockResolvedValue({ data: null, error: denial })
    const secondEq = vi.fn().mockReturnValue({ single: existingSingle })
    const firstEq = vi.fn().mockReturnValue({ eq: secondEq })
    mocks.from
      .mockReturnValueOnce({ insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: insertSingle }) }) })
      .mockReturnValueOnce({ select: vi.fn().mockReturnValue({ eq: firstEq }) })

    await expect(unlockContentForPlayer('player-1', 'content-1')).rejects.toEqual(denial)
  })
})
