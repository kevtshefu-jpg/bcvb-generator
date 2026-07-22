import { expect, test } from '@playwright/test'

test('l’accueil ne charge aucun outil admin, import ou export', async ({ page }) => {
  const scripts = new Set<string>()
  page.on('response', (response) => {
    const url = response.url()
    if (response.request().resourceType() === 'script') scripts.add(url)
  })

  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const loaded = [...scripts].join('\n')
  expect(loaded).not.toMatch(/AdminAIDocuments|ImportCenter|safeSpreadsheet|EditorialStudioPage|jspdf|html2canvas|pdf\.worker/i)
})
