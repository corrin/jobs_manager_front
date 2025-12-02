import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Load environment variables from .env
dotenv.config()

export default defineConfig({
  globalSetup: './tests/scripts/global-setup.ts',
  globalTeardown: './tests/scripts/global-teardown.ts',
  testDir: './tests',
  fullyParallel: true, // Allow parallel test suites
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 4, // Parallel workers for independent test suites
  reporter: [
    ['html'],
    ['list', { printSteps: true }], // Show steps and console output
  ],

  use: {
    baseURL: process.env.VITE_FRONTEND_BASE_URL,
    trace: 'on', // Always capture traces for timing analysis
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },

  // Increase test timeout to 60 seconds for operations that involve backend API calls
  timeout: 60000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Output test artifacts (videos, traces) to test-results/
  outputDir: 'test-results/',
})
