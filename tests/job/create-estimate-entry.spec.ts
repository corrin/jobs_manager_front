import { test, expect } from '../fixtures/auth'
import type { Page } from '@playwright/test'
import { autoId, dismissToasts, waitForAutosave } from '../fixtures/helpers'

/**
 * Tests for creating estimate entries on the Estimate tab.
 * These tests verify:
 * - Adding Labour entries
 * - Adding Material entries (using search)
 * - Adding Adjustment entries
 */
test.describe.serial('create estimate entries', () => {
  // Store job URL from the first test to use in subsequent tests
  let createdJobUrl: string

  // Helper to find a row by exact description match in textarea
  async function findRowByDescription(page: Page, description: string) {
    const rows = page.locator('[data-automation-id^="cost-line-row-"]')
    const rowCount = await rows.count()
    for (let i = 0; i < rowCount; i++) {
      const row = rows.nth(i)
      const textarea = row.locator('textarea').first()
      const value = await textarea.inputValue().catch(() => '')
      if (value === description) {
        return row
      }
    }
    return null
  }

  test('create a job for estimate testing', async ({ authenticatedPage: page }) => {
    const timestamp = Date.now()
    const jobName = `Estimate Test Job ${timestamp}`

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
      // Use 0 for ballpark estimates to avoid pre-created rows
      await autoId(page, 'estimated-materials-input').fill('0')
      await autoId(page, 'estimated-time-input').fill('0')
    })

    await test.step('select or create contact', async () => {
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
    })

    await test.step('set pricing method to T&M and submit', async () => {
      // Use T&M so we land on the Estimate tab
      await autoId(page, 'pricing-method-select').selectOption('time_materials')

      await dismissToasts(page)

      await autoId(page, 'create-job-submit').click({ force: true })
      await page.waitForURL('**/jobs/*?*tab=estimate*', { timeout: 15000 })

      createdJobUrl = page.url()
      console.log(`Created job at: ${createdJobUrl}`)
    })
  })

  test('add Labour entry', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    // Make sure we're on the Estimate tab
    await autoId(page, 'tab-estimate').click()
    await page.waitForTimeout(1000) // Wait for tab content to load

    await test.step('click Add row button', async () => {
      await autoId(page, 'cost-lines-add-row').waitFor({ timeout: 10000 })
      await autoId(page, 'cost-lines-add-row').click()
    })

    await test.step('select Labour from item dropdown', async () => {
      // The dropdown auto-opens when a new row is added
      // Wait for options to appear
      const labourOption = autoId(page, 'item-select-option-labour')
      await labourOption.waitFor({ timeout: 10000 })
      await labourOption.click()
    })

    await test.step('verify Labour was selected and update quantity', async () => {
      // Wait for the table to update after selection
      await page.waitForTimeout(1000)

      // Find the row with exact description "Labour"
      const labourRow = await findRowByDescription(page, 'Labour')
      expect(labourRow).not.toBeNull()
      console.log('Found Labour row with exact description match')

      // Click on this row to select it, then update quantity
      await labourRow!.click()

      // The quantity input in the row
      const qtyInput = labourRow!.locator('input').first()
      await qtyInput.click()
      await qtyInput.fill('2')
      await page.keyboard.press('Tab')
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify Labour entry was saved', async () => {
      await page.reload()
      await autoId(page, 'tab-estimate').click()
      await page.waitForTimeout(1000)

      // Verify Labour row exists with exact description
      const labourRow = await findRowByDescription(page, 'Labour')
      expect(labourRow).not.toBeNull()
    })
  })

  test('add Material entry using search', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'tab-estimate').click()
    await page.waitForTimeout(1000)

    await test.step('click Add row button', async () => {
      await autoId(page, 'cost-lines-add-row').waitFor({ timeout: 10000 })
      await autoId(page, 'cost-lines-add-row').click()
    })

    await test.step('search for M8 ZINC and select the wing nut', async () => {
      // The dropdown auto-opens - need to click into the search input
      const searchInput = page.getByPlaceholder('Search items by description, code, or type...')
      await searchInput.waitFor({ timeout: 10000 })
      await searchInput.click()
      await searchInput.fill('M8 ZINC')

      // Wait for filtered results and select the wing nut option
      const wingNutOption = page
        .locator('[data-automation-id^="item-select-option-"]')
        .filter({ hasText: 'M8 ZINC WING NUT' })
      await wingNutOption.waitFor({ timeout: 10000 })
      await wingNutOption.click()
    })

    await test.step('verify material was selected and update quantity', async () => {
      // Wait for the table to update
      await page.waitForTimeout(2000)

      // Find the row with exact description "M8 ZINC WING NUT"
      const materialRow = await findRowByDescription(page, 'M8 ZINC WING NUT')
      expect(materialRow).not.toBeNull()
      console.log('Found M8 ZINC WING NUT row with exact description match')

      // Update quantity
      const qtyInput = materialRow!.locator('input').first()
      await qtyInput.click()
      await qtyInput.fill('10')
      await page.keyboard.press('Tab')
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify Material entry was saved', async () => {
      await page.reload()
      await autoId(page, 'tab-estimate').click()
      await page.waitForTimeout(1000)

      // Verify row exists with exact description
      const materialRow = await findRowByDescription(page, 'M8 ZINC WING NUT')
      expect(materialRow).not.toBeNull()
    })
  })

  test('add Adjustment entry', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'tab-estimate').click()
    await page.waitForTimeout(1000)

    // Count existing rows before adding
    const rowsBefore = await page.locator('[data-automation-id^="cost-line-row-"]').count()
    console.log(`Rows before adding adjustment: ${rowsBefore}`)

    await test.step('click Add row button', async () => {
      await autoId(page, 'cost-lines-add-row').waitFor({ timeout: 10000 })
      await autoId(page, 'cost-lines-add-row').click()
    })

    await test.step('close the item dropdown and fill adjustment details manually', async () => {
      // Press Escape to close the auto-opened dropdown
      await page.keyboard.press('Escape')
      await page.waitForTimeout(500)

      // Find the newly added row (should be the last one)
      const rows = page.locator('[data-automation-id^="cost-line-row-"]')
      const newRow = rows.last()

      // Click on description input and fill it
      const descInput = newRow.locator('textarea').first()
      await descInput.click()
      await descInput.fill('Discount - repeat customer')
      await page.keyboard.press('Tab')

      // Fill quantity
      await page.keyboard.type('1')
      await page.keyboard.press('Tab')

      // Fill unit cost (negative for discount)
      await page.keyboard.type('-50')
      await page.keyboard.press('Tab')

      // Fill unit revenue (also negative)
      await page.keyboard.type('-50')
      await page.keyboard.press('Tab')
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify Adjustment entry was saved', async () => {
      await page.reload()
      await autoId(page, 'tab-estimate').click()
      await page.waitForTimeout(1000)

      // Verify row exists with exact description
      const adjustmentRow = await findRowByDescription(page, 'Discount - repeat customer')
      expect(adjustmentRow).not.toBeNull()
    })
  })

  test('verify all entries persist after reload', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'tab-estimate').click()
    await page.waitForTimeout(1000)

    await test.step('verify all 3 entry types exist', async () => {
      // Verify each entry type is present with exact description matches
      const labourRow = await findRowByDescription(page, 'Labour')
      const materialRow = await findRowByDescription(page, 'M8 ZINC WING NUT')
      const adjustmentRow = await findRowByDescription(page, 'Discount - repeat customer')

      expect(labourRow).not.toBeNull()
      expect(materialRow).not.toBeNull()
      expect(adjustmentRow).not.toBeNull()

      console.log('All 3 entry types verified with exact description matches:')
      console.log('  - Labour')
      console.log('  - M8 ZINC WING NUT')
      console.log('  - Discount - repeat customer')
    })
  })
})
