import { ref, nextTick } from 'vue'
import Sortable from 'sortablejs'

// Types
interface DragEventData {
  jobId: string
  fromStatus: string
  toStatus: string
}

interface JobCardElement {
  id: string
  classes: string
  hasDataId: boolean
}

interface SortableOptions {
  group: string
  animation: number
  ghostClass: string
  chosenClass: string
  dragClass: string
  draggable: string
  disabled: boolean
  delay: number
  touchStartThreshold: number
  forceFallback: boolean
  fallbackOnBody: boolean
  onStart: (evt: Sortable.SortableEvent) => void
  onEnd: (evt: Sortable.SortableEvent) => void
  onMove: (evt: Sortable.MoveEvent) => boolean
}

// Constants
const SORTABLE_CONFIG = {
  GROUP: 'jobs',
  ANIMATION_DURATION: 150,
  GHOST_CLASS: 'opacity-50 bg-blue-100',
  CHOSEN_CLASS: 'scale-105 shadow-lg',
  DRAG_CLASS: 'rotate-2 shadow-xl',
  DRAGGABLE_SELECTOR: '.job-card-simple',
  DISABLED: false,
  DELAY: 0,
  TOUCH_START_THRESHOLD: 0,
  FORCE_FALLBACK: false,
  FALLBACK_ON_BODY: true,
} as const

