import { test, expect } from './fixtures/auth'

test('test can call backend API directly', async ({ authenticatedPage: page }) => {
  const apiBaseUrl = process.env.VITE_API_BASE_URL
  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL must be set in .env')
  }

  // Use the page's request context which shares cookies/state with the browser
  // Cookie-based auth is handled automatically by the browser session
  const response = await page.request.get(`${apiBaseUrl}/api/company-defaults/`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      Accept: 'application/json',
    },
  })

  console.log(`API response status: ${response.status()}`)

  // If we get HTML back, log it for debugging
  const contentType = response.headers()['content-type'] || ''
  if (!contentType.includes('application/json')) {
    const text = await response.text()
    console.log(`Unexpected content-type: ${contentType}`)
    console.log(`Response body (first 500 chars): ${text.substring(0, 500)}`)
  }

  expect(response.ok()).toBeTruthy()
  expect(contentType).toContain('application/json')

  const data = await response.json()
  expect(data.test_client_name).toBeDefined()
  expect(data.test_client_name).not.toBe('')

  console.log(`Test client name from API: ${data.test_client_name}`)
})

test('test company defaults edit and save', async ({ authenticatedPage: page }) => {
  // Navigate to the admin company page
  await page.goto('/admin/company')

  // Wait for the section buttons to load
  await page.waitForSelector('[data-automation-id="AdminCompanyView-company-button"]', {
    timeout: 15000,
  })

  // Click Company section to open modal
  await page.click('[data-automation-id="AdminCompanyView-company-button"]')

  // Wait for modal to open
  await page.waitForSelector('[data-automation-id="SectionModal-content"]', { timeout: 10000 })

  // Find the company name input (first text input in the modal)
  const companyNameInput = page
    .locator('[data-automation-id="SectionModal-content"] input[type="text"]')
    .first()
  await expect(companyNameInput).toBeVisible()

  // Get the original value
  const originalValue = await companyNameInput.inputValue()
  console.log(`Original company name: ${originalValue}`)

  // Change to a test value with timestamp
  const testValue = `Test Company ${Date.now()}`
  await companyNameInput.clear()
  await companyNameInput.fill(testValue)
  console.log(`Changed company name to: ${testValue}`)

  // Close the modal
  await page.click('button:has-text("Close")')

  // Wait for modal to close
  await expect(page.locator('[data-automation-id="SectionModal-content"]')).not.toBeVisible({
    timeout: 5000,
  })

  // Click Save All
  await page.click('button:has-text("Save All")')

  // Wait for save to complete (toast appears)
  await page.waitForTimeout(1500)

  // Reopen the Company section
  await page.click('[data-automation-id="AdminCompanyView-company-button"]')
  await page.waitForSelector('[data-automation-id="SectionModal-content"]', { timeout: 10000 })

  // Verify the value persisted
  const savedValue = await page
    .locator('[data-automation-id="SectionModal-content"] input[type="text"]')
    .first()
    .inputValue()
  console.log(`Saved company name: ${savedValue}`)
  expect(savedValue).toBe(testValue)

  // Restore original value
  const inputToRestore = page
    .locator('[data-automation-id="SectionModal-content"] input[type="text"]')
    .first()
  await inputToRestore.clear()
  await inputToRestore.fill(originalValue)

  // Close modal and save
  await page.click('button:has-text("Close")')
  await expect(page.locator('[data-automation-id="SectionModal-content"]')).not.toBeVisible({
    timeout: 5000,
  })
  await page.click('button:has-text("Save All")')

  console.log(`Restored company name to: ${originalValue}`)
})
