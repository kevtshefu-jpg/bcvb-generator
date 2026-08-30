import { expect, test } from '@playwright/test'

test('le coach sauvegarde, rouvre, versionne puis soumet une séance BCVB', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/coach/seances')
  await expect(page.getByRole('heading', { name: 'Créateur de séances' })).toBeVisible({ timeout: 20_000 })
  await expect(page.getByText('Non sauvegardé sur BCVB')).toBeVisible()

  const teamSelect = page.getByLabel('Équipe de la séance BCVB')
  await expect(teamSelect).toBeVisible()
  await teamSelect.selectOption({ index: 1 })
  await page.getByLabel('Titre séance').fill('Séance pilote E2E Supabase')
  await page.getByRole('button', { name: 'Sauvegarder sur BCVB' }).last().click()
  await expect(page.getByText('Sauvegardé sur BCVB')).toBeVisible({ timeout: 15_000 })
  await expect(page).toHaveURL(/sessionId=/)
  await expect(page.getByText('Version 1')).toBeVisible()

  await page.goto('/coach/seances/bibliotheque')
  const officialCard = page.locator('.session-library-card').filter({ hasText: 'Séance pilote E2E Supabase' }).first()
  await expect(officialCard).toBeVisible({ timeout: 20_000 })
  await officialCard.getByRole('button', { name: 'Ouvrir depuis BCVB' }).click()
  await expect(page.getByLabel('Titre séance')).toHaveValue('Séance pilote E2E Supabase', { timeout: 20_000 })

  await page.getByLabel('Titre séance').fill('Séance pilote E2E Supabase v2')
  await expect(page.getByText('Modifications non sauvegardées')).toBeVisible()
  await page.getByRole('button', { name: 'Sauvegarder sur BCVB' }).last().click()
  await expect(page.getByText('Version 2')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Soumettre', exact: true }).click()
  await expect(page.getByText('Soumise pour publication', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(page.getByLabel('Titre séance')).toBeDisabled()

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth, `débordement global à ${width}px`).toBeLessThanOrEqual(dimensions.clientWidth + 1)
    await expect(page.getByText('Soumise pour publication', { exact: true })).toBeVisible()
  }
})
