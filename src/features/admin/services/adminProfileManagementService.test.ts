import { beforeEach, describe, expect, it, vi } from 'vitest'

const invoke = vi.hoisted(() => vi.fn())

vi.mock('../../../lib/supabase', () => ({
  supabase: {
    functions: { invoke },
  },
}))

import {
  deactivateProfile,
  reactivateProfile,
  updateProfileRole,
} from './adminProfileManagementService'

describe('contrat du service de gestion des profils', () => {
  beforeEach(() => {
    invoke.mockReset()
    invoke.mockResolvedValue({ data: { ok: true }, error: null })
  })

  it('transmet le rôle validé au contrat update_role', async () => {
    await updateProfileRole('profile-1', 'coach')

    expect(invoke).toHaveBeenCalledWith('admin-delete-profile', {
      body: { profileId: 'profile-1', action: 'update_role', role: 'coach' },
    })
  })

  it('conserve les contrats deactivate et reactivate', async () => {
    await deactivateProfile('profile-1')
    await reactivateProfile('profile-1')

    expect(invoke).toHaveBeenNthCalledWith(1, 'admin-delete-profile', {
      body: { profileId: 'profile-1', action: 'deactivate' },
    })
    expect(invoke).toHaveBeenNthCalledWith(2, 'admin-delete-profile', {
      body: { profileId: 'profile-1', action: 'reactivate' },
    })
  })

  it('refuse tout faux succès renvoyé par la fonction', async () => {
    invoke.mockResolvedValue({ data: { ok: false, error: 'Action refusée.' }, error: null })

    await expect(updateProfileRole('profile-1', 'coach')).rejects.toThrow('Action refusée.')
  })
})
