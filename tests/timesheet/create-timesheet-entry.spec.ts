import { test, expect } from '../fixtures/auth'
import type { Page } from '@playwright/test'
import { autoId, waitForAutosave, createTestJob } from '../fixtures/helpers'

/**
 * Tests for timesheet entry operations.
 * Creates a job, adds time via daily timesheet, verifies on job's Actuals tab.
 */

// ============================================================================
// Helper Functions
// ============================================================================

async function navigateToActualsTab(page: Page, jobUrl: string): Promise<void> {
  const baseUrl = jobUrl.split('?')[0]
  await page.goto(baseUrl)
  await page.waitForLoadState('networkidle')
  await autoId(page, 'tab-actual').click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

async function getTimeAndExpensesValue(page: Page): Promise<number> {
  const chip = autoId(page, 'actual-time-expenses')
  const text = await chip.innerText()
  // Extract number from text like "$123.45"
  const match = text.match(/\$?([\d,]+\.?\d*)/)
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0
}

// ============================================================================
// Test Suite: Timesheet Entry Operations
// ============================================================================

test.describe.serial('timesheet entry operations', () => {
  let jobUrl: string
  let jobNumber: string

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Login
    const username = process.env.E2E_TEST_USERNAME
    const password = process.env.E2E_TEST_PASSWORD
    await page.goto('/login')
    await page.locator('#username').fill(username!)
    await page.locator('#password').fill(password!)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/kanban')

    // Create a job for timesheet testing
    jobUrl = await createTestJob(page, 'Timesheet')
    console.log(`Created job at: ${jobUrl}`)

    // Extract job number from the page
    await page.goto(jobUrl.split('?')[0])
    await page.waitForLoadState('networkidle')
    const jobNumberElement = autoId(page, 'job-number').first()
    await jobNumberElement.waitFor({ timeout: 10000 })
    const jobNumberText = await jobNumberElement.innerText()
    const match = jobNumberText.match(/#(\d+)/)
    jobNumber = match ? match[1] : ''
    console.log(`Extracted job number: ${jobNumber}`)
    if (!jobNumber) {
      throw new Error(`Failed to extract job number from: "${jobNumberText}"`)
    }

    await context.close()
  })

  test('verify initial Time & Expenses is zero', async ({ authenticatedPage: page }) => {
    await navigateToActualsTab(page, jobUrl)

    const timeExpenses = await getTimeAndExpensesValue(page)
    console.log(`Initial Time & Expenses: $${timeExpenses}`)
    expect(timeExpenses).toBe(0)
  })

  test('add timesheet entry for the test job', async ({ authenticatedPage: page }) => {
    // Navigate to daily timesheet
    await page.goto('/timesheets/daily')
    await page.waitForLoadState('networkidle')

    // Click first staff name to open their timesheet entry view
    const firstStaffName = page
      .locator('[data-automation-id^="daily-timesheet-staff-name-"]')
      .first()
    await firstStaffName.waitFor({ timeout: 10000 })
    await firstStaffName.click()

    // Wait for timesheet entry view
    await page.waitForURL('**/timesheets/entry**')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click Add Entry button
    await autoId(page, 'timesheet-add-entry').click()
    await page.waitForTimeout(500)

    // Click on the job cell (col-id="jobNumber") to open the job selector
    const jobCell = page.locator('.ag-row').last().locator('[col-id="jobNumber"]')
    await jobCell.click()
    await page.waitForTimeout(300)

    // Type the job number in the search input
    const jobSearchInput = autoId(page, 'timesheet-job-search')
    await jobSearchInput.waitFor({ timeout: 5000 })
    await jobSearchInput.fill(jobNumber)
    await page.waitForTimeout(500)

    // Select the job from the dropdown
    const jobOption = autoId(page, `timesheet-job-option-${jobNumber}`)
    await jobOption.waitFor({ timeout: 5000 })
    await jobOption.click()
    await page.waitForTimeout(500)

    // Enter hours in the hours cell (col-id="hours")
    const hoursCell = page.locator('.ag-row').last().locator('[col-id="hours"]')
    await hoursCell.click()
    await page.waitForTimeout(200)
    await page.keyboard.type('2')
    await page.keyboard.press('Tab')

    await waitForAutosave(page)
    console.log(`Added 2 hours to job ${jobNumber}`)
  })

  test('verify timesheet entry appears on job Actuals tab', async ({ authenticatedPage: page }) => {
    await navigateToActualsTab(page, jobUrl)

    // Time & Expenses should now be > 0
    const timeExpenses = await getTimeAndExpensesValue(page)
    console.log(`Time & Expenses after entry: $${timeExpenses}`)
    expect(timeExpenses).toBeGreaterThan(0)
  })
})
