import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(resolve(process.cwd(), 'src/modules/sessions/SessionLibraryPage.tsx'), 'utf8')

describe('SessionLibraryPage official workflow', () => {
  it('uses only server reads and canonical transition services for institutional decisions', () => {
    expect(source).toContain("status === 'to_review'")
    expect(source).toContain('À valider ({reviewSessions.length})')
    expect(source).toContain('publishSession({ sessionId: serverSession.id, expectedVersion: serverSession.version, visibility })')
    expect(source).toContain('returnSessionToDraft({ sessionId: serverSession.id, expectedVersion: serverSession.version })')
    expect(source).toContain('archiveSession({ sessionId: serverSession.id, expectedVersion: serverSession.version })')
    expect(source).toContain('await getSessionById(sessionId)')
    expect(source).not.toMatch(/from\(['"]sessions['"]\)\.(?:update|insert|upsert)/)
  })

  it('requires an explicit team or club choice and handles stale versions', () => {
    expect(source).toContain("'team' | 'club' | undefined")
    expect(source).toContain('disabled={pending || !publicationChoices[serverSession.id]}')
    expect(source).toContain('La séance a été modifiée depuis votre dernier chargement.')
    expect(source).toContain('mutationLock.current')
    expect(source).not.toContain("visibility: 'public'")
  })

  it('keeps browser recovery visibly separate from the official source', () => {
    expect(source).toContain('Source officielle')
    expect(source).toContain('Récupération navigateur')
    expect(source).toContain('Brouillons locaux historiques')
  })
})
