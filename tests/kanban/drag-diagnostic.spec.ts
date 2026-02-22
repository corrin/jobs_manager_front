import { test, expect } from '../fixtures/auth'

const getJobIdFromUrl = (url: string): string => {
  const match = url.match(/\/jobs\/([a-f0-9-]+)/i)
  if (!match) throw new Error(`Unable to parse job id from url: ${url}`)
  return match[1]
}

test('drag diagnostic: target card within column', async ({
  authenticatedPage: page,
  sharedEditJobUrl,
}) => {
  const jobId = getJobIdFromUrl(sharedEditJobUrl)

  const consoleMessages: string[] = []
  page.on('console', (msg) => consoleMessages.push(msg.text()))

  await page.goto('/kanban')
  await page.waitForLoadState('networkidle')

  const jobCard = page.locator(`[data-job-id="${jobId}"]:visible`).first()
  await expect(jobCard).toBeVisible({ timeout: 15000 })

  // Find a different column to drag to (prefer in_progress)
  const sourceColumn = page.locator('[data-status]:visible').filter({ has: jobCard }).first()
  const sourceStatus = await sourceColumn.getAttribute('data-status')

  const targetStatus = sourceStatus === 'in_progress' ? 'approved' : 'in_progress'
  const targetColumn = page.locator(`[data-status="${targetStatus}"]:visible`).first()
  await expect(targetColumn).toBeVisible({ timeout: 5000 })

  console.log(`Source: ${sourceStatus}, Target: ${targetStatus}`)

  const cardBox = await jobCard.boundingBox()
  const columnBox = await targetColumn.boundingBox()
  if (!cardBox || !columnBox) throw new Error('No bounding boxes')

  const startX = cardBox.x + cardBox.width / 2
  const startY = cardBox.y + cardBox.height / 2
  const endX = columnBox.x + Math.min(60, columnBox.width / 2)
  const endY = columnBox.y + 60

  // Step 1: mousedown
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.waitForTimeout(200)

  // Step 2: Dispatch synthetic drag events targeting a CARD within the column
  const sourceHandle = await jobCard.elementHandle()
  const targetHandle = await targetColumn.elementHandle()
  if (!sourceHandle || !targetHandle) throw new Error('No element handles')

  const dragResult = await page.evaluate(
    ({ source, target, sx, sy, ex, ey }) => {
      const results: string[] = []

      const dataTransfer = new DataTransfer()
      dataTransfer.effectAllowed = 'move'

      function fireDragEvent(element: Element, type: string, x: number, y: number): boolean {
        const evt = new DragEvent(type, {
          bubbles: true,
          cancelable: true,
          composed: true,
          dataTransfer,
          clientX: x,
          clientY: y,
          screenX: x,
          screenY: y,
        })
        const result = element.dispatchEvent(evt)
        const el = element as HTMLElement
        const id = el.dataset.jobId || el.dataset.status || el.tagName
        results.push(`${type} on ${id}: defaultPrevented=${!result}`)
        return result
      }

      // Find first card in target column
      const targetCard = target.querySelector('.job-card')
      results.push(`Target card found: ${!!targetCard}, target children: ${target.children.length}`)

      const dropTarget = targetCard || target

      fireDragEvent(source, 'dragstart', sx, sy)

      const card = source as HTMLElement
      results.push(`After dragstart: sortable-drag=${card.classList.contains('sortable-drag')}`)

      fireDragEvent(dropTarget, 'dragenter', ex, ey)

      for (let i = 0; i < 5; i++) {
        fireDragEvent(dropTarget, 'dragover', ex, ey + i)
      }

      // Check if card was moved in DOM
      const parentBefore = card.parentElement
      results.push(`Before drop: parent=${(parentBefore as HTMLElement)?.dataset.status}`)

      fireDragEvent(dropTarget, 'drop', ex, ey)

      const parentAfterDrop = card.parentElement
      results.push(`After drop: parent=${(parentAfterDrop as HTMLElement)?.dataset.status}`)

      fireDragEvent(source, 'dragend', sx, sy)

      const parentAfterEnd = card.parentElement
      results.push(`After dragend: parent=${(parentAfterEnd as HTMLElement)?.dataset.status}`)

      return results
    },
    { source: sourceHandle, target: targetHandle, sx: startX, sy: startY, ex: endX, ey: endY },
  )

  console.log('Drag results:')
  dragResult.forEach((r) => console.log(`  ${r}`))

  // Step 3: Release
  await page.mouse.move(endX, endY)
  await page.mouse.up()

  await page.waitForTimeout(1000)

  // Check console for drag positioning
  console.log('\n--- Drag-related console messages ---')
  consoleMessages
    .filter(
      (m) =>
        m.includes('DRAG') || m.includes('drag') || m.includes('onEnd') || m.includes('job-moved'),
    )
    .forEach((m) => console.log(`  ${m}`))
})
