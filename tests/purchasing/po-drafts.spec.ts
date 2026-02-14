import { test, expect } from '../fixtures/auth'
import { autoId, dismissToasts, TEST_CLIENT_NAME } from '../fixtures/helpers'

test.describe('purchase order local drafts', () => {
  test('draft persists in list and can be resumed', async ({ authenticatedPage: page }) => {
    await page.goto('/purchasing/po/new')
    await page.waitForLoadState('networkidle')

    const supplierInput = autoId(page, 'ClientLookup-input')
    await supplierInput.click()
    await supplierInput.fill('ABC')
    await page.waitForTimeout(500)
    await autoId(page, 'ClientLookup-results').waitFor({ timeout: 10000 })
    await page.getByRole('option', { name: new RegExp(TEST_CLIENT_NAME) }).click()
    await expect(supplierInput).toHaveValue(TEST_CLIENT_NAME)

    await autoId(page, 'PoSummaryCard-reference').fill('Draft regression test')
    await autoId(page, 'PoLinesTable-add-line').click()
    await autoId(page, 'PoLinesTable-description-0').fill('Draft line')
    await autoId(page, 'PoLinesTable-unit-cost-0').fill('10')
    await dismissToasts(page)
    await page.waitForTimeout(800)

    const poNumberLabel = autoId(page, 'PoSummaryCard-po-number')
    await expect(poNumberLabel).toBeVisible({ timeout: 10000 })
    const poNumberText = (await poNumberLabel.innerText()).replace('PO #', '').trim()
    expect(poNumberText.length).toBeGreaterThan(0)

    await page.goto('/purchasing/po')
    await page.waitForLoadState('networkidle')

    const draftRow = page.locator('tr', { hasText: poNumberText })
    await expect(draftRow).toBeVisible({ timeout: 10000 })
    await expect(draftRow.locator('[data-automation-id^="PurchaseOrderView-status-"]')).toHaveText(
      /Local Draft/i,
    )

    await draftRow.locator('a').first().click()
    await page.waitForURL('**/purchasing/po/new?draft=*')
    await expect(autoId(page, 'PoSummaryCard-po-number')).toContainText(poNumberText)
  })
})
