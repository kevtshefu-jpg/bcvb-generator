import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

test('le mode Découverte est le mode initial et le mode Expert persiste', async ({ page }) => {
  const settings = page.getByRole('button', { name: /Mode Découverte.*Modifier/i })
  await expect(settings).toHaveAttribute('aria-expanded', 'false')
  await settings.click()
  const discovery = page.getByRole('button', { name: 'Activer le mode Découverte' })
  const expert = page.getByRole('button', { name: 'Activer le mode Expert' })
  await expect(discovery).toHaveAttribute('aria-pressed', 'true')
  await expert.click()
  await expect(expert).toHaveAttribute('aria-pressed', 'true')
  await page.reload()
  await expect(page.getByRole('button', { name: /Mode Expert.*Modifier/i })).toBeVisible()
})

test('le texte agrandi persiste', async ({ page }) => {
  await page.getByRole('button', { name: /Mode Découverte.*Modifier/i }).click()
  await page.getByRole('button', { name: 'Agrandir le texte' }).click()
  await expect(page.locator('.text-size--large')).toBeVisible()
  await page.reload()
  await expect(page.locator('.text-size--large')).toBeVisible()
})

test('le visiteur voit un seul CTA principal et des réglages accessibles', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Bienvenue sur le Référentiel BCVB' })).toBeVisible()
  await expect(page.locator('.v33-hero .v33-btn--primary')).toHaveCount(1)
  await expect(page.getByRole('link', { name: 'Se connecter', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Demander un accès' })).toBeVisible()

  const settings = page.getByRole('button', { name: /Mode Découverte.*Modifier/i })
  await settings.click()
  await expect(page.getByText('Réglages d’affichage')).toBeVisible()
  await expect(settings).toHaveAttribute('aria-expanded', 'true')
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

test('aucun débordement aux largeurs GO LIVE desktop et mobile', async ({ page }) => {
  for (const width of [320, 375, 390, 430, 1366, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 })
    const dimensions = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(dimensions.scrollWidth, `${width}px`).toBeLessThanOrEqual(dimensions.width + 1)
  }
})

test('aucune violation accessibilité critique sur la page publique', async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
  const critical = results.violations.filter((violation) => violation.impact === 'critical')
  expect(critical, critical.map((item) => `${item.id}: ${item.help}`).join('\n')).toEqual([])
})
