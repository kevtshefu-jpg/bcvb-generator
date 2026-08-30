import { describe, expect, it } from 'vitest'
import { getVisibleSiteCategories } from './siteCategories.js'

describe('pilot navigation integrity', () => {
  it('masks local-only planning, roster and evaluation modules', () => {
    for (const role of ['admin', 'responsable_technique', 'coach']) {
      const ids = getVisibleSiteCategories(role).map(({ id }) => id)
      expect(ids).not.toContain('planning')
      expect(ids).not.toContain('rosters')
      expect(ids).not.toContain('evaluations')
      expect(ids).toContain('sessions')
      expect(ids).toContain('attendance')
    }
  })
})
