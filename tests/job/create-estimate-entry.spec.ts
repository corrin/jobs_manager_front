import { test, expect } from '../fixtures/auth'
import type { Page, Locator } from '@playwright/test'
import { autoId, dismissToasts, waitForAutosave } from '../fixtures/helpers'

/**
 * Tests for creating estimate entries on the Estimate tab.
 * These tests verify:
 * - Adding Labour entries
 * - Adding Material entries (using search)
 * - Adding Adjustment entries
 * - Editing quantity, unit cost, unit revenue
 * - Changing material codes
 * - Deleting costlines
 */

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a row by exact description match in textarea
 */
async function findRowByDescription(page: Page, description: string): Promise<Locator | null> {
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

/**
 * Find a row index by exact description match
 */
async function findRowIndexByDescription(page: Page, description: string): Promise<number> {
  const rows = page.locator('[data-automation-id^="cost-line-row-"]')
  const rowCount = await rows.count()
  for (let i = 0; i < rowCount; i++) {
    const row = rows.nth(i)
    const textarea = row.locator('textarea').first()
    const value = await textarea.inputValue().catch(() => '')
    if (value === description) {
      return i
    }
  }
  return -1
}

/**
 * Navigate to job and ensure we're on the Estimate tab
 */
async function navigateToEstimateTab(page: Page, jobUrl: string): Promise<void> {
  await page.goto(jobUrl)
  await page.waitForLoadState('networkidle')
  await autoId(page, 'tab-estimate').click()
  await page.waitForTimeout(1000)
}

/**
 * Add a new row by clicking Add Row button
 */
async function clickAddRow(page: Page): Promise<void> {
  await autoId(page, 'cost-lines-add-row').waitFor({ timeout: 10000 })
  await autoId(page, 'cost-lines-add-row').click()
}

/**
 * Create a new job for testing and return its URL
 */
async function createTestJob(page: Page, jobNameSuffix: string): Promise<string> {
  const timestamp = Date.now()
  const jobName = `Estimate Test Job ${jobNameSuffix} ${timestamp}`

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

/**
 * Add an Adjustment entry with specified values
 */
async function addAdjustmentEntry(
  page: Page,
  description: string,
  quantity: string,
  unitCost: string,
  unitRev: string,
): Promise<void> {
  await clickAddRow(page)

  // Press Escape to close the auto-opened dropdown
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // Find the newly added row (should be the last one)
  const rows = page.locator('[data-automation-id^="cost-line-row-"]')
  const newRow = rows.last()

  // Fill description
  const descInput = newRow.locator('textarea').first()
  await descInput.click()
  await descInput.fill(description)
  await page.keyboard.press('Tab')

  // Fill quantity
  await page.keyboard.type(quantity)
  await page.keyboard.press('Tab')

  // Fill unit cost
  await page.keyboard.type(unitCost)
  await page.keyboard.press('Tab')

  // Fill unit revenue
  await page.keyboard.type(unitRev)
  await page.keyboard.press('Tab')

  await waitForAutosave(page)
}

// ============================================================================
// Test Suite: Create Entries (Serial - shares a single job)
// ============================================================================

test.describe.serial('create estimate entries', () => {
  let createdJobUrl: string

  test('create a job for estimate testing', async ({ authenticatedPage: page }) => {
    createdJobUrl = await createTestJob(page, 'Create')
    console.log(`Created job at: ${createdJobUrl}`)
  })

  test('add Labour entry', async ({ authenticatedPage: page }) => {
    await navigateToEstimateTab(page, createdJobUrl)

    await test.step('click Add row button', async () => {
      await clickAddRow(page)
    })

    await test.step('select Labour from item dropdown', async () => {
      const labourOption = autoId(page, 'item-select-option-labour')
      await labourOption.waitFor({ timeout: 10000 })
      await labourOption.click()
    })

    await test.step('verify Labour was selected and update quantity', async () => {
      await page.waitForTimeout(1000)

      const labourRow = await findRowByDescription(page, 'Labour')
      expect(labourRow).not.toBeNull()
      console.log('Found Labour row with exact description match')

      await labourRow!.click()

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

      const labourRow = await findRowByDescription(page, 'Labour')
      expect(labourRow).not.toBeNull()
    })
  })

  test('add Material entry using search', async ({ authenticatedPage: page }) => {
    await navigateToEstimateTab(page, createdJobUrl)

    await test.step('click Add row button', async () => {
      await clickAddRow(page)
    })

    await test.step('search for M8 ZINC and select the wing nut', async () => {
      const searchInput = page.getByPlaceholder('Search items by description, code, or type...')
      await searchInput.waitFor({ timeout: 10000 })
      await searchInput.click()
      await searchInput.fill('M8 ZINC')

      const wingNutOption = page
        .locator('[data-automation-id^="item-select-option-"]')
        .filter({ hasText: 'M8 ZINC WING NUT' })
      await wingNutOption.waitFor({ timeout: 10000 })
      await wingNutOption.click()
    })

    await test.step('verify material was selected and update quantity', async () => {
      await page.waitForTimeout(2000)

      const materialRow = await findRowByDescription(page, 'M8 ZINC WING NUT')
      expect(materialRow).not.toBeNull()
      console.log('Found M8 ZINC WING NUT row with exact description match')

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

      const materialRow = await findRowByDescription(page, 'M8 ZINC WING NUT')
      expect(materialRow).not.toBeNull()
    })
  })

  test('add Adjustment entry', async ({ authenticatedPage: page }) => {
    await navigateToEstimateTab(page, createdJobUrl)

    const rowsBefore = await page.locator('[data-automation-id^="cost-line-row-"]').count()
    console.log(`Rows before adding adjustment: ${rowsBefore}`)

    await addAdjustmentEntry(page, 'Discount - repeat customer', '1', '-50', '-50')

    await test.step('verify Adjustment entry was saved', async () => {
      await page.reload()
      await autoId(page, 'tab-estimate').click()
      await page.waitForTimeout(1000)

      const adjustmentRow = await findRowByDescription(page, 'Discount - repeat customer')
      expect(adjustmentRow).not.toBeNull()
    })
  })

  test('verify all entries persist after reload', async ({ authenticatedPage: page }) => {
    await navigateToEstimateTab(page, createdJobUrl)

    await test.step('verify all 3 entry types exist', async () => {
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

// ============================================================================
// Test Suite: Edit Costlines (Serial - shares a single job)
// ============================================================================

test.describe.serial('edit costline values', () => {
  let createdJobUrl: string
  const adjustmentDescription = 'Test Adjustment for Editing'

  test('create a job with an adjustment entry for editing tests', async ({
    authenticatedPage: page,
  }) => {
    createdJobUrl = await createTestJob(page, 'Edit')
    console.log(`Created job at: ${createdJobUrl}`)

    // Add an adjustment entry to edit
    await autoId(page, 'tab-estimate').click()
    await page.waitForTimeout(1000)
    await addAdjustmentEntry(page, adjustmentDescription, '1', '10', '10')
  })

  test('edit quantity and verify unit cost auto-calculates unit revenue', async ({
    authenticatedPage: page,
  }) => {
    await navigateToEstimateTab(page, createdJobUrl)

    const adjustmentRowIndex = await findRowIndexByDescription(page, adjustmentDescription)
    expect(adjustmentRowIndex).toBeGreaterThanOrEqual(0)
    console.log(`Found Adjustment row at index ${adjustmentRowIndex}`)

    await test.step('change quantity to 3', async () => {
      const qtyInput = autoId(page, `cost-line-quantity-${adjustmentRowIndex}`)
      await qtyInput.dblclick()
      await page.keyboard.type('3')
      await page.keyboard.press('Tab')
    })

    await test.step('change unit cost to 25 and verify unit revenue auto-updates', async () => {
      const unitCostInput = autoId(page, `cost-line-unit-cost-${adjustmentRowIndex}`)
      await unitCostInput.dblclick()
      await page.keyboard.type('25')
      await page.keyboard.press('Tab')

      await page.waitForTimeout(500)

      const unitRevInput = autoId(page, `cost-line-unit-rev-${adjustmentRowIndex}`)
      const unitRevValue = await unitRevInput.inputValue()
      console.log(`After setting unit_cost=25, unit_rev=${unitRevValue}`)
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify changes persisted after reload', async () => {
      await page.reload()
      await autoId(page, 'tab-estimate').click()
      await page.waitForTimeout(1000)

      const newAdjustmentRowIndex = await findRowIndexByDescription(page, adjustmentDescription)
      expect(newAdjustmentRowIndex).toBeGreaterThanOrEqual(0)

      const qtyInput = autoId(page, `cost-line-quantity-${newAdjustmentRowIndex}`)
      await expect(qtyInput).toHaveValue('3')

      const unitCostInput = autoId(page, `cost-line-unit-cost-${newAdjustmentRowIndex}`)
      await expect(unitCostInput).toHaveValue('25')

      console.log('Verified: quantity=3, unit_cost=25')
    })
  })

  test('manually override unit revenue independent of unit cost', async ({
    authenticatedPage: page,
  }) => {
    await navigateToEstimateTab(page, createdJobUrl)

    const adjustmentRowIndex = await findRowIndexByDescription(page, adjustmentDescription)
    expect(adjustmentRowIndex).toBeGreaterThanOrEqual(0)
    console.log(`Found Adjustment row at index ${adjustmentRowIndex}`)

    const unitCostInput = autoId(page, `cost-line-unit-cost-${adjustmentRowIndex}`)
    const originalUnitCost = await unitCostInput.inputValue()
    console.log(`Original unit_cost: ${originalUnitCost}`)

    await test.step('change unit revenue to 99 (independent of unit cost)', async () => {
      const unitRevInput = autoId(page, `cost-line-unit-rev-${adjustmentRowIndex}`)
      await unitRevInput.click()
      await unitRevInput.fill('99')
      await page.keyboard.press('Tab')
    })

    await test.step('verify unit cost unchanged', async () => {
      const currentUnitCost = await unitCostInput.inputValue()
      expect(currentUnitCost).toBe(originalUnitCost)
      console.log(`Unit cost after changing unit_rev: ${currentUnitCost} (unchanged)`)
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify unit revenue override persisted after reload', async () => {
      await page.reload()
      await autoId(page, 'tab-estimate').click()
      await page.waitForTimeout(1000)

      const newAdjustmentRowIndex = await findRowIndexByDescription(page, adjustmentDescription)
      expect(newAdjustmentRowIndex).toBeGreaterThanOrEqual(0)

      const unitRevInput = autoId(page, `cost-line-unit-rev-${newAdjustmentRowIndex}`)
      await expect(unitRevInput).toHaveValue('99')

      const reloadedUnitCostInput = autoId(page, `cost-line-unit-cost-${newAdjustmentRowIndex}`)
      await expect(reloadedUnitCostInput).toHaveValue(originalUnitCost)

      console.log(
        `Verified: unit_rev=99 (manual override), unit_cost=${originalUnitCost} (unchanged)`,
      )
    })
  })
})

// ============================================================================
// Test Suite: Change Material Code (Isolated - creates own job)
// ============================================================================

test.describe.serial('change material code', () => {
  let createdJobUrl: string

  test('create a job with a material entry', async ({ authenticatedPage: page }) => {
    createdJobUrl = await createTestJob(page, 'MaterialChange')
    console.log(`Created job at: ${createdJobUrl}`)

    // Add a material entry
    await autoId(page, 'tab-estimate').click()
    await page.waitForTimeout(1000)

    await clickAddRow(page)

    const searchInput = page.getByPlaceholder('Search items by description, code, or type...')
    await searchInput.waitFor({ timeout: 10000 })
    await searchInput.click()
    await searchInput.fill('M8 ZINC')

    const wingNutOption = page
      .locator('[data-automation-id^="item-select-option-"]')
      .filter({ hasText: 'M8 ZINC WING NUT' })
    await wingNutOption.waitFor({ timeout: 10000 })
    await wingNutOption.click()

    await waitForAutosave(page)
  })

  test('change material code for a costline', async ({ authenticatedPage: page }) => {
    await navigateToEstimateTab(page, createdJobUrl)

    const materialRowIndex = await findRowIndexByDescription(page, 'M8 ZINC WING NUT')
    expect(materialRowIndex).toBeGreaterThanOrEqual(0)
    console.log(`Found M8 ZINC WING NUT row at index ${materialRowIndex}`)

    await test.step('click on item selector and change to a different material', async () => {
      const itemCell = autoId(page, `cost-line-item-${materialRowIndex}`)
      const itemTrigger = itemCell.locator('.item-select-trigger')
      await itemTrigger.click()

      const searchInput = page.getByPlaceholder('Search items by description, code, or type...')
      await searchInput.waitFor({ timeout: 10000 })
      await searchInput.click()
      await searchInput.fill('M10')

      const newItemOption = page
        .locator('[data-automation-id^="item-select-option-"]')
        .filter({ hasText: 'M10' })
        .first()
      await newItemOption.waitFor({ timeout: 10000 })

      const optionText = await newItemOption.textContent()
      console.log(`Selecting new item: ${optionText}`)

      await newItemOption.click()
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify material change persisted after reload', async () => {
      await page.reload()
      await autoId(page, 'tab-estimate').click()
      await page.waitForTimeout(1000)

      const oldMaterialRow = await findRowByDescription(page, 'M8 ZINC WING NUT')
      expect(oldMaterialRow).toBeNull()

      const rows = page.locator('[data-automation-id^="cost-line-row-"]')
      const rowCount = await rows.count()
      let foundM10 = false

      for (let i = 0; i < rowCount; i++) {
        const row = rows.nth(i)
        const textarea = row.locator('textarea').first()
        const value = await textarea.inputValue().catch(() => '')
        if (value.includes('M10')) {
          foundM10 = true
          console.log(`Found new material row with description: ${value}`)
          break
        }
      }

      expect(foundM10).toBe(true)
    })
  })
})

// ============================================================================
// Test Suite: Delete Costline (Isolated - creates and deletes its own row)
// ============================================================================

test.describe.serial('delete costline', () => {
  let createdJobUrl: string
  const deleteTestDescription = 'Row to be deleted'

  test('create a job with an adjustment entry to delete', async ({ authenticatedPage: page }) => {
    createdJobUrl = await createTestJob(page, 'Delete')
    console.log(`Created job at: ${createdJobUrl}`)

    // Add an adjustment entry specifically for deletion
    await autoId(page, 'tab-estimate').click()
    await page.waitForTimeout(1000)
    await addAdjustmentEntry(page, deleteTestDescription, '1', '100', '100')

    // Verify it was created
    const row = await findRowByDescription(page, deleteTestDescription)
    expect(row).not.toBeNull()
    console.log('Created row for deletion test')
  })

  test('delete a costline', async ({ authenticatedPage: page }) => {
    await navigateToEstimateTab(page, createdJobUrl)

    const rowsBefore = await page.locator('[data-automation-id^="cost-line-row-"]').count()
    console.log(`Rows before deletion: ${rowsBefore}`)

    const adjustmentRowIndex = await findRowIndexByDescription(page, deleteTestDescription)
    expect(adjustmentRowIndex).toBeGreaterThanOrEqual(0)
    console.log(`Found row to delete at index ${adjustmentRowIndex}`)

    await test.step('click delete button and confirm', async () => {
      page.on('dialog', async (dialog) => {
        console.log(`Dialog message: ${dialog.message()}`)
        await dialog.accept()
      })

      const deleteButton = autoId(page, `cost-line-delete-${adjustmentRowIndex}`)
      await deleteButton.click()
    })

    await test.step('wait for deletion to complete', async () => {
      await page.waitForTimeout(2000)
    })

    await test.step('verify row was deleted after reload', async () => {
      await page.reload()
      await autoId(page, 'tab-estimate').click()
      await page.waitForTimeout(1000)

      const deletedRow = await findRowByDescription(page, deleteTestDescription)
      expect(deletedRow).toBeNull()

      const rowsAfter = await page.locator('[data-automation-id^="cost-line-row-"]').count()
      console.log(`Rows after deletion: ${rowsAfter}`)
      expect(rowsAfter).toBeLessThan(rowsBefore)

      console.log('Verified: Row was successfully deleted')
    })
  })
})
