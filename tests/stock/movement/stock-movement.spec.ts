import { test, expect } from '../../fixtures/auth'
import { createTestPurchaseOrder, enableNetworkLogging } from '../../fixtures/helpers'
import type { Page } from '@playwright/test'

test.describe.serial('stock movement integration', () => {
  let poUrl: string
  let poId: string
  let lineDescription: string

  async function waitForPoAutosave(page: Page): Promise<void> {
    await page.waitForResponse(
      (response) => {
        const url = response.url()
        const method = response.request().method()
        const status = response.status()
        return (
          url.includes('/purchasing/rest/purchase-orders/') && method === 'PATCH' && status === 200
        )
      },
      { timeout: 15000 },
    )
  }

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    const username = process.env.E2E_TEST_USERNAME
    const password = process.env.E2E_TEST_PASSWORD
    if (!username || !password) {
      throw new Error('E2E_TEST_USERNAME and E2E_TEST_PASSWORD must be set in .env')
    }

    await page.goto('/login')
    await page.locator('#username').fill(username)
    await page.locator('#password').fill(password)
    await page.getByRole('button', { name: 'Sign In' }).click()
    await page.waitForURL('**/kanban')

    poUrl = await createTestPurchaseOrder(page)
    const poMatch = poUrl.match(/\/purchasing\/po\/([a-f0-9-]+)/i)
    if (!poMatch) {
      throw new Error(`Failed to parse purchase order id from url: ${poUrl}`)
    }
    poId = poMatch[1]

    await context.close()
  })

  test('receipt -> stock list + allocation uses movement id', async ({
    authenticatedPage: page,
  }) => {
    page.removeAllListeners('response')
    enableNetworkLogging(page, 'stock movement integration', { maxResponseKB: 250 })

    lineDescription = `E2E Stock Movement ${Date.now()}`

    await page.goto(poUrl)
    await page.waitForLoadState('networkidle')

    // Add a fresh PO line with unique description + quantity/cost.
    await page.locator('[data-automation-id="PoLinesTable-add-line"]').click()
    const descriptionInputs = page.locator('[data-automation-id^="PoLinesTable-description-"]')
    const lineCount = await descriptionInputs.count()
    const lineIndex = Math.max(0, lineCount - 1)
    await page
      .locator(`[data-automation-id="PoLinesTable-description-${lineIndex}"]`)
      .fill(lineDescription)
    await page.locator(`[data-automation-id="PoLinesTable-quantity-${lineIndex}"]`).fill('5')
    await page.locator(`[data-automation-id="PoLinesTable-unit-cost-${lineIndex}"]`).fill('10')
    await waitForPoAutosave(page)

    // Ensure PO status allows receipts.
    await page.locator('[data-automation-id="PoSummaryCard-status-trigger"]').click()
    await page.locator('[data-automation-id="PoSummaryCard-status-submitted"]').click()
    await waitForPoAutosave(page)

    // Open receipt allocation and save to stock holding job.
    const receiptButton = page
      .locator('table tbody tr')
      .nth(lineIndex)
      .getByRole('button', { name: /Add Allocation|Check Allocations/i })
    await receiptButton.click()

    const receiptPanel = page.locator('text=Receipt Allocation').first()
    await expect(receiptPanel).toBeVisible({ timeout: 10000 })

    const qtyInput = page.locator('.allocation-quantity-input').first()
    await qtyInput.fill('1')

    const receiptResponsePromise = page.waitForResponse((response) => {
      const url = response.url()
      const method = response.request().method()
      return (
        url.includes('/purchasing/rest/delivery-receipts') &&
        method === 'POST' &&
        (response.status() === 200 || response.status() === 201)
      )
    })

    const allocationsResponsePromise = page.waitForResponse((response) => {
      const url = response.url()
      return (
        url.includes(`/purchasing/rest/purchase-orders/${poId}/allocations/`) &&
        response.status() === 200
      )
    })

    await page.getByRole('button', { name: 'Done' }).click()
    await receiptResponsePromise

    const allocationsResponse = await allocationsResponsePromise
    const allocationsBody = await allocationsResponse.json()
    const allocationEntries: Array<[string, AllocationEntry[]]> = Object.entries(
      (allocationsBody?.allocations ?? {}) as Record<string, AllocationEntry[]>,
    )
    let matchedEntry = allocationEntries.find(([, items]) =>
      items.some((alloc) => alloc.description === lineDescription),
    )
    if (!matchedEntry && allocationEntries.length === 1) {
      matchedEntry = allocationEntries[0]
    }
    const lineId = matchedEntry?.[0]
    type AllocationEntry = { type?: string; description?: string; allocation_id?: string | null }
    const allocationsForLine = matchedEntry?.[1] ?? []
    const stockAllocation = allocationsForLine.find(
      (alloc: AllocationEntry) => alloc.type === 'stock',
    )

    if (!lineId) {
      throw new Error(
        `Failed to resolve PO line id from allocations response; keys=${allocationEntries
          .map(([key]) => key)
          .join(',')}`,
      )
    }

    expect(stockAllocation?.allocation_id).toBeTruthy()

    const allocationDetails = await page.request.get(
      `/purchasing/rest/purchase-orders/${poId}/allocations/stock/${stockAllocation.allocation_id}/details/`,
    )
    expect(allocationDetails.ok()).toBeTruthy()

    // Verify stock list shows the new item after receipt.
    await page.goto('/purchasing/stock')
    await page.reload()
    await page.waitForLoadState('networkidle')

    const searchInput = page.getByPlaceholder('Search stock items...')
    await searchInput.fill(lineDescription)

    const stockRow = page.locator('tbody tr', { hasText: lineDescription }).first()
    await expect(stockRow).toBeVisible({ timeout: 20000 })
  })
})
