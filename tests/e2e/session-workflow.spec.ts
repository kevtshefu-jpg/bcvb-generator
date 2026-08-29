import { expect, test, type BrowserContext, type Page } from '@playwright/test'

const coachAuth = 'test-results/.auth/coach-a.json'
const reviewerAuth = 'test-results/.auth/responsable-technique.json'

async function createAndSubmit(page: Page, title: string) {
  await page.goto('/coach/seances')
  await expect(page.getByRole('heading', { name: 'Créateur de séances' })).toBeVisible({ timeout: 20_000 })
  if (!(await page.getByLabel('Titre séance').isEnabled())) {
    await page.getByRole('button', { name: 'Nouvelle séance', exact: true }).click()
  }
  const team = page.getByLabel('Équipe de la séance BCVB')
  await team.selectOption({ index: 1 })
  await page.getByLabel('Titre séance').fill(title)
  await page.getByRole('button', { name: 'Sauvegarder sur BCVB' }).last().click()
  await expect(page.getByText('Sauvegardé sur BCVB')).toBeVisible({ timeout: 20_000 })
  await page.getByRole('button', { name: 'Soumettre', exact: true }).click()
  await expect(page.getByText('Soumise pour publication', { exact: true })).toBeVisible({ timeout: 20_000 })
  return new URL(page.url()).searchParams.get('sessionId') || ''
}

async function reviewCard(page: Page, title: string) {
  await page.goto('/coach/seances/bibliotheque')
  const queue = page.locator('section[aria-labelledby="review-session-library-title"]')
  await expect(queue.getByRole('heading', { name: /À valider \(\d+\)/ })).toBeVisible({ timeout: 20_000 })
  const card = queue.locator('.session-library-card').filter({ hasText: title })
  await expect(card).toBeVisible()
  return card
}

async function acceptNextConfirmation(page: Page) {
  page.once('dialog', (dialog) => dialog.accept())
}

test('workflow pilote multi-rôles, publication et responsive', async ({ browser }) => {
  test.setTimeout(150_000)
  const coachContext: BrowserContext = await browser.newContext({ storageState: coachAuth })
  const reviewerContext: BrowserContext = await browser.newContext({ storageState: reviewerAuth })
  const coach = await coachContext.newPage()
  const reviewer = await reviewerContext.newPage()
  const suffix = Date.now()
  const teamTitle = `Séance workflow TEAM ${suffix}`
  const clubTitle = `Séance workflow CLUB ${suffix}`

  const teamId = await createAndSubmit(coach, teamTitle)
  expect(teamId).toBeTruthy()

  let card = await reviewCard(reviewer, teamTitle)
  await expect(card.getByRole('button', { name: 'Publier' })).toBeDisabled()
  for (const width of [390, 1440]) {
    await reviewer.setViewportSize({ width, height: 900 })
    const dimensions = await reviewer.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth, `débordement de la file à ${width}px`).toBeLessThanOrEqual(dimensions.clientWidth + 1)
    await expect(card.getByLabel('Équipe')).toBeVisible()
    await expect(card.getByLabel('Référence club')).toBeVisible()
  }
  await card.getByRole('button', { name: 'Consulter' }).click()
  await expect(reviewer.getByLabel('Titre séance')).toHaveValue(teamTitle, { timeout: 20_000 })
  await expect(reviewer.getByLabel('Titre séance')).toBeDisabled()
  card = await reviewCard(reviewer, teamTitle)
  await acceptNextConfirmation(reviewer)
  await card.getByRole('button', { name: 'Renvoyer en correction' }).click()
  await expect(reviewer.getByText('Séance renvoyée en correction.')).toBeVisible({ timeout: 20_000 })

  await coach.goto(`/coach/seances?sessionId=${teamId}`)
  await expect(coach.getByText('Brouillon', { exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(coach.getByLabel('Titre séance')).toBeEnabled()
  await coach.getByRole('button', { name: 'Soumettre', exact: true }).click()
  await expect(coach.getByText('Soumise pour publication', { exact: true })).toBeVisible({ timeout: 20_000 })

  card = await reviewCard(reviewer, teamTitle)
  await card.getByLabel('Équipe').check()
  await acceptNextConfirmation(reviewer)
  await card.getByRole('button', { name: 'Publier' }).click()
  await expect(reviewer.getByText("Séance publiée pour l'équipe.")).toBeVisible({ timeout: 20_000 })

  await coach.goto(`/coach/seances?sessionId=${teamId}`)
  await expect(coach.getByText('Publiée', { exact: true })).toBeVisible({ timeout: 20_000 })
  await expect(coach.getByText('Diffusion : Équipe', { exact: true })).toBeVisible()
  await expect(coach.getByLabel('Titre séance')).toBeDisabled()
  await expect(coach.getByRole('button', { name: 'Sauvegarder sur BCVB' }).last()).toBeDisabled()

  await reviewer.goto('/coach/seances/bibliotheque')
  const officialTeam = reviewer.locator('section[aria-labelledby="server-session-library-title"] .session-library-card').filter({ hasText: teamTitle })
  await expect(officialTeam).toContainText('Publiée', { timeout: 20_000 })
  await acceptNextConfirmation(reviewer)
  await officialTeam.getByRole('button', { name: 'Archiver' }).click()
  await expect(reviewer.getByText('Séance archivée.')).toBeVisible({ timeout: 20_000 })

  await createAndSubmit(coach, clubTitle)
  card = await reviewCard(reviewer, clubTitle)
  await card.getByLabel('Référence club').check()
  await acceptNextConfirmation(reviewer)
  await card.getByRole('button', { name: 'Publier' }).click()
  await expect(reviewer.getByText('Séance publiée comme référence club.')).toBeVisible({ timeout: 20_000 })

  for (const width of [390, 1440]) {
    await reviewer.setViewportSize({ width, height: 900 })
    await reviewer.goto('/coach/seances/bibliotheque')
    const dimensions = await reviewer.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth, `débordement global à ${width}px`).toBeLessThanOrEqual(dimensions.clientWidth + 1)
    await expect(reviewer.getByRole('heading', { name: /À valider \(\d+\)/ })).toBeVisible()
  }

  await coachContext.close()
  await reviewerContext.close()
})
