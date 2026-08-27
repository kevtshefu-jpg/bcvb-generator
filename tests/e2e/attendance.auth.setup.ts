import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { expect, test as setup } from '@playwright/test'

const authFile = 'test-results/.auth/coach-a.json'
const localSupabaseOrigin = 'http://127.0.0.1:54321'

setup('authentifie coachA via Supabase local', async ({ page }) => {
  const fixtures = JSON.parse(
    await readFile(resolve(process.cwd(), '.rls-test-fixtures.json'), 'utf8'),
  ) as {
    target?: { environment?: string; projectRef?: string; url?: string }
    accounts?: { coachA?: { email?: string; password?: string; role?: string } }
  }
  const coachA = fixtures.accounts?.coachA

  expect(fixtures.target).toMatchObject({
    environment: 'local',
    projectRef: 'local',
    url: localSupabaseOrigin,
  })
  expect(coachA?.email).toBe('rls.coach-a@bcvb.test')
  expect(coachA?.role).toBe('coach')
  expect(coachA?.password).toBeTruthy()

  const authOrigins = new Set<string>()
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname.startsWith('/auth/v1/')) authOrigins.add(url.origin)
  })

  await page.goto('/connexion')
  await page.getByPlaceholder('Adresse email').fill(coachA?.email || '')
  await page.getByPlaceholder('Mot de passe').fill(coachA?.password || '')
  await page.getByRole('button', { name: 'Se connecter' }).click()

  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20_000 })
  await expect(page.getByText('RLS Coach A', { exact: true })).toBeVisible()
  expect([...authOrigins]).toEqual([localSupabaseOrigin])

  await page.context().storageState({ path: authFile })
})
