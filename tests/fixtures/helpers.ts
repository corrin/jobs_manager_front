import type { Page } from '@playwright/test'

/**
 * Helper to find elements by data-automation-id attribute
 */
export const autoId = (page: Page, id: string) => page.locator(`[data-automation-id="${id}"]`)

/**
 * Helper to dismiss any toast notifications that might block interactions
 */
export async function dismissToasts(page: Page) {
  const toasts = page.locator('[data-sonner-toast]')
  const toastCount = await toasts.count()
  if (toastCount > 0) {
    console.log(`Dismissing ${toastCount} toast(s)...`)
    for (let i = 0; i < toastCount; i++) {
      const toast = toasts.nth(i)
      const closeBtn = toast.locator('button[aria-label="Close toast"]')
      if (await closeBtn.count()) {
        await closeBtn.click()
      } else {
        await toast.click()
      }
      await page.waitForTimeout(100)
    }
    await page.waitForTimeout(300)
  }
}

/**
 * Helper to wait for JobSettingsTab to finish initializing
 */
export async function waitForSettingsInitialized(page: Page) {
  await page.waitForSelector('[data-initialized="true"]', { timeout: 15000 })
}

/**
 * Helper to wait for autosave to complete
 */
export async function waitForAutosave(page: Page) {
  try {
    await page.waitForFunction(
      () => {
        const text = document.body.innerText
        return text.includes('Saved at') || text.includes('updated successfully')
      },
      { timeout: 10000 },
    )
  } catch {
    // If specific indicators aren't found, fall back to a delay
    await page.waitForTimeout(3000)
  }
}
