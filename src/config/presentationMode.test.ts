import { afterEach, describe, expect, it, vi } from 'vitest'

describe('mode présentation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('est désactivé sans activation explicite', async () => {
    vi.stubEnv('VITE_ENABLE_PRESENTATION_MODE', '')
    const { PRESENTATION_MODE } = await import('./presentationMode')
    expect(PRESENTATION_MODE).toBe(false)
  })

  it('ignore les valeurs approximatives', async () => {
    vi.stubEnv('VITE_ENABLE_PRESENTATION_MODE', '1')
    const { PRESENTATION_MODE } = await import('./presentationMode')
    expect(PRESENTATION_MODE).toBe(false)
  })

  it('ne s’active qu’avec la valeur explicite true', async () => {
    vi.stubEnv('VITE_ENABLE_PRESENTATION_MODE', 'true')
    const { PRESENTATION_MODE } = await import('./presentationMode')
    expect(PRESENTATION_MODE).toBe(true)
  })
})
