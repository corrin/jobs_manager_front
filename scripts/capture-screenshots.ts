import { chromium, type Page } from '@playwright/test'
import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Screenshot definition type
interface ScreenshotDef {
  id: string // Stable identifier used in markdown references
  description: string // Human-readable description for manifest
  route: string // URL path to navigate to
  waitFor?: string // CSS selector to wait for before capturing
  prepare?: (page: Page) => Promise<void> // Optional setup actions
  fullPage?: boolean // Capture entire scrollable page
  clip?: { x: number; y: number; width: number; height: number } // Capture specific region
}

// Define all screenshots to capture
// Naming convention: {domain}-{action}-{state}.png
const SCREENSHOTS: ScreenshotDef[] = [
  // === LOGIN ===
  {
    id: 'login-page',
    description: 'Login page with email and password fields',
    route: '/login',
    waitFor: '#username',
  },

  // === KANBAN / JOBS ===
  {
    id: 'kanban-board-overview',
    description: 'Kanban board showing job cards organized by status',
    route: '/kanban',
    waitFor: '[data-automation-id="kanban-column"]',
  },

  // === TIMESHEETS ===
  {
    id: 'timesheet-daily-view',
    description: 'Daily timesheet entry view',
    route: '/timesheets',
    waitFor: 'main',
  },

  // === CLIENTS ===
  {
    id: 'clients-list',
    description: 'Client list with search and filters',
    route: '/clients',
    waitFor: 'main',
  },

  // === ADMIN ===
  {
    id: 'admin-company-settings',
    description: 'Company settings configuration page',
    route: '/company-defaults',
    waitFor: 'form',
  },

  // Add more screenshots as needed...
  // {
  //   id: 'job-create-form',
  //   description: 'Create new job form',
  //   route: '/jobs/create',
  //   waitFor: '[data-automation-id="job-form"]',
  // },
]

// Output paths
const OUTPUT_DIR = path.resolve(__dirname, '../manual/public/screenshots')
const MANIFEST_PATH = path.resolve(__dirname, '../manual/screenshot-manifest.json')

async function authenticate(page: Page): Promise<void> {
  const username = process.env.E2E_TEST_USERNAME
  const password = process.env.E2E_TEST_PASSWORD

  if (!username || !password) {
    throw new Error(
      'E2E_TEST_USERNAME and E2E_TEST_PASSWORD must be set in .env\n' +
        'These are the same credentials used for e2e tests.',
    )
  }

  console.log('Authenticating...')
  await page.goto('/login')
  await page.locator('#username').fill(username)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Sign In' }).click()
  await page.waitForURL('**/kanban')
  console.log('Authenticated successfully')
}

async function captureScreenshots(): Promise<void> {
  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  const baseUrl = process.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5173'
  console.log(`Using base URL: ${baseUrl}`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    baseURL: baseUrl,
  })
  const page = await context.newPage()

  // Authenticate first
  await authenticate(page)

  const manifest: Record<string, { path: string; description: string }> = {}
  const errors: string[] = []

  for (const def of SCREENSHOTS) {
    console.log(`\nCapturing: ${def.id}`)
    console.log(`  Route: ${def.route}`)

    try {
      // Navigate to the route
      await page.goto(def.route)

      // Wait for the specified selector if provided
      if (def.waitFor) {
        console.log(`  Waiting for: ${def.waitFor}`)
        await page.waitForSelector(def.waitFor, { timeout: 15000 })
      }

      // Run any preparation steps
      if (def.prepare) {
        console.log('  Running prepare function...')
        await def.prepare(page)
      }

      // Small delay for animations to settle
      await page.waitForTimeout(500)

      // Capture the screenshot
      const filename = `${def.id}.png`
      const filepath = path.join(OUTPUT_DIR, filename)

      await page.screenshot({
        path: filepath,
        fullPage: def.fullPage ?? false,
        clip: def.clip,
      })

      console.log(`  Saved: ${filename}`)

      // Add to manifest
      manifest[def.id] = {
        path: `/screenshots/${filename}`,
        description: def.description,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error(`  ERROR: ${message}`)
      errors.push(`${def.id}: ${message}`)
    }
  }

  // Write manifest for content authors
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

  await browser.close()

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log(`Captured ${Object.keys(manifest).length}/${SCREENSHOTS.length} screenshots`)
  console.log(`Manifest written to: ${MANIFEST_PATH}`)

  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach((e) => console.log(`  - ${e}`))
  }

  console.log('\nScreenshots saved to: ' + OUTPUT_DIR)
}

// Run the script
captureScreenshots().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
