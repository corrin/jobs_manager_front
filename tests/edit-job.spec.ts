import { test, expect } from './fixtures/auth'
import { getCompanyDefaults } from './fixtures/api'
import type { Page } from '@playwright/test'

// Helper to find elements by data-automation-id
const autoId = (page: Page, id: string) => page.locator(`[data-automation-id="${id}"]`)

// Helper to dismiss any toast notifications
async function dismissToasts(page: Page) {
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

// Helper to wait for JobSettingsTab to finish initializing
async function waitForSettingsInitialized(page: Page) {
  await page.waitForSelector('[data-initialized="true"]', { timeout: 15000 })
}

// Helper to wait for autosave to complete
async function waitForAutosave(page: Page) {
  // Wait for save status to show "Saved" or success toast
  try {
    await page.waitForFunction(
      () => {
        const text = document.body.innerText
        return text.includes('Saved at') || text.includes('updated successfully')
      },
      { timeout: 10000 },
    )
  } catch {
    // If specific indicators aren't found, fall back to a delay
    await page.waitForTimeout(3000)
  }
}

/**
 * Tests for editing a job after creation.
 * These tests run after the create-job tests and verify:
 * - Navigating to Job Settings tab
 * - Verifying job details match what was entered during creation
 * - Changing job details (name, pricing method)
 * - Changing contact person
 * - Changing client
 */
test.describe.serial('edit job', () => {
  // Store job URL from the first test to use in subsequent tests
  let createdJobUrl: string

  test('create a job to edit', async ({ authenticatedPage: page }) => {
    const timestamp = Date.now()
    const jobName = `Edit Test Job ${timestamp}`

    await test.step('navigate to create job page', async () => {
      await autoId(page, 'nav-create-job').click()
      await page.waitForURL('**/jobs/create')
    })

    await test.step('search and select client', async () => {
      const clientInput = autoId(page, 'client-search-input')
      await clientInput.fill('ABC')
      await autoId(page, 'client-search-results').waitFor({ timeout: 10000 })
      await page.getByRole('option', { name: /ABC Carpet Cleaning TEST IGNORE/ }).click()
      await expect(clientInput).toHaveValue('ABC Carpet Cleaning TEST IGNORE')
    })

    await test.step('enter job details', async () => {
      await autoId(page, 'job-name-input').fill(jobName)
      await autoId(page, 'estimated-materials-input').fill('1000')
      await autoId(page, 'estimated-time-input').fill('8')
    })

    await test.step('select or create contact', async () => {
      await autoId(page, 'contact-modal-button').click({ timeout: 10000 })
      await autoId(page, 'contact-selection-modal').waitFor({ timeout: 10000 })

      // Check if we have existing contacts - if so, select one; otherwise create one
      const selectButtons = autoId(page, 'contact-select-button')
      const selectButtonCount = await selectButtons.count()

      if (selectButtonCount > 0) {
        // Select the first available contact
        await selectButtons.first().click()
      } else {
        // Create a new contact
        const submitButton = autoId(page, 'contact-form-submit')
        await expect(submitButton).toHaveText('Create Contact', { timeout: 10000 })
        await autoId(page, 'contact-form-name').fill(`Test Contact ${timestamp}`)
        await autoId(page, 'contact-form-email').fill(`test${timestamp}@example.com`)
        await submitButton.click()
      }

      await autoId(page, 'contact-selection-modal').waitFor({ state: 'hidden', timeout: 10000 })
    })

    await test.step('set pricing method and submit', async () => {
      await autoId(page, 'pricing-method-select').selectOption('fixed_price')

      // Dismiss any toast notifications that might block the button
      await dismissToasts(page)

      await autoId(page, 'create-job-submit').click({ force: true })
      await page.waitForURL('**/jobs/*?*tab=quote*', { timeout: 15000 })

      // Store the job URL for subsequent tests
      createdJobUrl = page.url()
      console.log(`Created job at: ${createdJobUrl}`)
    })
  })

  test('navigate to Job Settings tab and verify details', async ({ authenticatedPage: page }) => {
    // Go to the created job
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await test.step('navigate to Job Settings tab', async () => {
      // Click on Job Settings tab
      await autoId(page, 'tab-jobSettings').click()

      // Wait for the tab content to load
      await autoId(page, 'settings-job-name').waitFor({ timeout: 10000 })

      // Wait for job data to actually populate the fields
      // The field should have a value (not just be empty placeholder)
      const jobNameInput = autoId(page, 'settings-job-name')
      try {
        await expect(jobNameInput).not.toHaveValue('', { timeout: 10000 })
      } catch {
        // If still empty after 10s, log debug info
        const pageText = await page.evaluate(() => document.body.innerText)
        console.log('Page text snippet:', pageText.substring(0, 500))
        throw new Error('Job name field is still empty after 10 seconds - data not loading')
      }
    })

    await test.step('verify job name contains test identifier', async () => {
      const jobNameInput = autoId(page, 'settings-job-name')
      const jobName = await jobNameInput.inputValue()
      console.log('Job name value:', jobName)
      expect(jobName).toContain('Edit Test Job')
    })

    await test.step('verify client is ABC Carpet Cleaning', async () => {
      const clientNameInput = autoId(page, 'settings-client-name')
      await expect(clientNameInput).toHaveValue('ABC Carpet Cleaning TEST IGNORE')
    })

    await test.step('verify pricing method is Fixed Price', async () => {
      const pricingSelect = autoId(page, 'settings-pricing-method')
      await expect(pricingSelect).toHaveValue('fixed_price')
    })
  })

  test('change job name', async ({ authenticatedPage: page }) => {
    // Capture browser console logs for autosave debugging
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('JobAutosave') || text.includes('DEBUG')) {
        console.log(`[Browser] ${text}`)
      }
    })

    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    // Navigate to Job Settings tab
    await autoId(page, 'tab-jobSettings').click()
    await autoId(page, 'settings-job-name').waitFor({ timeout: 10000 })

    // Wait for component initialization to complete (so autosave can work)
    await waitForSettingsInitialized(page)

    const newJobName = `Updated Job Name ${Date.now()}`

    await test.step('change the job name', async () => {
      const jobNameInput = autoId(page, 'settings-job-name')
      // Use clear + pressSequentially to ensure @input events fire (fill() doesn't always trigger them)
      await jobNameInput.clear()
      await jobNameInput.pressSequentially(newJobName, { delay: 10 })
      await jobNameInput.blur() // Trigger autosave
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify the name was saved by refreshing', async () => {
      await page.reload()
      await autoId(page, 'tab-jobSettings').click()
      await autoId(page, 'settings-job-name').waitFor({ timeout: 10000 })

      const jobNameInput = autoId(page, 'settings-job-name')
      await expect(jobNameInput).toHaveValue(newJobName)
    })
  })

  test('change pricing method from Fixed Price to T&M', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    // Navigate to Job Settings tab
    await autoId(page, 'tab-jobSettings').click()
    await autoId(page, 'settings-pricing-method').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    await test.step('change pricing method to Time & Materials', async () => {
      const pricingSelect = autoId(page, 'settings-pricing-method')
      await pricingSelect.selectOption('time_materials')
      await pricingSelect.blur() // Trigger autosave
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify pricing method was saved', async () => {
      await page.reload()
      await autoId(page, 'tab-jobSettings').click()
      await autoId(page, 'settings-pricing-method').waitFor({ timeout: 10000 })

      const pricingSelect = autoId(page, 'settings-pricing-method')
      await expect(pricingSelect).toHaveValue('time_materials')
    })
  })

  test('change contact person', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    // Navigate to Job Settings tab
    await autoId(page, 'tab-jobSettings').click()
    await autoId(page, 'contact-modal-button').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    await test.step('open contact selection modal', async () => {
      await autoId(page, 'contact-modal-button').click()
      await autoId(page, 'contact-selection-modal').waitFor({ timeout: 10000 })
    })

    await test.step('create a new contact to switch to', async () => {
      // Wait for the form to be ready
      const submitButton = autoId(page, 'contact-form-submit')
      await expect(submitButton).toHaveText('Create Contact', { timeout: 10000 })

      const timestamp = Date.now()
      await autoId(page, 'contact-form-name').fill(`New Contact ${timestamp}`)
      await autoId(page, 'contact-form-email').fill(`newcontact${timestamp}@example.com`)
      await submitButton.click()

      // Wait for modal to close
      await autoId(page, 'contact-selection-modal').waitFor({ state: 'hidden', timeout: 10000 })
    })

    await test.step('verify contact was updated', async () => {
      const contactDisplay = autoId(page, 'contact-display-input')
      await expect(contactDisplay).toHaveValue(/New Contact/, { timeout: 10000 })
    })
  })

  test('change client', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    // Get the shop client name from company defaults
    const companyDefaults = await getCompanyDefaults(page)
    const shopClientName = companyDefaults.shop_client_name as string
    expect(shopClientName).toBeTruthy()
    console.log(`Using shop client name: ${shopClientName}`)

    // Navigate to Job Settings tab
    await autoId(page, 'tab-jobSettings').click()
    await autoId(page, 'settings-change-client-btn').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    await test.step('click Change Client button', async () => {
      await autoId(page, 'settings-change-client-btn').click()
      await autoId(page, 'settings-client-change-panel').waitFor({ timeout: 5000 })
    })

    await test.step('search for and select a different client', async () => {
      const clientChangePanel = autoId(page, 'settings-client-change-panel')
      const clientInput = clientChangePanel.locator('input[type="text"]')

      // Search using first word of shop client name
      await clientInput.fill(shopClientName.split(' ')[0])
      await page.waitForTimeout(1000) // Allow debounce

      const clientOption = page.getByRole('option', { name: new RegExp(shopClientName) })
      await clientOption.waitFor({ timeout: 10000 })
      await clientOption.click()
    })

    await test.step('confirm the client change', async () => {
      await autoId(page, 'settings-confirm-client-btn').click()
      await waitForAutosave(page)
    })

    await test.step('verify client was changed', async () => {
      const clientNameInput = autoId(page, 'settings-client-name')
      await expect(clientNameInput).toHaveValue(new RegExp(shopClientName))
    })

    await test.step('verify change persists after refresh', async () => {
      await page.reload()
      await autoId(page, 'tab-jobSettings').click()
      await autoId(page, 'settings-client-name').waitFor({ timeout: 10000 })

      const clientNameInput = autoId(page, 'settings-client-name')
      await expect(clientNameInput).toHaveValue(new RegExp(shopClientName))
    })
  })
})
