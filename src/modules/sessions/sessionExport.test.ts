import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSession, createSituation } from './sessionModels'
import { exportSessionToMarkdown } from './sessionExport'

describe('exportSessionToMarkdown — contrôle des durées', () => {
  let output: Blob | undefined

  beforeEach(() => {
    output = undefined
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn((blob: Blob) => { output = blob; return 'blob:bcvb-test' }),
      revokeObjectURL: vi.fn(),
    })
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  })

  it('signale les minutes non planifiées dans le fichier exporté', async () => {
    exportSessionToMarkdown(createSession({
      title: 'U9 incomplet',
      durationMinutes: 75,
      situations: [createSituation({ durationMinutes: 65 })],
    }))
    expect(output).toBeDefined()
    expect(await output!.text()).toContain('10 min non planifiées')
  })

  it('n’ajoute pas de faux avertissement à une séance équilibrée', async () => {
    exportSessionToMarkdown(createSession({
      title: 'U13 conforme',
      durationMinutes: 90,
      situations: [createSituation({ durationMinutes: 90 })],
    }))
    expect(output).toBeDefined()
    expect(await output!.text()).not.toContain('ATTENTION — Durées incohérentes')
  })
})
