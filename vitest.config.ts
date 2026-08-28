import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/security/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/features/ux/**/*.{ts,tsx}', 'src/features/coach/hooks/**/*.ts'],
    },
  },
})
