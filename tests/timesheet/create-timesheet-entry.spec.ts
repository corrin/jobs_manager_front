import { test, expect } from '../fixtures/auth'
import type { Page } from '@playwright/test'
import { autoId, createTestJob, gridCell } from '../fixtures/helpers'

/**
 * Tests for timesheet entry operations.
 * Creates a job, adds time via daily timesheet, verifies on job's Actuals tab.
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get a weekday date string (YYYY-MM-DD) - skips weekends
 */
function getWeekdayDate(): string {
  const date = new Date()
  const day = date.getDay()
  // If Saturday (6), go back to Friday (-1 day)
  // If Sunday (0), go back to Friday (-2 days)
  if (day === 6) date.setDate(date.getDate() - 1)
  if (day === 0) date.setDate(date.getDate() - 2)
  return date.toISOString().split('T')[0]
}

async function navigateToActualsTab(page: Page, jobUrl: string): Promise<void> {
  const baseUrl = jobUrl.split('?')[0]
  await page.goto(baseUrl)
  await page.waitForLoadState('networkidle')
  await autoId(page, 'JobViewTabs-actual').click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2000)
}

async function getTimeAndExpensesValue(page: Page): Promise<number> {
  const chip = autoId(page, 'JobActualTab-time-expenses')
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
    const jobNumberElement = autoId(page, 'JobView-job-number').first()
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
    // Navigate to daily timesheet with a weekday date (weekends may be disabled)
    const weekday = getWeekdayDate()
    await page.goto(`/timesheets/daily?date=${weekday}`)
    await page.waitForLoadState('networkidle')

    // Click first staff name to open their timesheet entry view
    const firstStaffName = page.locator('[data-automation-id^="StaffRow-name-"]').first()
    await firstStaffName.waitFor({ timeout: 10000 })
    await firstStaffName.click()

    // Wait for timesheet entry view
    await page.waitForURL('**/timesheets/entry**')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    // Click Add Entry button and wait for new row
    await autoId(page, 'TimesheetEntryView-add-entry').click()
    await page.waitForTimeout(500)

    // Capture the new row's ID (tempId starts with "temp_")
    const newRow = page.locator('.ag-row[row-id^="temp_"]').first()
    await newRow.waitFor({ timeout: 10000 })
    const rowId = await newRow.getAttribute('row-id')
    if (!rowId) throw new Error('Failed to get row-id from new row')
    console.log(`New row created with ID: ${rowId}`)

    // Click on the job cell to open the job selector
    await gridCell(page, rowId, 'jobNumber').click()
    await page.waitForTimeout(300)

    // Type the job number in the search input
    const jobSearchInput = autoId(page, 'TimesheetEntryJobCellEditor-job-search')
    await jobSearchInput.waitFor({ timeout: 5000 })
    await jobSearchInput.fill(jobNumber)
    await page.waitForTimeout(500)

    // Select the job from the dropdown
    const jobOption = autoId(page, `TimesheetEntryJobCellEditor-option-${jobNumber}`)
    await jobOption.waitFor({ timeout: 5000 })
    await jobOption.click()
    await page.waitForTimeout(500)

    // Enter hours in the same row
    await gridCell(page, rowId, 'hours').click()
    await page.waitForTimeout(200)
    await page.keyboard.type('2')
    await page.keyboard.press('Tab')

    // Wait for autosave debounce (800ms) + save time
    // The UI shows the data immediately, but we need to wait for the backend save
    await page.waitForTimeout(2000)

    // Verify the hours were entered by checking the cell value
    const hoursText = await gridCell(page, rowId, 'hours').textContent()
    expect(hoursText).toContain('2')
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
