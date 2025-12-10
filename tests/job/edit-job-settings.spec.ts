import { test, expect } from '../fixtures/auth'
import { getCompanyDefaults } from '../fixtures/api'
import {
  autoId,
  dismissToasts,
  waitForSettingsInitialized,
  waitForAutosave,
} from '../fixtures/helpers'

/**
 * Tests for editing a job after creation.
 * These tests run after the create-job tests and verify:
 * - Navigating to Job Settings tab
 * - Verifying job details match what was entered during creation
 * - Changing job details (name, pricing method)
 * - Changing contact person
 * - Changing client
 */
test.describe.serial('edit job', () => {
  // Store job URL from the first test to use in subsequent tests
  let createdJobUrl: string

  test('create a job to edit', async ({ authenticatedPage: page }) => {
    const timestamp = Date.now()
    const jobName = `Edit Test Job ${timestamp}`

    await test.step('navigate to create job page', async () => {
      await autoId(page, 'AppNavbar-create-job').click()
      await page.waitForURL('**/jobs/create')
    })

    await test.step('search and select client', async () => {
      const clientInput = autoId(page, 'ClientLookup-input')
      await clientInput.fill('ABC')
      await autoId(page, 'ClientLookup-results').waitFor({ timeout: 10000 })
      await page.getByRole('option', { name: /ABC Carpet Cleaning TEST IGNORE/ }).click()
      await expect(clientInput).toHaveValue('ABC Carpet Cleaning TEST IGNORE')
    })

    await test.step('enter job details', async () => {
      await autoId(page, 'JobCreateView-name-input').fill(jobName)
      await autoId(page, 'JobCreateView-estimated-materials').fill('1000')
      await autoId(page, 'JobCreateView-estimated-time').fill('8')
    })

    await test.step('select or create contact', async () => {
      await autoId(page, 'ContactSelector-modal-button').click({ timeout: 10000 })
      await autoId(page, 'ContactSelectionModal-container').waitFor({ timeout: 10000 })

      // Check if we have existing contacts - if so, select one; otherwise create one
      const selectButtons = autoId(page, 'ContactSelectionModal-select-button')
      const selectButtonCount = await selectButtons.count()

      if (selectButtonCount > 0) {
        // Select the first available contact
        await selectButtons.first().click()
      } else {
        // Create a new contact
        const submitButton = autoId(page, 'ContactSelectionModal-submit')
        await expect(submitButton).toHaveText('Create Contact', { timeout: 10000 })
        await autoId(page, 'ContactSelectionModal-name-input').fill(`Test Contact ${timestamp}`)
        await autoId(page, 'ContactSelectionModal-email-input').fill(`test${timestamp}@example.com`)
        await submitButton.click()
      }

      await autoId(page, 'ContactSelectionModal-container').waitFor({
        state: 'hidden',
        timeout: 10000,
      })
    })

    await test.step('set pricing method and submit', async () => {
      await autoId(page, 'JobCreateView-pricing-method').selectOption('fixed_price')

      // Dismiss any toast notifications that might block the button
      await dismissToasts(page)

      await autoId(page, 'JobCreateView-submit').click({ force: true })
      await page.waitForURL('**/jobs/*?*tab=quote*', { timeout: 15000 })

      // Store the job URL for subsequent tests
      createdJobUrl = page.url()
      console.log(`Created job at: ${createdJobUrl}`)
    })
  })

  test('navigate to Job Settings tab and verify details', async ({ authenticatedPage: page }) => {
    // Go to the created job
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await test.step('navigate to Job Settings tab', async () => {
      // Click on Job Settings tab
      await autoId(page, 'JobViewTabs-jobSettings').click()

      // Wait for the tab content to load
      await autoId(page, 'JobSettingsTab-job-name').waitFor({ timeout: 10000 })

      // Wait for job data to actually populate the fields
      // The field should have a value (not just be empty placeholder)
      const jobNameInput = autoId(page, 'JobSettingsTab-job-name')
      try {
        await expect(jobNameInput).not.toHaveValue('', { timeout: 10000 })
      } catch {
        // If still empty after 10s, log debug info
        const pageText = await page.evaluate(() => document.body.innerText)
        console.log('Page text snippet:', pageText.substring(0, 500))
        throw new Error('Job name field is still empty after 10 seconds - data not loading')
      }
    })

    await test.step('verify job name contains test identifier', async () => {
      const jobNameInput = autoId(page, 'JobSettingsTab-job-name')
      const jobName = await jobNameInput.inputValue()
      console.log('Job name value:', jobName)
      expect(jobName).toContain('Edit Test Job')
    })

    await test.step('verify client is ABC Carpet Cleaning', async () => {
      const clientNameInput = autoId(page, 'JobSettingsTab-client-name')
      await expect(clientNameInput).toHaveValue('ABC Carpet Cleaning TEST IGNORE')
    })

    await test.step('verify pricing method is Fixed Price', async () => {
      const pricingSelect = autoId(page, 'JobSettingsTab-pricing-method')
      await expect(pricingSelect).toHaveValue('fixed_price')
    })
  })

  test('change job name', async ({ authenticatedPage: page }) => {
    // Capture browser console logs for autosave debugging
    page.on('console', (msg) => {
      const text = msg.text()
      if (text.includes('JobAutosave') || text.includes('DEBUG')) {
        console.log(`[Browser] ${text}`)
      }
    })

    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    // Navigate to Job Settings tab
    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'JobSettingsTab-job-name').waitFor({ timeout: 10000 })

    // Wait for component initialization to complete (so autosave can work)
    await waitForSettingsInitialized(page)

    const newJobName = `Updated Job Name ${Date.now()}`

    await test.step('change the job name', async () => {
      const jobNameInput = autoId(page, 'JobSettingsTab-job-name')
      // Use clear + pressSequentially to ensure @input events fire (fill() doesn't always trigger them)
      await jobNameInput.clear()
      await jobNameInput.pressSequentially(newJobName, { delay: 10 })
      await jobNameInput.blur() // Trigger autosave
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify the name was saved by refreshing', async () => {
      await page.reload()
      await autoId(page, 'JobViewTabs-jobSettings').click()
      await autoId(page, 'JobSettingsTab-job-name').waitFor({ timeout: 10000 })

      const jobNameInput = autoId(page, 'JobSettingsTab-job-name')
      await expect(jobNameInput).toHaveValue(newJobName)
    })
  })

  test('change description', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'JobSettingsTab-description').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    const newDescription = `Updated description ${Date.now()}`

    await test.step('change the description', async () => {
      const descInput = autoId(page, 'JobSettingsTab-description')
      await descInput.clear()
      await descInput.pressSequentially(newDescription, { delay: 10 })
      await descInput.blur()
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify description was saved', async () => {
      await page.reload()
      await autoId(page, 'JobViewTabs-jobSettings').click()
      await autoId(page, 'JobSettingsTab-description').waitFor({ timeout: 10000 })

      const descInput = autoId(page, 'JobSettingsTab-description')
      await expect(descInput).toHaveValue(newDescription)
    })
  })

  test('change delivery date', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'JobSettingsTab-delivery-date').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    // Set delivery date to 30 days from now
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)
    const dateString = futureDate.toISOString().split('T')[0] // YYYY-MM-DD format

    await test.step('set delivery date', async () => {
      const dateInput = autoId(page, 'JobSettingsTab-delivery-date')
      await dateInput.fill(dateString)
      await dateInput.blur()
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify delivery date was saved', async () => {
      await page.reload()
      await autoId(page, 'JobViewTabs-jobSettings').click()
      await autoId(page, 'JobSettingsTab-delivery-date').waitFor({ timeout: 10000 })

      const dateInput = autoId(page, 'JobSettingsTab-delivery-date')
      await expect(dateInput).toHaveValue(dateString)
    })
  })

  test('change order number', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'JobSettingsTab-order-number').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    const newOrderNumber = `ORD-${Date.now()}`

    await test.step('set order number', async () => {
      const orderInput = autoId(page, 'JobSettingsTab-order-number')
      await orderInput.clear()
      await orderInput.pressSequentially(newOrderNumber, { delay: 10 })
      await orderInput.blur()
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify order number was saved', async () => {
      await page.reload()
      await autoId(page, 'JobViewTabs-jobSettings').click()
      await autoId(page, 'JobSettingsTab-order-number').waitFor({ timeout: 10000 })

      const orderInput = autoId(page, 'JobSettingsTab-order-number')
      await expect(orderInput).toHaveValue(newOrderNumber)
    })
  })

  test('change speed vs quality', async ({ authenticatedPage: page }) => {
    // Capture browser console logs for autosave debugging
    page.on('console', (msg) => {
      const text = msg.text()
      if (
        text.includes('JobAutosave') ||
        text.includes('DEBUG') ||
        text.includes('handleFieldInput')
      ) {
        console.log(`[Browser] ${text}`)
      }
    })

    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'settings-speed-quality').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    await test.step('change to quality-focused', async () => {
      const speedQualitySelect = autoId(page, 'settings-speed-quality')
      // Log current value before change
      const beforeValue = await speedQualitySelect.inputValue()
      console.log(`Speed/Quality before change: ${beforeValue}`)

      await speedQualitySelect.selectOption('quality')

      // Log value after change
      const afterValue = await speedQualitySelect.inputValue()
      console.log(`Speed/Quality after change: ${afterValue}`)

      await speedQualitySelect.blur()
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify speed vs quality was saved', async () => {
      await page.reload()
      await autoId(page, 'JobViewTabs-jobSettings').click()
      await autoId(page, 'settings-speed-quality').waitFor({ timeout: 10000 })

      const speedQualitySelect = autoId(page, 'settings-speed-quality')
      await expect(speedQualitySelect).toHaveValue('quality')
    })
  })

  test('change internal notes', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'settings-internal-notes').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    const newNotes = `Test internal notes ${Date.now()}`

    await test.step('add internal notes', async () => {
      // Quill editor uses a contenteditable div with class 'ql-editor'
      const notesContainer = autoId(page, 'settings-internal-notes')
      const quillEditor = notesContainer.locator('.ql-editor')
      await quillEditor.click()
      await quillEditor.fill(newNotes)
      // Blur to trigger save
      await page.click('body')
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify internal notes were saved', async () => {
      await page.reload()
      await autoId(page, 'JobViewTabs-jobSettings').click()
      await autoId(page, 'settings-internal-notes').waitFor({ timeout: 10000 })

      const notesContainer = autoId(page, 'settings-internal-notes')
      const quillEditor = notesContainer.locator('.ql-editor')
      await expect(quillEditor).toContainText(newNotes)
    })
  })

  test('change pricing method from Fixed Price to T&M', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    // Navigate to Job Settings tab
    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'JobSettingsTab-pricing-method').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    await test.step('change pricing method to Time & Materials', async () => {
      const pricingSelect = autoId(page, 'JobSettingsTab-pricing-method')
      await pricingSelect.selectOption('time_materials')
      await pricingSelect.blur() // Trigger autosave
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify pricing method was saved', async () => {
      await page.reload()
      await autoId(page, 'JobViewTabs-jobSettings').click()
      await autoId(page, 'JobSettingsTab-pricing-method').waitFor({ timeout: 10000 })

      const pricingSelect = autoId(page, 'JobSettingsTab-pricing-method')
      await expect(pricingSelect).toHaveValue('time_materials')
    })
  })

  test('change pricing method from header (T&M back to Fixed Price)', async ({
    authenticatedPage: page,
  }) => {
    // This test uses the InlineEditSelect in the job header area
    // (different UI than the settings tab select)
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await test.step('click on pricing method in header to edit', async () => {
      // Click the display text to enter edit mode
      const pricingDisplay = autoId(page, 'header-pricing-method-display')
      await pricingDisplay.waitFor({ timeout: 10000 })
      await pricingDisplay.click()
    })

    await test.step('select Fixed Price from dropdown', async () => {
      const pricingSelect = autoId(page, 'header-pricing-method-select')
      await pricingSelect.waitFor({ timeout: 5000 })
      await pricingSelect.selectOption('fixed_price')

      // Click confirm button to save
      const confirmBtn = autoId(page, 'header-pricing-method-confirm')
      await confirmBtn.click()
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify pricing method was saved', async () => {
      await page.reload()

      // Verify in header display
      const pricingDisplay = autoId(page, 'header-pricing-method-display')
      await expect(pricingDisplay).toContainText('Fixed Price', { timeout: 10000 })

      // Also verify in Job Settings tab
      await autoId(page, 'JobViewTabs-jobSettings').click()
      await autoId(page, 'JobSettingsTab-pricing-method').waitFor({ timeout: 10000 })

      const pricingSelect = autoId(page, 'JobSettingsTab-pricing-method')
      await expect(pricingSelect).toHaveValue('fixed_price')
    })
  })

  test('change job status from header (Draft to In Progress)', async ({
    authenticatedPage: page,
  }) => {
    // Job status is only editable from the header (not in settings tab)
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await test.step('verify initial status is Draft', async () => {
      const statusDisplay = autoId(page, 'header-job-status-display')
      await expect(statusDisplay).toContainText('Draft', { timeout: 10000 })
    })

    await test.step('click on status in header to edit', async () => {
      const statusDisplay = autoId(page, 'header-job-status-display')
      await statusDisplay.click()
    })

    await test.step('select In Progress from dropdown', async () => {
      const statusSelect = autoId(page, 'header-job-status-select')
      await statusSelect.waitFor({ timeout: 5000 })
      await statusSelect.selectOption('in_progress')

      // Click confirm button to save
      const confirmBtn = autoId(page, 'header-job-status-confirm')
      await confirmBtn.click()
    })

    await test.step('wait for autosave', async () => {
      await waitForAutosave(page)
    })

    await test.step('verify status was saved', async () => {
      await page.reload()

      // Verify in header display
      const statusDisplay = autoId(page, 'header-job-status-display')
      await expect(statusDisplay).toContainText('In Progress', { timeout: 10000 })
    })
  })

  test('change contact person', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    // Navigate to Job Settings tab
    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'ContactSelector-modal-button').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    await test.step('open contact selection modal', async () => {
      await autoId(page, 'ContactSelector-modal-button').click()
      await autoId(page, 'ContactSelectionModal-container').waitFor({ timeout: 10000 })
    })

    await test.step('create a new contact to switch to', async () => {
      // Wait for the form to be ready
      const submitButton = autoId(page, 'ContactSelectionModal-submit')
      await expect(submitButton).toHaveText('Create Contact', { timeout: 10000 })

      const timestamp = Date.now()
      await autoId(page, 'ContactSelectionModal-name-input').fill(`New Contact ${timestamp}`)
      await autoId(page, 'ContactSelectionModal-email-input').fill(
        `newcontact${timestamp}@example.com`,
      )
      await submitButton.click()

      // Wait for modal to close
      await autoId(page, 'ContactSelectionModal-container').waitFor({
        state: 'hidden',
        timeout: 10000,
      })
    })

    await test.step('verify contact was updated', async () => {
      const contactDisplay = autoId(page, 'contact-display-input')
      await expect(contactDisplay).toHaveValue(/New Contact/, { timeout: 10000 })
    })
  })

  test('change client', async ({ authenticatedPage: page }) => {
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    // Get the shop client name from company defaults
    const companyDefaults = await getCompanyDefaults(page)
    const shopClientName = companyDefaults.shop_client_name as string
    expect(shopClientName).toBeTruthy()
    console.log(`Using shop client name: ${shopClientName}`)

    // Navigate to Job Settings tab
    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'settings-change-client-btn').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    await test.step('click Change Client button', async () => {
      await autoId(page, 'settings-change-client-btn').click()
      await autoId(page, 'settings-client-change-panel').waitFor({ timeout: 5000 })
    })

    await test.step('search for and select a different client', async () => {
      const clientChangePanel = autoId(page, 'settings-client-change-panel')
      const clientInput = clientChangePanel.locator('input[type="text"]')

      // Search using first word of shop client name
      await clientInput.fill(shopClientName.split(' ')[0])
      await page.waitForTimeout(1000) // Allow debounce

      const clientOption = page.getByRole('option', { name: new RegExp(shopClientName) })
      await clientOption.waitFor({ timeout: 10000 })
      await clientOption.click()
    })

    await test.step('confirm the client change', async () => {
      await autoId(page, 'settings-confirm-client-btn').click()
      await waitForAutosave(page)
    })

    await test.step('verify client was changed', async () => {
      const clientNameInput = autoId(page, 'JobSettingsTab-client-name')
      await expect(clientNameInput).toHaveValue(new RegExp(shopClientName))
    })

    await test.step('verify change persists after refresh', async () => {
      await page.reload()
      await autoId(page, 'JobViewTabs-jobSettings').click()
      await autoId(page, 'JobSettingsTab-client-name').waitFor({ timeout: 10000 })

      const clientNameInput = autoId(page, 'JobSettingsTab-client-name')
      await expect(clientNameInput).toHaveValue(new RegExp(shopClientName))
    })
  })

  test('reload stability - values unchanged after multiple reloads', async ({
    authenticatedPage: page,
  }) => {
    // This test verifies that reloading the page doesn't cause any data drift
    // (i.e., values stay the same and aren't accidentally modified on load)
    await page.goto(createdJobUrl)
    await page.waitForLoadState('networkidle')

    await autoId(page, 'JobViewTabs-jobSettings').click()
    await autoId(page, 'JobSettingsTab-job-name').waitFor({ timeout: 10000 })
    await waitForSettingsInitialized(page)

    // Capture all field values before reload
    const valuesBefore = await test.step('capture values before reload', async () => {
      return {
        jobName: await autoId(page, 'JobSettingsTab-job-name').inputValue(),
        description: await autoId(page, 'JobSettingsTab-description').inputValue(),
        orderNumber: await autoId(page, 'JobSettingsTab-order-number').inputValue(),
        pricingMethod: await autoId(page, 'JobSettingsTab-pricing-method').inputValue(),
        speedQuality: await autoId(page, 'settings-speed-quality').inputValue(),
        clientName: await autoId(page, 'JobSettingsTab-client-name').inputValue(),
      }
    })

    console.log('Values before reload:', valuesBefore)

    // Reload multiple times to ensure stability
    for (let i = 1; i <= 3; i++) {
      await test.step(`reload #${i} and verify values unchanged`, async () => {
        await page.reload()
        await autoId(page, 'JobViewTabs-jobSettings').click()
        await autoId(page, 'JobSettingsTab-job-name').waitFor({ timeout: 10000 })
        await waitForSettingsInitialized(page)

        // Verify all values match
        await expect(autoId(page, 'JobSettingsTab-job-name')).toHaveValue(valuesBefore.jobName)
        await expect(autoId(page, 'JobSettingsTab-description')).toHaveValue(
          valuesBefore.description,
        )
        await expect(autoId(page, 'JobSettingsTab-order-number')).toHaveValue(
          valuesBefore.orderNumber,
        )
        await expect(autoId(page, 'JobSettingsTab-pricing-method')).toHaveValue(
          valuesBefore.pricingMethod,
        )
        await expect(autoId(page, 'settings-speed-quality')).toHaveValue(valuesBefore.speedQuality)
        await expect(autoId(page, 'JobSettingsTab-client-name')).toHaveValue(
          valuesBefore.clientName,
        )
      })
    }

    console.log('All 3 reloads completed with no data drift')
  })
})
