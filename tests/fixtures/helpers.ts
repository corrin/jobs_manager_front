import type { Page } from '@playwright/test'
import { expect } from '@playwright/test'

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
 */
export async function waitForAutosave(page: Page) {
  // Wait for network to settle and give autosave time to complete
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
}

/**
 * Create a new job for testing and return its URL
 */
export async function createTestJob(page: Page, jobNameSuffix: string): Promise<string> {
  const timestamp = Date.now()
  const jobName = `Test Job ${jobNameSuffix} ${timestamp}`

  await autoId(page, 'nav-create-job').click()
  await page.waitForURL('**/jobs/create')

  // Search and select client
  const clientInput = autoId(page, 'client-search-input')
  await clientInput.fill('ABC')
  await autoId(page, 'client-search-results').waitFor({ timeout: 10000 })
  await page.getByRole('option', { name: /ABC Carpet Cleaning TEST IGNORE/ }).click()
  await expect(clientInput).toHaveValue('ABC Carpet Cleaning TEST IGNORE')

  // Enter job details
  await autoId(page, 'job-name-input').fill(jobName)
  await autoId(page, 'estimated-materials-input').fill('0')
  await autoId(page, 'estimated-time-input').fill('0')

  // Select contact
  await autoId(page, 'contact-modal-button').click({ timeout: 10000 })
  await autoId(page, 'contact-selection-modal').waitFor({ timeout: 10000 })

  const selectButtons = autoId(page, 'contact-select-button')
  const selectButtonCount = await selectButtons.count()

  if (selectButtonCount > 0) {
    await selectButtons.first().click()
  } else {
    const submitButton = autoId(page, 'contact-form-submit')
    await expect(submitButton).toHaveText('Create Contact', { timeout: 10000 })
    await autoId(page, 'contact-form-name').fill(`Test Contact ${timestamp}`)
    await autoId(page, 'contact-form-email').fill(`test${timestamp}@example.com`)
    await submitButton.click()
  }

  await autoId(page, 'contact-selection-modal').waitFor({ state: 'hidden', timeout: 10000 })

  // Set pricing method to T&M and submit
  await autoId(page, 'pricing-method-select').selectOption('time_materials')
  await dismissToasts(page)
  await autoId(page, 'create-job-submit').click({ force: true })
  await page.waitForURL('**/jobs/*?*tab=estimate*', { timeout: 15000 })

  return page.url()
}
