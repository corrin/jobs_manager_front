import { test, expect } from './fixtures/auth'

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
        const clientInput = page.locator('input[placeholder="Search for a client..."]')
        await clientInput.fill('ABC')

        // Wait for autocomplete dropdown
        await page.waitForSelector('.z-50', { timeout: 3000 })

        // Click on the test client
        console.log('Selecting ABC Carpet Cleaning TEST IGNORE...')
        await page.click('text=ABC Carpet Cleaning TEST IGNORE')

        // Verify selection
        await expect(page.locator('input[placeholder="Search for a client..."]')).toHaveValue(
          'ABC Carpet Cleaning TEST IGNORE',
        )
      })

      await test.step('enter job name', async () => {
        await page.fill('input[placeholder="Enter job name"]', jobName)
      })

      await test.step('select or create contact person', async () => {
        // Click the blue button next to contact input to open modal
        const blueButton = page.locator('button.bg-blue-600').filter({ has: page.locator('svg') })
        console.log('Looking for blue button with svg...')
        await blueButton.click({ timeout: 3000 })

        // Wait for modal
        console.log('Waiting for modal...')
        await page.waitForSelector('[role="dialog"]', { timeout: 3000 })

        if (tc.createContact && tc.contactToCreate) {
          console.log(`Creating new contact: ${tc.contactToCreate.name}`)
          // Fill the Create New Contact form
          await page.fill(
            '[role="dialog"] input[placeholder="Contact name"]',
            tc.contactToCreate.name,
          )
          await page.fill(
            '[role="dialog"] input[placeholder="Email address"]',
            tc.contactToCreate.email,
          )

          // Click Create Contact
          await page.click('[role="dialog"] button:has-text("Create Contact")')
        } else if (tc.contactToSelect) {
          console.log(`Selecting existing contact: ${tc.contactToSelect}`)
          // Wait for contacts list
          await page.waitForSelector('[role="dialog"] button:has-text("Select")', { timeout: 3000 })

          // Hover over contact card to reveal Select button, then click
          const contactCard = page
            .locator('[role="dialog"]')
            .locator(`text=${tc.contactToSelect}`)
            .first()
          await contactCard.hover()
          await page.click(
            `[role="dialog"] button:has-text("Select"):near(:text("${tc.contactToSelect}"))`,
          )
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
