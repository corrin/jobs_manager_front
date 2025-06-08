import { ref, nextTick, onBeforeUnmount } from 'vue'
import Sortable from 'sortablejs'
import type { Job } from '@/types'

// Using only schema types - no custom interfaces
type DragAndDropEmits = {
  (event: 'job-moved', payload: {
    jobId: string
    fromStatus: string
    toStatus: string
    beforeId?: string
    afterId?: string
  }): void
}

export function useDragAndDrop(emit: DragAndDropEmits) {
  const sortableInstances = ref<Map<string, Sortable>>(new Map())
  const isDragging = ref(false)

  const initializeSortable = (element: HTMLElement, status: string, jobs: Job[]) => {
    // Guard clause: validate inputs
    if (!element || !status) {
      console.warn('Invalid element or status for sortable initialization')
      return null
    }

    // Clean up existing instance
    destroySortable(status)

    // Ensure element is properly mounted
    if (!element.isConnected) {
      console.warn('Element not connected to DOM when initializing sortable')
      return null
    }

    // Detectar se é dispositivo touch para aplicar configurações mínimas
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isMobile = window.innerWidth < 768
    
    console.log('Device detection for drag:', {
      width: window.innerWidth,
      isTouch,
      isMobile,
      deviceType: isMobile ? 'mobile' : (isTouch ? 'tablet/touch' : 'desktop')
    })

    // Se for mobile, não inicializar sortable
    if (isMobile) {
      console.log('Mobile detected - skipping sortable initialization')
      return null
    }

    try {
      const sortableInstance = new Sortable(element, {
        group: {
          name: 'kanban-jobs',
          pull: true,
          put: true // Aceita drops de elementos externos
        },
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        fallbackOnBody: true,
        swapThreshold: 0.65,
        filter: '.no-drag',
        preventOnFilter: true,
        
        // Configurações para dispositivos touch (tablet/iPad)
        ...(isTouch && {
          delay: 150,
          touchStartThreshold: 10,
        }),
        
        onStart: (evt) => {
          isDragging.value = true
          document.body.classList.add('is-dragging')
          
          // Configurar dados para drops externos usando uma abordagem global
          const item = evt.item
          if (item && evt.from?.dataset) {
            const jobId = item.dataset.id || ''
            const fromStatus = evt.from.dataset.status || ''
            
            // Armazenar dados de drag globalmente para acesso externo
            const dragData = {
              jobId,
              fromStatus
            };
            
            (window as any).__dragData = dragData
            
            console.log('Drag started:', dragData)
          }
        },

        onEnd: (evt) => {
          // Clean up dragging state
          isDragging.value = false
          document.body.classList.remove('is-dragging')
          
          // Limpar dados globais de drag
          delete (window as any).__dragData
          
          handleDragEnd(evt, jobs)
        },

        onMove: (evt) => {
          // Prevent dropping on invalid areas
          const { related } = evt
          return !related?.classList.contains('no-drop')
        }
      })

      sortableInstances.value.set(status, sortableInstance)
      return sortableInstance
    } catch (error) {
      console.error('Error initializing sortable:', error)
      return null
    }
  }

  const handleDragEnd = (evt: Sortable.SortableEvent, jobs: Job[]) => {
    const { item, to, from, newIndex, oldIndex } = evt
    
    // Guard clauses
    if (!item || !to || !from) {
      console.warn('Invalid drag event data')
      return
    }

    const jobId = item.dataset.id
    const fromStatus = from.dataset.status
    const toStatus = to.dataset.status

    if (!jobId || !fromStatus || !toStatus) {
      console.error('Missing required data attributes for drag and drop')
      return
    }

    // Only emit if there was actual movement
    if (from === to && newIndex === oldIndex) {
      return
    }

    const targetJobs = getJobsForStatus(toStatus, jobs)
    const beforeId = getBeforeJobId(targetJobs, newIndex)
    const afterId = getAfterJobId(targetJobs, newIndex)

    emit('job-moved', {
      jobId,
      fromStatus,
      toStatus,
      beforeId,
      afterId
    })
  }

  const getJobsForStatus = (status: string, allJobs: Job[]): Job[] => {
    return allJobs.filter(job => job.status_key === status)
  }

  const getBeforeJobId = (jobs: Job[], newIndex: number | undefined): string | undefined => {
    if (newIndex === undefined || newIndex === 0) return undefined
    return jobs[newIndex - 1]?.id
  }

  const getAfterJobId = (jobs: Job[], newIndex: number | undefined): string | undefined => {
    if (newIndex === undefined || newIndex >= jobs.length - 1) return undefined
    return jobs[newIndex + 1]?.id
  }

  const updateSortableForStatus = async (status: string, jobs: Job[]) => {
    await nextTick()
    
    const instance = sortableInstances.value.get(status)
    if (!instance || !instance.el) {
      return
    }

    try {
      // Simple refresh - let Vue handle the DOM updates
      // SortableJS will automatically pick up the new DOM structure
      const element = instance.el
      if (element && element.isConnected) {
        // Sortable instance is still valid, no need to recreate
        return
      }
    } catch (error) {
      console.warn('Error updating sortable:', error)
      // If there's an error, destroy and let it be recreated
      destroySortable(status)
    }
  }

  const destroySortable = (status: string) => {
    const instance = sortableInstances.value.get(status)
    if (instance) {
      try {
        // Ensure proper cleanup
        instance.destroy()
        sortableInstances.value.delete(status)
      } catch (error) {
        console.warn('Error destroying sortable instance:', error)
        // Force remove from map even if destroy fails
        sortableInstances.value.delete(status)
      }
    }
  }

  const destroyAllSortables = () => {
    try {
      sortableInstances.value.forEach((instance, status) => {
        try {
          instance.destroy()
        } catch (error) {
          console.warn(`Error destroying sortable for status ${status}:`, error)
        }
      })
      sortableInstances.value.clear()
      
      // Clean up any remaining drag state
      isDragging.value = false
      document.body.classList.remove('is-dragging')
    } catch (error) {
      console.error('Error during cleanup:', error)
    }
  }

  const setDragDisabled = (disabled: boolean) => {
    sortableInstances.value.forEach((instance) => {
      try {
        instance.option('disabled', disabled)
      } catch (error) {
        console.warn('Error setting drag disabled state:', error)
      }
    })
  }

  // Auto cleanup on component unmount
  onBeforeUnmount(() => {
    destroyAllSortables()
  })

  return {
    isDragging,
    initializeSortable,
    updateSortableForStatus,
    destroySortable,
    destroyAllSortables,
    setDragDisabled
  }
}
