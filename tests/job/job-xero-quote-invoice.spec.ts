import { test, expect } from '../fixtures/auth'
import { autoId } from '../fixtures/helpers'

const getJobIdFromUrl = (url: string): string => {
  const match = url.match(/\/jobs\/([a-f0-9-]+)/i)
  if (!match) {
    throw new Error(`Unable to parse job id from url: ${url}`)
  }
  return match[1]
}

test.describe.serial('job xero quote and invoice', () => {
  test.setTimeout(120000)

  test('create quote in Xero from Quote tab', async ({ authenticatedPage: page, sharedEditJobUrl }) => {
    const jobId = getJobIdFromUrl(sharedEditJobUrl)

    await page.goto(sharedEditJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'JobViewTabs-quote').waitFor({ timeout: 10000 })
    await autoId(page, 'JobViewTabs-quote').click()

    const createQuoteButton = page.getByRole('button', { name: 'Create Quote' })
    if ((await createQuoteButton.count()) > 0) {
      await createQuoteButton.click()
      await expect(page.getByText('Export Quote to Xero')).toBeVisible({ timeout: 10000 })

      const responsePromise = page.waitForResponse((response) => {
        return (
          response.url().includes(`/api/xero/create_quote/${jobId}`) &&
          response.request().method() === 'POST'
        )
      }, { timeout: 120000 })

      await page.getByRole('button', { name: 'Send Total Only' }).click()
      const response = await responsePromise
      expect(response.ok()).toBeTruthy()
    }

    await expect(page.getByRole('button', { name: /Open in Xero/ })).toBeVisible({ timeout: 20000 })
  })

  test('create invoice in Xero from Actual tab', async ({
    authenticatedPage: page,
    sharedEditJobUrl,
  }) => {
    const jobId = getJobIdFromUrl(sharedEditJobUrl)

    await page.goto(sharedEditJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'JobViewTabs-actual').click()

    const invoiceItems = page.locator('ul[role="list"] li')
    const initialCount = await invoiceItems.count()

    const createInvoiceButton = page.getByRole('button', { name: /Create .*Invoice/ })
    await expect(createInvoiceButton).toBeVisible({ timeout: 10000 })

    const responsePromise = page.waitForResponse((response) => {
      return (
        response.url().includes(`/api/xero/create_invoice/${jobId}`) &&
        response.request().method() === 'POST'
      )
    }, { timeout: 120000 })

    await createInvoiceButton.click()
    const response = await responsePromise
    expect(response.ok()).toBeTruthy()

    await expect(invoiceItems).toHaveCount(initialCount + 1, { timeout: 20000 })
  })
})