export function useSimpleDragAndDrop() {
  const isDragging = ref(false)
  const sortableInstances = new Map<string, Sortable>()

  // Logging utilities - Single Responsibility Principle
  const logColumnInitialization = (element: HTMLElement, status: string): void => {
    console.log(`📍 Initializing simple drag for ${status}`)
    console.log(`📍 Element:`, element)
    console.log(`📍 Element classes:`, element.className)
    console.log(`📍 Element data-status:`, element.dataset.status)
  }
  const createJobCardElementData = (htmlElement: HTMLElement): JobCardElement => ({
    id: htmlElement.dataset.id || '',
    classes: htmlElement.className,
    hasDataId: !!htmlElement.dataset.id,
  })

  const logDraggableElements = (element: HTMLElement, status: string): void => {
    const draggableElements = element.querySelectorAll('[data-id]')
    const jobCardElements = element.querySelectorAll('.job-card-simple')
    const draggableJobCards = element.querySelectorAll('.job-card-simple[data-id]')

    console.log(`📦 Found ${draggableElements.length} draggable elements in ${status}`)
    console.log(`🃏 Found ${jobCardElements.length} job-card elements in ${status}`)
    console.log(`🎯 Found ${draggableJobCards.length} draggable job-card elements in ${status}`)

    // Early return if no job cards found
    if (jobCardElements.length === 0) return

    const jobCardData: JobCardElement[] = Array.from(jobCardElements).map((el) =>
      createJobCardElementData(el as HTMLElement),
    )

    console.log('🎴 Job card elements:', jobCardData)

    // Also log the specific draggable job cards
    if (draggableJobCards.length > 0) {
      console.log(
        '🎯 Draggable job cards:',
        Array.from(draggableJobCards).map((el) => ({
          id: el.getAttribute('data-id'),
          classes: el.className,
        })),
      )
    }
  }

  // Drag event handlers - Single Responsibility
  const handleDragStart = (evt: Sortable.SortableEvent): void => {
    console.log('🎯 Simple drag started', {
      item: evt.item,
      itemId: evt.item.dataset.id,
      from: evt.from.dataset.status,
      event: evt,
    })
    isDragging.value = true
  }

  const handleDragMove = (evt: Sortable.MoveEvent): boolean => {
    console.log('🔄 Move event', {
      related: evt.related,
      relatedRect: evt.relatedRect,
      willInsertAfter: evt.willInsertAfter,
    })
    return true
  }

  const extractDragEventData = (evt: Sortable.SortableEvent): DragEventData => ({
    jobId: evt.item.dataset.id || '',
    fromStatus: evt.from.dataset.status || '',
    toStatus: evt.to.dataset.status || '',
  })

  const isValidDragEventData = (dragData: DragEventData): boolean => {
    return !!(dragData.jobId && dragData.fromStatus && dragData.toStatus)
  }

  const shouldProcessJobMove = (dragData: DragEventData): boolean => {
    // Early return if missing required data
    if (!isValidDragEventData(dragData)) {
      console.warn('⚠️ Missing data for job move:', dragData)
      return false
    }

    // Early return if same status (no actual move)
    if (dragData.fromStatus === dragData.toStatus) {
      console.log('📍 Job moved within same column, no status change needed')
      return false
    }

    return true
  }

  const processJobMove = (
    dragData: DragEventData,
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): void => {
    console.log(
      `📦 Moving job ${dragData.jobId} from ${dragData.fromStatus} to ${dragData.toStatus}`,
    )
    onJobMoved(dragData.fromStatus, dragData.toStatus, dragData.jobId)
  }

  const handleDragEnd = (
    evt: Sortable.SortableEvent,
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): void => {
    console.log('🏁 Simple drag ended', {
      item: evt.item,
      itemId: evt.item.dataset.id,
      from: evt.from.dataset.status,
      to: evt.to.dataset.status,
      event: evt,
    })

    isDragging.value = false

    const dragData = extractDragEventData(evt)

    // Early return if move should not be processed
    if (!shouldProcessJobMove(dragData)) return

    processJobMove(dragData, onJobMoved)
  }

  // Sortable configuration - Single Responsibility
  const createSortableConfiguration = (
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): SortableOptions => ({
    group: SORTABLE_CONFIG.GROUP,
    animation: SORTABLE_CONFIG.ANIMATION_DURATION,
    ghostClass: SORTABLE_CONFIG.GHOST_CLASS,
    chosenClass: SORTABLE_CONFIG.CHOSEN_CLASS,
    dragClass: SORTABLE_CONFIG.DRAG_CLASS,
    draggable: SORTABLE_CONFIG.DRAGGABLE_SELECTOR,
    disabled: SORTABLE_CONFIG.DISABLED,
    delay: SORTABLE_CONFIG.DELAY,
    touchStartThreshold: SORTABLE_CONFIG.TOUCH_START_THRESHOLD,
    forceFallback: SORTABLE_CONFIG.FORCE_FALLBACK,
    fallbackOnBody: SORTABLE_CONFIG.FALLBACK_ON_BODY,
    onStart: handleDragStart,
    onEnd: (evt: Sortable.SortableEvent) => handleDragEnd(evt, onJobMoved),
    onMove: handleDragMove,
  })

  // Instance management - Single Responsibility
  const destroyExistingSortableInstance = (status: string): void => {
    const existingInstance = sortableInstances.get(status)

    // Early return if no existing instance
    if (!existingInstance) return

    existingInstance.destroy()
    console.log(`🗑️ Destroyed existing sortable for ${status}`)
    sortableInstances.delete(status)
  }

  const createAndStoreSortableInstance = (
    element: HTMLElement,
    status: string,
    config: SortableOptions,
  ): Sortable => {
    console.log(`🚀 Creating Sortable instance for ${status} with config:`, config)
    console.log(`🎯 Element HTML:`, element.outerHTML.substring(0, 300))
    console.log(`🔍 Selector being used:`, SORTABLE_CONFIG.DRAGGABLE_SELECTOR)

    // Test selector before creating Sortable
    const testElements = element.querySelectorAll(SORTABLE_CONFIG.DRAGGABLE_SELECTOR)
    console.log(`🧪 Test selector found ${testElements.length} elements before Sortable creation`)

    const sortableInstance = new Sortable(element, config)
    sortableInstances.set(status, sortableInstance)

    console.log(`✅ Sortable initialized for ${status}:`, {
      sortable: sortableInstance,
      options: sortableInstance.options,
      element: sortableInstance.el,
    })

    // Test if sortable is working by checking if it's disabled
    console.log(`🔍 Sortable disabled state:`, sortableInstance.option('disabled'))
    console.log(`🔍 Sortable group:`, sortableInstance.option('group'))
    console.log(`🔍 Sortable draggable:`, sortableInstance.option('draggable'))

    return sortableInstance
  }

  // Column initialization - Main responsibility
  const initializeColumn = (
    element: HTMLElement,
    status: string,
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): Sortable | undefined => {
    // Guard clause - early return for invalid element
    if (!element) {
      console.warn(`⚠️ No element provided for ${status}`)
      return undefined
    }

    destroyExistingSortableInstance(status)
    logColumnInitialization(element, status)
    logDraggableElements(element, status)

    const sortableConfig = createSortableConfiguration(onJobMoved)
    const sortableInstance = createAndStoreSortableInstance(element, status, sortableConfig)
    // Additional verification - check if draggable elements are correctly identified
    setTimeout(() => {
      const draggableItems = element.querySelectorAll(SORTABLE_CONFIG.DRAGGABLE_SELECTOR)
      console.log(
        `🔍 Post-init verification for ${status}: Found ${draggableItems.length} draggable items`,
      )
      draggableItems.forEach((item, index) => {
        console.log(`  Item ${index}:`, {
          element: item,
          dataId: item.getAttribute('data-id'),
          classes: item.className,
        })

        // Add manual event listeners to test if events are firing
        const htmlItem = item as HTMLElement
        htmlItem.addEventListener('mousedown', (e) => {
          console.log(`🖱️ Manual mousedown on item ${index}:`, e)
        })
        htmlItem.addEventListener('dragstart', (e) => {
          console.log(`🎭 Manual dragstart on item ${index}:`, e)
        })
      })
    }, 100)

    return sortableInstance
  }

  // Batch operations - Single Responsibility
  const findColumnElement = (status: string): HTMLElement | null => {
    return document.querySelector(`[data-status="${status}"]`) as HTMLElement
  }

  const initializeColumnByStatus = (
    status: string,
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): void => {
    const element = findColumnElement(status)

    if (element) {
      console.log(`🔧 Reinitializing ${status} with element:`, element)
      initializeColumn(element, status, onJobMoved)
    } else {
      console.warn(`⚠️ No element found for status: ${status}`)
    }
  }

  const reinitializeAllColumns = async (
    statuses: string[],
    onJobMoved: (from: string, to: string, jobId: string) => void,
  ): Promise<void> => {
    console.log('🔄 Reinitializing all columns...')

    // Wait for DOM to be fully updated
    await nextTick()

    // Additional small delay to ensure all job cards are rendered
    await new Promise((resolve) => setTimeout(resolve, 150))

    statuses.forEach((status) => initializeColumnByStatus(status, onJobMoved))
  }

  // Cleanup - Single Responsibility
  const destroyAllSortableInstances = (): void => {
    console.log('🧹 Destroying all sortable instances...')

    sortableInstances.forEach((sortableInstance, status) => {
      sortableInstance.destroy()
      console.log(`🗑️ Destroyed sortable for ${status}`)
    })

    sortableInstances.clear()
  }

  // Public API
  return {
    isDragging,
    initializeColumn,
    reinitializeAll: reinitializeAllColumns,
    destroy: destroyAllSortableInstances,
  }
}
