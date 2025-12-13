import type { Page, Response } from '@playwright/test'
import { expect } from '@playwright/test'
import { appendFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

// Network logging state
let networkRunId: string | null = null
let networkRunDate: string | null = null
const networkCsvPath = path.join(process.cwd(), 'test-results', 'network-aggregate.csv')

/**
 * Helper to log all API network traffic with sizes
 * Appends to test-results/network-aggregate.csv for later analysis
 * Call once at start of test to enable logging for that page
 */
export function enableNetworkLogging(page: Page, testName?: string) {
  // Initialize run ID once per test run
  if (!networkRunId) {
    networkRunId = Math.random().toString(36).substring(2, 10)
    networkRunDate = new Date().toISOString()
    // Ensure test-results directory exists
    const dir = path.dirname(networkCsvPath)
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    // Write header if file doesn't exist
    if (!existsSync(networkCsvPath)) {
      appendFileSync(
        networkCsvPath,
        'run_id,run_date,test_name,method,url,status,size_bytes,size_kb\n',
      )
    }
  }

  page.on('response', async (response: Response) => {
    const url = response.url()
    // Only log API calls, skip static assets
    if (!url.includes('/api/') && !url.includes('/clients/') && !url.includes('/jobs/')) {
      return
    }
    try {
      const body = await response.body()
      const sizeBytes = body.length
      const sizeKB = (sizeBytes / 1024).toFixed(2)
      const status = response.status()
      const method = response.request().method()
      // Strip base URL for readability
      const shortUrl = url.replace(/^https?:\/\/[^/]+/, '')

      // Append to CSV
      const row = [
        networkRunId,
        networkRunDate,
        `"${testName || 'unknown'}"`,
        method,
        `"${shortUrl.replace(/"/g, '""')}"`,
        status,
        sizeBytes,
        sizeKB,
      ].join(',')
      appendFileSync(networkCsvPath, row + '\n')
    } catch {
      // Response body not available (e.g., redirects)
    }
  })
}

/**
 * Helper to time and log async operations
 */
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    console.log(`[TIMING] ${label}: ${Date.now() - start}ms`)
    return result
  } catch (error) {
    console.log(`[TIMING] ${label}: FAILED after ${Date.now() - start}ms`)
    throw error
  }
}

/**
 * Helper to find elements by data-automation-id attribute
 */
export const autoId = (page: Page, id: string) => page.locator(`[data-automation-id="${id}"]`)

/**
 * Helper to dismiss any toast notifications that might block interactions
 */
export async function dismissToasts(page: Page) {
  const toasts = page.locator('[data-sonner-toast]')
  const toastCount = await toasts.count()
  if (toastCount > 0) {
    console.log(`Dismissing ${toastCount} toast(s)...`)
    for (let i = 0; i < toastCount; i++) {
      const toast = toasts.nth(i)
      const closeBtn = toast.locator('button[aria-label="Close toast"]')
      if (await closeBtn.count()) {
        await closeBtn.click()
      } else {
        await toast.click()
      }
      await page.waitForTimeout(100)
    }
    await page.waitForTimeout(300)
  }
}

/**
 * Helper to wait for JobSettingsTab to finish initializing
 */
export async function waitForSettingsInitialized(page: Page) {
  await page.waitForSelector('[data-initialized="true"]', { timeout: 15000 })
}

/**
 * Helper to wait for autosave to complete
 * Waits for the PATCH request to /job/rest/jobs/ to complete with status 200
 */
export async function waitForAutosave(page: Page) {
  await page.waitForResponse(
    (response) =>
      response.url().includes('/job/rest/jobs/') &&
      response.request().method() === 'PATCH' &&
      response.status() === 200,
    { timeout: 10000 },
  )
}

/**
 * Create a new job for testing and return its URL
 */
export async function createTestJob(page: Page, jobNameSuffix: string): Promise<string> {
  const timestamp = Date.now()
  const jobName = `Test Job ${jobNameSuffix} ${timestamp}`

  await autoId(page, 'AppNavbar-create-job').click()
  await page.waitForURL('**/jobs/create')

  // Search and select client
  const clientInput = autoId(page, 'ClientLookup-input')
  await clientInput.fill('ABC')
  await autoId(page, 'ClientLookup-results').waitFor({ timeout: 10000 })
  await page.getByRole('option', { name: /ABC Carpet Cleaning TEST IGNORE/ }).click()
  await expect(clientInput).toHaveValue('ABC Carpet Cleaning TEST IGNORE')

  // Enter job details
  await autoId(page, 'JobCreateView-name-input').fill(jobName)
  await autoId(page, 'JobCreateView-estimated-materials').fill('0')
  await autoId(page, 'JobCreateView-estimated-time').fill('0')

  // Select contact
  await autoId(page, 'ContactSelector-modal-button').click({ timeout: 10000 })
  await autoId(page, 'ContactSelectionModal-container').waitFor({ timeout: 10000 })

  const selectButtons = autoId(page, 'ContactSelectionModal-select-button')
  const selectButtonCount = await selectButtons.count()

  if (selectButtonCount > 0) {
    await selectButtons.first().click()
  } else {
    const submitButton = autoId(page, 'ContactSelectionModal-submit')
    await expect(submitButton).toHaveText('Create Contact', { timeout: 10000 })
    await autoId(page, 'ContactSelectionModal-name-input').fill(`Test Contact ${timestamp}`)
    await autoId(page, 'ContactSelectionModal-email-input').fill(`test${timestamp}@example.com`)
    await submitButton.click()
  }

  await autoId(page, 'ContactSelectionModal-container').waitFor({ state: 'hidden', timeout: 10000 })

  // Set pricing method to T&M and submit
  await autoId(page, 'JobCreateView-pricing-method').selectOption('time_materials')
  await dismissToasts(page)
  await autoId(page, 'JobCreateView-submit').click({ force: true })
  await page.waitForURL('**/jobs/*?*tab=estimate*', { timeout: 15000 })

  return page.url()
}
