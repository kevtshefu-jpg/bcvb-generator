import { expect, test } from '@playwright/test'

const attendanceWidths = [320, 375, 390, 430, 768, 1024, 1440]

test('l’appel réel reste contenu et utilise les cartes aux largeurs terrain', async ({ page }) => {
  await page.setViewportSize({ width: attendanceWidths[0], height: 900 })
  await page.goto('/presences')

  const callSheet = page.locator('.attendance-call-sheet')
  await expect(callSheet).toBeVisible()
  await expect(
    page.locator('.attendance-player-card').filter({ hasText: 'Alice RLS A' }),
  ).toBeVisible()
  await expect(
    page.locator('.attendance-player-card').filter({ hasText: 'Arthur RLS A' }),
  ).toContainText('Non renseigné')

  for (const width of attendanceWidths) {
    await page.setViewportSize({ width, height: 900 })

    const dimensions = await page.evaluate(() => {
      const main = document.querySelector<HTMLElement>('.attendance-main')
      const call = document.querySelector<HTMLElement>('.attendance-call-sheet')
      const sidebar = document.querySelector<HTMLElement>('.attendance-sidebar')
      const save = document.querySelector<HTMLButtonElement>('.attendance-action-primary')
      const validate = document.querySelector<HTMLButtonElement>('.attendance-action-validate')
      const playerName = Array.from(document.querySelectorAll<HTMLElement>('.attendance-player-card header strong, .attendance-player-row td:first-child strong'))
        .find((element) => element.textContent?.trim() === 'Alice RLS A')
      const insideViewport = (element?: HTMLElement) => {
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return rect.left >= 0 && rect.right <= window.innerWidth + 1
      }
      const horizontalBounds = (element?: HTMLElement) => {
        const rect = element?.getBoundingClientRect()
        return rect ? { left: rect.left, right: rect.right } : null
      }

      return {
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
        mainWidth: main?.clientWidth || 0,
        callBottom: call?.getBoundingClientRect().bottom || 0,
        sidebarTop: sidebar?.getBoundingClientRect().top || 0,
        saveInsideViewport: insideViewport(save),
        validateInsideViewport: insideViewport(validate),
        validateBounds: horizontalBounds(validate),
        playerWordBreak: playerName ? getComputedStyle(playerName).wordBreak : '',
      }
    })
    expect(dimensions.scrollWidth, `débordement global à ${width}px`).toBeLessThanOrEqual(
      dimensions.clientWidth + 1,
    )
    expect(dimensions.saveInsideViewport, `sauvegarde hors viewport à ${width}px`).toBe(true)
    expect(
      dimensions.validateInsideViewport,
      `validation hors viewport à ${width}px (${JSON.stringify(dimensions.validateBounds)})`,
    ).toBe(true)
    expect(dimensions.playerWordBreak, `nom joueur comprimé à ${width}px`).not.toBe('break-all')

    if (width <= 1400) {
      expect(dimensions.sidebarTop, `sidebar latérale à ${width}px`).toBeGreaterThanOrEqual(
        dimensions.callBottom,
      )
    }

    if (dimensions.mainWidth <= 1100) {
      await expect(page.locator('.attendance-player-card-list')).toBeVisible()
      await expect(page.locator('.attendance-table-scroll')).toBeHidden()
    } else {
      await expect(page.locator('.attendance-table-scroll')).toBeVisible()
      await expect(page.locator('.attendance-player-card-list')).toBeHidden()
    }

    if (width <= 430) {
      const aliceCard = page.locator('.attendance-player-card').filter({ hasText: 'Alice RLS A' })
      for (const status of ['Présent', 'Absent excusé', 'Absent non excusé', 'Retard', 'Blessé']) {
        await expect(aliceCard.getByRole('button', { name: status, exact: true })).toBeVisible()
      }
      await expect(page.getByRole('button', { name: 'Sauvegarder' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Valider appel coach' })).toBeEnabled()
    }
  }

  await page.setViewportSize({ width: 390, height: 900 })
  const arthurCard = page.locator('.attendance-player-card').filter({ hasText: 'Arthur RLS A' })
  await arthurCard.getByRole('button', { name: 'Absent excusé', exact: true }).click()
  await arthurCard.getByLabel('Motif').fill('Justification E2E explicite')
  await page.getByRole('button', { name: 'Sauvegarder' }).click()
  await expect(page.getByText(/Enregistré à/).first()).toBeVisible()

  await page.reload()
  const persistedArthurCard = page.locator('.attendance-player-card').filter({ hasText: 'Arthur RLS A' })
  await expect(persistedArthurCard).toContainText('Absent excusé')
  await expect(persistedArthurCard).not.toContainText('Non renseigné')
})
