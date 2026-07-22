import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('le mode Découverte est le mode initial et le mode Expert persiste', async ({ page }) => {
  const discovery = page.getByRole('button', { name: /Découverte/i })
  const expert = page.getByRole('button', { name: /Expert/i })
  await expect(discovery).toHaveAttribute('aria-pressed', 'true')
  await expert.click()
  await expect(expert).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('button', { name: /Expert/i })).toHaveAttribute('aria-pressed', 'true')
})

test('le texte agrandi persiste', async ({ page }) => {
  await page.getByRole('button', { name: 'Agrandir le texte' }).click()
  await expect(page.locator('.text-size--large')).toBeVisible()
  await page.reload()
  await expect(page.locator('.text-size--large')).toBeVisible()
})

test('le lien d’évitement fonctionne au clavier', async ({ page }) => {
  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Aller directement au contenu' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.locator('#main-content')).toBeFocused()
})

test('aucun débordement horizontal global', async ({ page }) => {
  const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1)
})

test('aucune violation accessibilité critique sur la page publique', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const critical = results.violations.filter((violation) => violation.impact === 'critical')
  expect(critical, critical.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([])
})
