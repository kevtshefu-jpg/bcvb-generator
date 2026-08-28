import { expect, test } from '@playwright/test'

test('une route coach redirige un visiteur non connecté', async ({ page }) => {
  await page.goto('/coach')
  await expect(page).toHaveURL(/\/connexion$/, { timeout: 20_000 })
  await expect(page.getByRole('heading', { name: 'Connexion membre' })).toBeVisible()
})

test('le formulaire de connexion utilise les champs requis', async ({ page }) => {
  await page.goto('/connexion')
  const email = page.getByPlaceholder('Adresse email')
  const password = page.getByPlaceholder('Mot de passe')
  await expect(email).toHaveAttribute('required', '')
  await expect(password).toHaveAttribute('required', '')
  await expect(password).toHaveAttribute('type', 'password')
})

test('la gestion des membres redirige un visiteur vers la connexion sans débordement mobile', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 })
  await page.goto('/admin/membres')

  await expect(page).toHaveURL(/\/connexion$/, { timeout: 20_000 })
  const dimensions = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width + 1)
})
