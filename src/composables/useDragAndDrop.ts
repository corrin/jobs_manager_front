import { ref, nextTick } from 'vue'
import Sortable from 'sortablejs'
import type { Job } from '@/schemas/kanban.schemas'

interface DragAndDropEmits {
  (event: 'job-moved', payload: {
    jobId: number
    fromStatus: string
    toStatus: string
    beforeId?: number
    afterId?: number
  }): void
}

export function useDragAndDrop(emit: DragAndDropEmits) {
  const sortableInstances = ref<Map<string, Sortable>>(new Map())
  const isDragging = ref(false)

  const initializeSortable = (element: HTMLElement, status: string, jobs: Job[]) => {
    // Destroy existing instance if it exists
    const existingInstance = sortableInstances.value.get(status)
    if (existingInstance) {
      existingInstance.destroy()
    }

    const sortableInstance = new Sortable(element, {
      group: 'kanban-jobs',
      animation: 150,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      fallbackOnBody: true,
      swapThreshold: 0.65,
      
      onStart: (evt) => {
        isDragging.value = true
        // Add visual feedback
        document.body.classList.add('is-dragging')
      },

      onEnd: (evt) => {
        isDragging.value = false
        document.body.classList.remove('is-dragging')
        
        const { item, to, from, newIndex, oldIndex } = evt
        
        if (!item || !to || !from) return

        const jobId = parseInt(item.dataset.jobId || '0')
        const fromStatus = from.dataset.status || ''
        const toStatus = to.dataset.status || ''

        if (jobId === 0) {
          console.error('Invalid job ID for drag and drop')
          return
        }        // If the job was moved to a different position or column
        if (from !== to || newIndex !== oldIndex) {
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
      },

      onMove: (evt) => {
        // Prevent dropping on non-droppable areas
        const { related } = evt
        return !related.classList.contains('no-drop')
      }
    })

    sortableInstances.value.set(status, sortableInstance)
    return sortableInstance
  }

  const getJobsForStatus = (status: string, allJobs: Job[]): Job[] => {
    return allJobs.filter(job => job.status === status)
  }
  const getBeforeJobId = (jobs: Job[], newIndex: number | undefined): number | undefined => {
    if (newIndex === undefined || newIndex === 0) return undefined
    return jobs[newIndex - 1]?.id
  }

  const getAfterJobId = (jobs: Job[], newIndex: number | undefined): number | undefined => {
    if (newIndex === undefined || newIndex >= jobs.length - 1) return undefined
    return jobs[newIndex + 1]?.id
  }

  const updateSortableForStatus = async (status: string, jobs: Job[]) => {
    await nextTick()
    const instance = sortableInstances.value.get(status)
    if (instance) {
      // Update the sortable instance with new data
      const element = instance.el
      const jobElements = element.querySelectorAll('[data-job-id]')
      
      // Ensure all job elements have correct data attributes
      jobElements.forEach((el, index) => {
        const jobId = jobs[index]?.id
        if (jobId) {
          el.setAttribute('data-job-id', jobId.toString())
        }
      })
    }
  }

  const destroySortable = (status: string) => {
    const instance = sortableInstances.value.get(status)
    if (instance) {
      instance.destroy()
      sortableInstances.value.delete(status)
    }
  }

  const destroyAllSortables = () => {
    sortableInstances.value.forEach((instance) => {
      instance.destroy()
    })
    sortableInstances.value.clear()
  }

  const setDragDisabled = (disabled: boolean) => {
    sortableInstances.value.forEach((instance) => {
      instance.option('disabled', disabled)
    })
  }

  return {
    isDragging,
    initializeSortable,
    updateSortableForStatus,
    destroySortable,
    destroyAllSortables,
    setDragDisabled
  }
}
