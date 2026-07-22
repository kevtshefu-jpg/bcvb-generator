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
