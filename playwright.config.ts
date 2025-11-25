import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env
dotenv.config()

export default defineConfig({
  globalSetup: './tests/scripts/global-setup.ts',
  globalTeardown: './tests/scripts/global-teardown.ts',
  testDir: './tests',
  fullyParallel: false, // Run tests sequentially for predictable database state
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid database conflicts
  reporter: 'html',

  use: {
    baseURL: process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Output screenshots to docs_screens/
  outputDir: 'test-results/',
})
