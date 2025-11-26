import { test, expect } from './fixtures/auth'

/**
 * Test cases for job creation with different pricing types
 */
const jobTestCases = [
  {
    name: 'Time & Materials',
    pricingValue: 'time_materials',
    ballparkMaterials: '500',
    ballparkHours: '4',
    createContact: true,
    contactToCreate: { name: 'Test Contact Person', email: 'test@example.com' },
    expectedTab: 'estimate', // T&M jobs go to estimate tab
  },
  {
    name: 'Fixed Price (reuse contact)',
    pricingValue: 'fixed_price',
    ballparkMaterials: '1000',
    ballparkHours: '8',
    createContact: false,
    contactToSelect: 'Test Contact Person', // Reuse contact created by first test
    expectedTab: 'quote', // Fixed price jobs go to quote tab
  },
  {
    name: 'Fixed Price (new contact)',
    pricingValue: 'fixed_price',
    ballparkMaterials: '750',
    ballparkHours: '6',
    createContact: true,
    contactToCreate: { name: 'Another Contact', email: 'another@example.com' },
    expectedTab: 'quote',
  },
]

test.describe('create job', () => {
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
        // Client search requires 3+ characters
        const clientInput = page.locator('input[placeholder="Search for a client..."]')
        await clientInput.fill('ABC')

        // Wait for autocomplete suggestions to appear
        await page.waitForSelector('.z-50', { timeout: 10000 })

        // Click on the test client
        await page.click('text=ABC Carpet Cleaning TEST IGNORE')

        // Verify client was selected (client name should be in the input)
        await expect(page.locator('input[placeholder="Search for a client..."]')).toHaveValue(
          'ABC Carpet Cleaning TEST IGNORE',
        )
      })

      await test.step('enter job name', async () => {
        await page.fill('input[placeholder="Enter job name"]', jobName)
      })

      await test.step('select or create contact person', async () => {
        // Click the contact input to open the modal
        await page.click('input[placeholder="Search or add contact person"]')

        // Wait for contact selection modal
        await page.waitForSelector('[role="dialog"]', { timeout: 10000 })

        if (tc.createContact && tc.contactToCreate) {
          // Create a new contact
          const nameInput = page.locator('[role="dialog"] input[placeholder="Contact name"]')
          await nameInput.fill(tc.contactToCreate.name)

          const emailInput = page.locator('[role="dialog"] input[placeholder="Email address"]')
          await emailInput.fill(tc.contactToCreate.email)

          // Click Create Contact button - this creates the contact, selects it, and closes the modal
          await page.click('[role="dialog"] button:has-text("Create Contact")')
        } else if (tc.contactToSelect) {
          // Select an existing contact by name
          // Find the contact row containing the name and click its Select button
          const contactRow = page
            .locator(`[role="dialog"]`)
            .locator(`text=${tc.contactToSelect}`)
            .locator('xpath=ancestor::div[contains(@class, "flex")]')
          await contactRow.locator('button:has-text("Select")').click()
        }

        // Wait for modal to close (happens automatically after create or select)
        await page.waitForSelector('[role="dialog"]', { state: 'hidden', timeout: 15000 })
      })

      await test.step('set ballpark estimates', async () => {
        await page.fill('#estimated_materials', tc.ballparkMaterials)
        await page.fill('#estimated_time', tc.ballparkHours)
      })

      await test.step('select pricing method', async () => {
        await page.selectOption('#pricing_methodology', tc.pricingValue)
      })

      await test.step('submit and verify job created', async () => {
        // Take screenshot before submit for debugging
        await page.screenshot({
          path: `test-results/create-job-${tc.pricingValue}-before-submit.png`,
        })

        // Click Create Job button
        await page.click('button:has-text("Create Job")')

        // Should redirect to job edit view with appropriate tab (URL format: /jobs/{id}?tab=estimate)
        await page.waitForURL(`**/jobs/*?*tab=${tc.expectedTab}*`, { timeout: 30000 })

        // Verify we're on the job page
        const url = page.url()
        expect(url).toContain('/jobs/')
        expect(url).toContain(`tab=${tc.expectedTab}`)

        // Take screenshot of created job
        await page.screenshot({ path: `test-results/create-job-${tc.pricingValue}-created.png` })

        console.log(`Successfully created ${tc.name} job: ${jobName}`)
      })
    })
  }
})
