import { test as base, expect, type Page } from '@playwright/test'

export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    const username = process.env.E2E_TEST_USERNAME
    const password = process.env.E2E_TEST_PASSWORD

    if (!username || !password) {
      throw new Error('E2E_TEST_USERNAME and E2E_TEST_PASSWORD must be set in .env')
    }

    // Navigate to login page
    await page.goto('/login')

    // Fill login form
    await page.locator('#username').fill(username)
    await page.locator('#password').fill(password)

    // Click sign in button
    await page.getByRole('button', { name: 'Sign In' }).click()

    // Wait for redirect to kanban (default landing page after login)
    await page.waitForURL('**/kanban')

    // Pass the authenticated page to the test
    await use(page)
  },
})

export { expect }
