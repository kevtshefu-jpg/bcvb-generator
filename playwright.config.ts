import { defineConfig, devices } from '@playwright/test'

const attendanceAuthFile = 'test-results/.auth/coach-a.json'

export default defineConfig({
  testDir: './tests/e2e',
  // L'AuthProvider contacte Supabase au chargement. Une exécution séquentielle
  // évite de transformer la latence distante en faux échecs E2E.
  fullyParallel: false,
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'attendance-auth-setup',
      testMatch: /attendance\.auth\.setup\.ts/,
    },
    {
      name: 'chromium-desktop',
      testIgnore: [/attendance\.auth\.setup\.ts/, /attendance-responsive\.spec\.ts/, /session-builder-server\.spec\.ts/, /session-workflow\.spec\.ts/],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium-mobile',
      testIgnore: [/attendance\.auth\.setup\.ts/, /attendance-responsive\.spec\.ts/, /session-builder-server\.spec\.ts/, /session-workflow\.spec\.ts/],
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'attendance-authenticated',
      testMatch: /(attendance-responsive|session-builder-server)\.spec\.ts/,
      dependencies: ['attendance-auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: attendanceAuthFile,
      },
    },
    {
      name: 'session-workflow',
      testMatch: /session-workflow\.spec\.ts/,
      dependencies: ['attendance-auth-setup'],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
