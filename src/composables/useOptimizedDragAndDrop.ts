import { ref, type Ref } from 'vue'
import Sortable from 'sortablejs'
import { debugLog } from '../utils/debug'

export interface OptimizedDragEventPayload {
  jobId: string
  fromStatus: string
  toStatus: string
  beforeId?: string
  afterId?: string
}

export type OptimizedDragEventHandler = (event: string, payload: OptimizedDragEventPayload) => void

export function useOptimizedDragAndDrop(
  onDragEvent?: OptimizedDragEventHandler,
  revalidateColumns?: (columnIds: string[]) => Promise<void>,
) {
  const isDragging = ref(false)
  const sortableInstances = ref<Map<string, Sortable>>(new Map())

  const initializeSortable = (element: HTMLElement, status: string) => {
    const existing = sortableInstances.value.get(status)
    if (existing) {
      existing.destroy()
      sortableInstances.value.delete(status)
    }
    if (!element || !element.isConnected) return

    // Special debug logging for draft column
    if (status === 'draft') {
      debugLog(`🎯 DRAFT COLUMN: Creating Optimized Sortable for ${status}:`, {
        element,
        dataStatus: element.dataset.status,
        children: element.children.length,
        elementConnected: element.isConnected,
        elementParent: element.parentElement?.tagName,
        elementId: element.id,
        elementClasses: element.className,
      })
    } else {
      debugLog(`🔧 Creating Optimized Sortable for ${status}:`, {
        element,
        dataStatus: element.dataset.status,
        children: element.children.length,
      })
    }

    // Special configuration for draft column to ensure it works properly
    const sortableConfig = {
      group: 'kanban-jobs',
      animation: 150,
      draggable: '.job-card',
      sort: true,
      emptyInsertThreshold: status === 'draft' ? 50 : 100, // Lower threshold for draft
      forceFallback: false,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      // Special handling for draft column
      ...(status === 'draft' && {
        ghostClass: 'sortable-ghost-draft',
        chosenClass: 'sortable-chosen-draft',
        dragClass: 'sortable-drag-draft',
      }),
      onStart: () => {
        if (status === 'draft') {
          debugLog(`🎯 DRAFT COLUMN: Optimistic drag started from: ${status}`)
        } else {
          debugLog(`🎯 Optimistic drag started from: ${status}`)
        }
        isDragging.value = true
        document.body.classList.add('is-dragging')
      },
      onMove: (evt) => {
        const toColumn = (evt.to.closest('[data-status]') as HTMLElement)?.dataset.status
        if (status === 'draft' || toColumn === 'draft') {
          debugLog(`🎯 DRAFT COLUMN: Optimistic drag moving from ${status} to: ${toColumn}`)
        } else {
          debugLog(`🎯 Optimistic drag moving to: ${toColumn}`)
        }
        return true
      },
      onEnd: async (evt) => {
        const dragFromStatus = evt.from.dataset.status
        const dragToStatus = evt.to.dataset.status

        if (dragFromStatus === 'draft' || dragToStatus === 'draft') {
          debugLog(`🎯 DRAFT COLUMN: Optimistic drag ended:`, {
            from: dragFromStatus,
            to: dragToStatus,
            item: evt.item.dataset.jobId,
            fromElement: evt.from,
            toElement: evt.to,
            newIndex: evt.newIndex,
            oldIndex: evt.oldIndex,
          })
        } else {
          debugLog(`🎯 Optimistic drag ended:`, {
            from: dragFromStatus,
            to: dragToStatus,
            item: evt.item.dataset.jobId,
          })
        }

        isDragging.value = false
        document.body.classList.remove('is-dragging')

        const jobElement = evt.item as HTMLElement
        const jobId = jobElement.dataset.jobId
        if (!jobId) return

        const fromCol = evt.from.closest('[data-status]') as HTMLElement
        const toCol = evt.to.closest('[data-status]') as HTMLElement
        const fromStatus = fromCol?.dataset.status
        const toStatus = toCol?.dataset.status
        if (!fromStatus || !toStatus) return

        const newIndex = evt.newIndex ?? 0
        const beforeId =
          newIndex > 0 ? (evt.to.children[newIndex - 1] as HTMLElement)?.dataset.jobId : undefined
        const afterId =
          newIndex < evt.to.children.length - 1
            ? (evt.to.children[newIndex + 1] as HTMLElement)?.dataset.jobId
            : undefined

        // Call the drag event handler (which should handle optimistic updates)
        if (onDragEvent) {
          onDragEvent('job-moved', { jobId, fromStatus, toStatus, beforeId, afterId })
        }

        // If we have revalidateColumns function, revalidate affected columns
        if (revalidateColumns && fromStatus !== toStatus) {
          try {
            debugLog(`🔄 Revalidating columns after drag: ${fromStatus}, ${toStatus}`)
            await revalidateColumns([fromStatus, toStatus])
          } catch (error) {
            debugLog(`❌ Error revalidating columns after drag:`, error)
          }
        }
      },
    }

    const sortable = Sortable.create(element, sortableConfig)

    sortableInstances.value.set(status, sortable)
  }

  const destroyAllSortables = () => {
    sortableInstances.value.forEach((sortable) => sortable.destroy())
    sortableInstances.value.clear()
    isDragging.value = false
    document.body.classList.remove('is-dragging')
  }

  return {
    isDragging: isDragging as Ref<boolean>,
    initializeSortable,
    destroyAllSortables,
  }
}
