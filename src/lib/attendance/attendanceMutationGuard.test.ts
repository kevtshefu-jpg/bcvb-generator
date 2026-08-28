import { describe, expect, it, vi } from 'vitest'
import { runSingleAttendanceMutation } from './attendanceMutationGuard'

describe('runSingleAttendanceMutation', () => {
  it('ne laisse partir qu’une requête pour deux appels synchrones', async () => {
    const gate = { current: false }
    let release: (() => void) | undefined
    const serverMutation = vi.fn(() => new Promise<void>((resolve) => {
      release = resolve
    }))

    const first = runSingleAttendanceMutation(gate, serverMutation)
    const second = runSingleAttendanceMutation(gate, serverMutation)

    expect(serverMutation).toHaveBeenCalledTimes(1)
    await expect(second).resolves.toBeUndefined()
    release?.()
    await first

    await runSingleAttendanceMutation(gate, serverMutation.mockResolvedValueOnce())
    expect(serverMutation).toHaveBeenCalledTimes(2)
  })

  it('libère la garde après une erreur', async () => {
    const gate = { current: false }
    await expect(runSingleAttendanceMutation(gate, async () => {
      throw new Error('réseau indisponible')
    })).rejects.toThrow('réseau indisponible')
    expect(gate.current).toBe(false)
  })
})
