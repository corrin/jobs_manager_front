import { test, expect } from './fixtures/auth'

test('test can call backend API directly', async ({ authenticatedPage: page }) => {
  const apiBaseUrl = process.env.VITE_API_BASE_URL
  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL must be set in .env')
  }

  // Get the auth token that the app stored after login
  const authToken = await page.evaluate(() => localStorage.getItem('auth_token'))
  expect(authToken).not.toBeNull()

  // Use the page's request context which shares cookies/state with the browser
  const response = await page.request.get(`${apiBaseUrl}/api/company-defaults/`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
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

test('test company defaults via app store', async ({ authenticatedPage: page }) => {
  // The app loads company defaults on startup (see App.vue onMounted)
  // We can verify this by navigating to the admin company page and checking the General settings

  // Navigate to the admin company page
  await page.goto('/admin/company')

  // Wait for the card-based UI to load and click on "General" to see the form
  await page.waitForSelector('[data-automation-id="AdminCompanyView-general-button"]', {
    timeout: 15000,
  })
  await page.click('[data-automation-id="AdminCompanyView-general-button"]')

  // Wait for the General settings form to load with input fields
  await page.waitForSelector('input', { timeout: 15000 })

  // Take a screenshot for debugging
  await page.screenshot({ path: 'test-results/company-defaults-general.png' })

  // Verify the page loaded properly by checking for company-related content
  // The Company Defaults page should have loaded and display form fields
  const hasInputs = await page.locator('input').count()
  expect(hasInputs).toBeGreaterThan(0)

  console.log(`App successfully loaded company defaults page with ${hasInputs} input fields`)
})
