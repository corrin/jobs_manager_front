import { test, expect } from './fixtures/auth'
import type { Page } from '@playwright/test'

// Helper to find elements by data-automation-id
const autoId = (page: Page, id: string) => page.locator(`[data-automation-id="${id}"]`)

/**
 * Sequential test cases for job creation.
 * These tests MUST run in order as each builds on the previous state:
 * - Test 1: Client has 0 contacts → creates first contact (becomes primary)
 * - Test 2: Client has 1 contact → creates second contact
 * - Test 3: Client has 2 contacts → selects non-primary contact
 */
const jobTestCases = [
  {
    name: 'T&M with first contact',
    pricingValue: 'time_materials',
    ballparkMaterials: '500',
    ballparkHours: '4',
    createContact: true,
    contactToCreate: { name: 'Test Contact Person', email: 'test@example.com' },
    expectedTab: 'estimate',
  },
  {
    name: 'Fixed Price with second contact',
    pricingValue: 'fixed_price',
    ballparkMaterials: '1000',
    ballparkHours: '8',
    createContact: true,
    contactToCreate: { name: 'Another Contact', email: 'another@example.com' },
    expectedTab: 'quote',
  },
  {
    name: 'Fixed Price selecting non-primary contact',
    pricingValue: 'fixed_price',
    ballparkMaterials: '750',
    ballparkHours: '6',
    createContact: false,
    contactToSelect: 'Another Contact', // Select the non-primary contact
    expectedTab: 'quote',
  },
]

// Use describe.serial to ensure tests run in order (they depend on each other)
test.describe.serial('create job', () => {
  for (const tc of jobTestCases) {
    test(`create ${tc.name} job with client and contact`, async ({ authenticatedPage: page }) => {
      // Generate unique job name to avoid conflicts
      const timestamp = Date.now()
      const jobName = `Test Job ${tc.name} ${timestamp}`

      await test.step('navigate to create job page', async () => {
        await page.click('text=Create Job')
        await page.waitForURL('**/jobs/create')
        await expect(page.locator('h1')).toContainText('Create New Job')
      })

      await test.step('search and select client', async () => {
        console.log('Searching for client ABC...')
        const clientInput = autoId(page, 'client-search-input')
        await clientInput.fill('ABC')

        // Wait for results dropdown
        await autoId(page, 'client-search-results').waitFor({ timeout: 3000 })

        // Click on the test client using role
        console.log('Selecting ABC Carpet Cleaning TEST IGNORE...')
        await page.getByRole('option', { name: /ABC Carpet Cleaning TEST IGNORE/ }).click()

        // Verify selection
        await expect(clientInput).toHaveValue('ABC Carpet Cleaning TEST IGNORE')
      })

      await test.step('enter job name', async () => {
        await page.fill('input[placeholder="Enter job name"]', jobName)
      })

      await test.step('select or create contact person', async () => {
        // Click the button to open contact modal
        console.log('Opening contact modal...')
        await autoId(page, 'contact-modal-button').click({ timeout: 3000 })

        // Wait for modal
        console.log('Waiting for modal...')
        await page.waitForSelector('[role="dialog"]', { timeout: 3000 })

        if (tc.createContact && tc.contactToCreate) {
          console.log(`Creating new contact: ${tc.contactToCreate.name}`)
          // Fill the Create New Contact form
          await autoId(page, 'contact-form-name').fill(tc.contactToCreate.name)
          await autoId(page, 'contact-form-email').fill(tc.contactToCreate.email)

          // Click Create Contact
          await autoId(page, 'contact-form-submit').click()
        } else if (tc.contactToSelect) {
          console.log(`Selecting existing contact: ${tc.contactToSelect}`)
          // Wait for contacts list
          await autoId(page, 'contact-select-button').first().waitFor({ timeout: 3000 })

          // Find the contact card by name and click its Select button
          const contactCard = page.locator(`[data-automation-id^="contact-card-"]`).filter({
            hasText: tc.contactToSelect,
          })
          await contactCard.hover()
          await contactCard.locator('[data-automation-id="contact-select-button"]').click()
        }

        // Wait for modal to close
        console.log('Waiting for modal to close...')
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 5000 })
      })

      await test.step('set ballpark estimates', async () => {
        await page.fill('#estimated_materials', tc.ballparkMaterials)
        await page.fill('#estimated_time', tc.ballparkHours)
      })

      await test.step('select pricing method', async () => {
        await page.selectOption('#pricing_methodology', tc.pricingValue)
      })

      await test.step('submit and verify job created', async () => {
        const startTime = Date.now()
        console.log(`[${new Date().toISOString()}] Submitting job...`)
        await page.click('button:has-text("Create Job")')
        console.log(
          `[${new Date().toISOString()}] Clicked Create Job button (${Date.now() - startTime}ms)`,
        )

        // Should redirect to job edit view
        console.log(
          `[${new Date().toISOString()}] Waiting for redirect to job page with tab=${tc.expectedTab}...`,
        )
        await page.waitForURL(`**/jobs/*?*tab=${tc.expectedTab}*`, { timeout: 5000 })
        console.log(`[${new Date().toISOString()}] Redirected (${Date.now() - startTime}ms total)`)

        const url = page.url()
        expect(url).toContain('/jobs/')
        expect(url).toContain(`tab=${tc.expectedTab}`)

        console.log(
          `[${new Date().toISOString()}] Successfully created ${tc.name} job: ${jobName} (${Date.now() - startTime}ms total)`,
        )
      })
    })
  }
})
