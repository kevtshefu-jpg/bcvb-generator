// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const readCss = (name: string) => readFile(resolve(process.cwd(), 'src/styles', name), 'utf8')

describe('P12.21 — contrats CSS de non-régression du Builder', () => {
  it('conserve les menus tactiques visibles à partir de 761 px, même repliés', async () => {
    const css = await readCss('court.css')
    const desktop = css.lastIndexOf('@media (min-width: 761px)')
    expect(desktop).toBeGreaterThan(-1)
    const override = css.slice(desktop)
    expect(override).toMatch(/details\.fastdraw-toolbar__group:not\(\[open\]\)\s*>\s*summary\s*\{\s*display:\s*flex\s*;/)
    expect(override).toMatch(/details\.fastdraw-toolbar__group:not\(\[open\]\)\s*>\s*:not\(summary\)\s*\{\s*display:\s*none\s*;/)
    expect(override).toMatch(/details\.fastdraw-toolbar__group\[open\]\s*\{\s*display:\s*flex\s*;/)
  })

  it('préserve des commandes tactiques identifiables côté React', async () => {
    const component = await readFile(resolve(process.cwd(), 'src/components/court/CourtToolbar.tsx'), 'utf8')
    for (const label of ['Outils objets', 'Outils de déplacement et zones', 'Actions d’export du terrain']) {
      expect(component).toContain(label)
    }
    expect(component).toContain('onSelectObjectTool("player")')
    expect(component).toContain('onSelectMotionTool("pass")')
    expect(component).toContain('onExportPng')
  })

  it('garde les garde-fous mobiles P12.20 pour le terrain et les métriques', async () => {
    const css = await readCss('sessions.css')
    expect(css).toContain('/* P12.20 — small-screen controls:')
    expect(css).toContain('/* P12.20 — readable metrics and load inputs, no sideways form scrolling. */')
    expect(css).toMatch(/@media \(max-width: 720px\)\s*\{\s*\.session-builder-page \.session-metric-row\s*\{\s*grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/)
    expect(css).toMatch(/\.session-builder-page \.session-metric-row input,\s*\.session-builder-page \.session-metric-row select,\s*\.session-builder-page \.session-metric-row textarea\s*\{[^}]*font-size:\s*16px/s)
    expect(css).toContain('env(safe-area-inset-bottom, 0px)')
  })
})
