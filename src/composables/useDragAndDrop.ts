import { ref, type Ref } from 'vue'
import Sortable from 'sortablejs'

export interface DragEventPayload {
  jobId: string
  fromStatus: string
  toStatus: string
  beforeId?: string
  afterId?: string
}

export type DragEventHandler = (event: string, payload: DragEventPayload) => void

// Permite passar um callback para eventos de drag
export function useDragAndDrop(onDragEvent?: DragEventHandler) {
  const isDragging = ref(false)
  const sortableInstances = ref<Map<string, Sortable>>(new Map())

  // Inicializa o Sortable para uma coluna específica
  const initializeSortable = (element: HTMLElement, status: string) => {
    // Destroi instância anterior, se houver
    const existing = sortableInstances.value.get(status)
    if (existing) {
      existing.destroy()
      sortableInstances.value.delete(status)
    }
    if (!element || !element.isConnected) return

    console.log(`🔧 Creating Sortable for ${status}:`, {
      element,
      dataStatus: element.dataset.status,
      children: element.children.length,
      clientHeight: element.clientHeight,
      offsetHeight: element.offsetHeight,
      computedStyle: {
        minHeight: getComputedStyle(element).minHeight,
        height: getComputedStyle(element).height,
        pointerEvents: getComputedStyle(element).pointerEvents,
      },
    })

    // Instancia SortableJS
    const sortable = Sortable.create(element, {
      group: 'kanban-jobs', // string simples já permite cross-column
      animation: 150,
      draggable: '.job-card',
      sort: true,
      emptyInsertThreshold: 100, // Aumenta a área de drop em containers vazios
      forceFallback: false,
      fallbackOnBody: true,
      swapThreshold: 0.65,
      onStart: () => {
        console.log(`🎯 Drag started from: ${status}`)
        isDragging.value = true
        document.body.classList.add('is-dragging')
      },
      onMove: (evt) => {
        const toColumn = (evt.to.closest('[data-status]') as HTMLElement)?.dataset.status
        console.log(`🎯 Drag moving to: ${toColumn}`)
        return true // Allow all moves
      },
      onAdd: (evt) => {
        const toStatus = evt.to.dataset.status
        console.log(`➕ Item added to column: ${toStatus}`)
      },
      onChange: (evt) => {
        const status = evt.to.dataset.status || evt.from.dataset.status
        console.log(`🔄 Change detected in column: ${status}`)
      },
      onEnd: (evt) => {
        console.log(`🎯 Drag ended:`, {
          from: evt.from.dataset.status,
          to: evt.to.dataset.status,
          item: evt.item.dataset.jobId,
          fromElement: evt.from,
          toElement: evt.to,
        })
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
        if (onDragEvent) {
          onDragEvent('job-moved', { jobId, fromStatus, toStatus, beforeId, afterId })
        }
      },
    })
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
