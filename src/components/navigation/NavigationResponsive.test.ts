// @vitest-environment node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('contrat responsive des navigations principales', () => {
  it('bascule sans chevauchement à 1100/1101 px', async () => {
    const css = await readFile(resolve(process.cwd(), 'src/styles/mobile-premium.css'), 'utf8')

    expect(css).toContain('@media (min-width: 1101px)')
    expect(css).toContain('@media (max-width: 1100px)')
    expect(css).toMatch(/@media \(max-width: 1100px\)[\s\S]*?\.app-shell > \.sidebar,[\s\S]*?display: none;/)
    expect(css).toMatch(/@media \(max-width: 1100px\)[\s\S]*?\.mobile-nav \{[\s\S]*?display: block;/)
  })

  it('conserve des cibles tactiles de 44 px dans la navigation compacte', async () => {
    const css = await readFile(resolve(process.cwd(), 'src/styles/mobile-premium.css'), 'utf8')

    for (const selector of ['.mobile-nav__button', '.mobile-nav__quickLink', '.mobile-nav-panel__close']) {
      const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      expect(css).toMatch(new RegExp(`${escaped}\\s*\\{[^}]*min-height:\\s*44px`))
    }
  })

  it('garde Escape, aria-expanded et un seul bouton de menu', async () => {
    const component = await readFile(resolve(process.cwd(), 'src/components/navigation/MobileNavigation.tsx'), 'utf8')

    expect(component).toContain("event.key === 'Escape'")
    expect(component).toContain('aria-expanded={open}')
    expect(component.match(/className="mobile-nav__button bcvb-action-button-safe"/g)).toHaveLength(1)
  })
})
