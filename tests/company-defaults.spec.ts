import { test, expect } from './fixtures/auth'

test('3. can fetch test_client_name from company defaults', async ({ authenticatedPage: page }) => {
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:8000'

  // Get auth token from localStorage
  const authToken = await page.evaluate(() => localStorage.getItem('auth_token'))

  // Make API request with auth header and ngrok bypass
  const response = await page.request.get(`${apiBaseUrl}/api/company-defaults/`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
      'ngrok-skip-browser-warning': 'true',
    },
  })

  expect(response.ok()).toBeTruthy()

  const data = await response.json()

  // Verify test_client_name exists and is not empty
  expect(data.test_client_name).toBeDefined()
  expect(data.test_client_name).not.toBe('')

  console.log(`Test client name: ${data.test_client_name}`)
})
