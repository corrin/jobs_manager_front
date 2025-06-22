import { ref, nextTick, onBeforeUnmount } from 'vue'
import Sortable from 'sortablejs'
import api from '@/plugins/axios'
import { getCsrfToken } from '@/utils/csrf'
import type { Job } from '@/types'

type StaffDragAndDropEmits = {
  (event: 'staff-assigned', payload: { jobId: string; staffId: string }): void
  (event: 'staff-removed', payload: { jobId: string; staffId: string }): void
  (event: 'jobs-reload-needed'): void
}

export function useStaffDragAndDrop(emit: StaffDragAndDropEmits) {
  const staffSortableInstances = ref<Map<string, Sortable>>(new Map())
  const isStaffDragging = ref(false)

  // Helper function to robustly remove cloned elements
  const removeClonedElement = (element: HTMLElement, shouldRemove: boolean = true) => {
    if (!shouldRemove || !element) return undefined

    try {
      console.log('🗑️ Removing cloned element:', element)

      // Strategy 1: Force layout recalculation before removal
      element.style.transform = 'translate3d(0,0,0)' // Force GPU layer
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      element.offsetHeight // Force reflow

      // Strategy 2: Hide immediately to prevent visual glitch
      element.style.display = 'none'
      element.style.visibility = 'hidden'
      element.style.opacity = '0'
      element.style.pointerEvents = 'none'

      // Strategy 3: Direct removal
      if (element.parentNode) {
        element.parentNode.removeChild(element)
        console.log('✅ Element removed via parentNode')

        // Force layout recalculation after removal
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        document.body.offsetHeight
        return
      }

      // Strategy 4: Remove after next frame
      requestAnimationFrame(() => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element)
          console.log('✅ Element removed via requestAnimationFrame')
          // Force layout recalculation
          // eslint-disable-next-line @typescript-eslint/no-unused-expressions
          document.body.offsetHeight
        }
      })
    } catch (error) {
      console.warn('❌ Error removing cloned element:', error)
      // Last resort: completely hide the element
      try {
        element.style.cssText =
          'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important;'
      } catch (hideError) {
        console.warn('❌ Could not even hide element:', hideError)
      }
    }
  }

  // Configuração simples para staff drag and drop
  const getStaffDragConfig = () => ({
    delay: 0,
    touchStartThreshold: 0,
    forceFallback: false,
    filter: '.no-drag',
    preventOnFilter: true,
    disabled: false,
    fallbackOnBody: true,
    swapThreshold: 0.65,
    dragoverBubble: false,
    removeCloneOnHide: true, // Ensure clones are removed when hidden
    emptyInsertThreshold: 5,
    revertOnSpill: false, // Don't revert when dropped outside
  })

  const initializeStaffPool = (staffPanelElement: HTMLElement) => {
    console.log('🧑‍💼 Initializing staff pool:', staffPanelElement)
    if (!staffPanelElement) {
      console.warn('Staff panel element not provided for staff drag and drop')
      return null
    }

    // Clean up existing instance
    const existingInstance = staffSortableInstances.value.get('staffPool')
    if (existingInstance) {
      try {
        existingInstance.destroy()
        staffSortableInstances.value.delete('staffPool')
      } catch (error) {
        console.warn('Error destroying existing staff pool sortable:', error)
      }
    }

    // Get unified staff drag configuration
    const staffDragConfig = getStaffDragConfig()

    try {
      const sortableInstance = new Sortable(staffPanelElement, {
        group: {
          name: 'staffPool',
          pull: 'clone',
          put: ['staffOnJob'], // Allow staff to be returned from jobs
        },
        sort: false,
        animation: 150,
        ghostClass: 'staff-sortable-ghost',
        chosenClass: 'staff-sortable-chosen',
        dragClass: 'staff-sortable-drag',

        // Prevent clone from being added back to pool
        onClone: (evt) => {
          console.log('📋 Staff clone created:', evt.clone)
          // Mark clone for identification
          evt.clone.setAttribute('data-is-clone', 'true')
        },

        // Apply unified configuration (includes all optimizations)
        ...staffDragConfig,

        onStart: () => {
          console.log('🧑‍💼 Staff drag started from pool')
          isStaffDragging.value = true
          document.body.classList.add('is-staff-dragging')
        },

        onEnd: () => {
          console.log('🧑‍💼 Staff drag ended at pool')
          isStaffDragging.value = false
          document.body.classList.remove('is-staff-dragging')

          // Force cleanup of any clones or ghost elements
          const cleanupElements = () => {
            // Remove any clones that might be left behind
            const clones = document.querySelectorAll('[data-is-clone="true"]')
            clones.forEach((clone) => {
              console.log('🗑️ Cleaning up leftover clone:', clone)
              removeClonedElement(clone as HTMLElement, true)
            })

            // Remove any SortableJS ghost elements
            const ghosts = document.querySelectorAll('.sortable-ghost, .staff-sortable-ghost')
            ghosts.forEach((ghost) => {
              console.log('👻 Removing ghost element:', ghost)
              if (ghost.parentNode) {
                ghost.parentNode.removeChild(ghost)
              }
            })

            // Force layout recalculation
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            document.body.offsetHeight
          }

          // Cleanup immediately and after animation
          cleanupElements()
          requestAnimationFrame(cleanupElements)
          setTimeout(cleanupElements, 200)
        },

        onAdd: (evt) => {
          console.log('🔄 Staff returned to pool:', evt)
          // Staff returned to pool from job
          const staffId = evt.item.dataset.staffId
          const fromJobCard = evt.from.closest('[data-id]')

          if (fromJobCard && staffId) {
            const jobId = fromJobCard.getAttribute('data-id')
            if (jobId) {
              console.log(`🧑‍💼 Staff ${staffId} returned to pool from job ${jobId}`)
              removeStaffFromJob(jobId, staffId)
            }
          }

          // Remove the element that was returned to pool
          console.log('🗑️ Removing staff element returned to pool')
          removeClonedElement(evt.item, true)
        },
      })

      staffSortableInstances.value.set('staffPool', sortableInstance)
      return sortableInstance
    } catch (error) {
      console.error('Error initializing staff pool sortable:', error)
      return null
    }
  }

  const initializeJobStaffContainer = (jobStaffElement: HTMLElement, jobId: string) => {
    console.log(`🎴 Initializing job staff container for job ${jobId}:`, jobStaffElement)
    if (!jobStaffElement || !jobId) {
      console.warn('Job staff element or jobId not provided')
      return null
    }

    const instanceKey = `job-${jobId}`

    // Clean up existing instance
    const existingInstance = staffSortableInstances.value.get(instanceKey)
    if (existingInstance) {
      try {
        existingInstance.destroy()
        staffSortableInstances.value.delete(instanceKey)
      } catch (error) {
        console.warn(`Error destroying existing job staff sortable for job ${jobId}:`, error)
      }
    }

    // Get unified staff drag configuration
    const staffDragConfig = getStaffDragConfig()

    try {
      const sortableInstance = new Sortable(jobStaffElement, {
        group: {
          name: 'staffOnJob',
          pull: true,
          put: ['staffPool', 'staffOnJob'],
        },
        animation: 150,
        ghostClass: 'staff-sortable-ghost',
        chosenClass: 'staff-sortable-chosen',
        dragClass: 'staff-sortable-drag',

        // Apply unified configuration (includes all optimizations)
        ...staffDragConfig,

        onStart: () => {
          isStaffDragging.value = true
          document.body.classList.add('is-staff-dragging')
        },

        onEnd: () => {
          isStaffDragging.value = false
          document.body.classList.remove('is-staff-dragging')
        },

        onAdd: async (evt) => {
          console.log('🎯 Staff dropped on job:', evt)
          const staffId = evt.item.getAttribute('data-staff-id')
          const targetJobCard = evt.to.closest('[data-id]')
          const isClone = evt.item.getAttribute('data-is-clone') === 'true'

          console.log('📊 Drop details:', {
            staffId,
            targetJobCard: targetJobCard?.getAttribute('data-id'),
            isClone,
            elementToRemove: evt.item,
          })

          if (staffId && targetJobCard) {
            const targetJobId = targetJobCard.getAttribute('data-id')
            if (targetJobId) {
              console.log(`🧑‍💼 Staff ${staffId} added to job ${targetJobId}`)

              // Check if this came from the staff pool (clone operation)
              const fromStaffPool = Boolean(
                evt.from.classList.contains('staff-list') ||
                  evt.from.closest('#staff-panel') ||
                  isClone,
              )

              try {
                await assignStaffToJob(targetJobId, staffId)
                console.log('✅ Staff assignment successful')

                // Always remove clones from staff pool operations
                if (fromStaffPool || isClone) {
                  console.log('🗑️ Removing clone after successful assignment')
                  removeClonedElement(evt.item, true)
                }
              } catch (error) {
                console.error('❌ Failed to assign staff, reverting drag operation:', error)
                // Always remove on error
                removeClonedElement(evt.item, true)
              }
            }
          } else {
            console.log('⚠️ Invalid drop target, removing element')
            // If no valid drop target, always remove the clone
            removeClonedElement(evt.item, true)
          }
        },
      })

      staffSortableInstances.value.set(instanceKey, sortableInstance)
      return sortableInstance
    } catch (error) {
      console.error(`Error initializing job staff sortable for job ${jobId}:`, error)
      return null
    }
  }

  const assignStaffToJob = async (jobId: string, staffId: string) => {
    try {
      console.log(`🧑‍💼 Assigning staff ${staffId} to job ${jobId}`)
      const csrfToken = getCsrfToken()
      const response = await api.post(
        `/job/api/job/${jobId}/assignment`,
        {
          staff_id: staffId,
          job_id: jobId,
        },
        {
          headers: {
            'X-CSRFToken': csrfToken || '',
          },
        },
      )

      if (response.data.success) {
        console.log(`✅ Staff assigned successfully`)
        emit('staff-assigned', { jobId, staffId })
        emit('jobs-reload-needed')
      } else {
        throw new Error(response.data.error || 'Failed to assign staff')
      }
    } catch (error) {
      console.error('❌ Error assigning staff to job:', error)
      throw error
    }
  }

  const removeStaffFromJob = async (jobId: string, staffId: string) => {
    try {
      console.log(`🧑‍💼 Removing staff ${staffId} from job ${jobId}`)
      const csrfToken = getCsrfToken()
      const response = await api.delete(`/job/api/job/${jobId}/assignment`, {
        data: {
          job_id: jobId,
          staff_id: staffId,
        },
        headers: {
          'X-CSRFToken': csrfToken || '',
        },
      })

      if (response.data.success) {
        console.log(`✅ Staff removed successfully`)
        emit('staff-removed', { jobId, staffId })
        emit('jobs-reload-needed')
      } else {
        throw new Error(response.data.error || 'Failed to remove staff')
      }
    } catch (error) {
      console.error('❌ Error removing staff from job:', error)
      throw error
    }
  }

  const destroyStaffSortable = (key: string) => {
    const instance = staffSortableInstances.value.get(key)
    if (instance) {
      try {
        instance.destroy()
        staffSortableInstances.value.delete(key)
      } catch (error) {
        console.warn(`Error destroying staff sortable instance ${key}:`, error)
        staffSortableInstances.value.delete(key)
      }
    }
  }

  const destroyAllStaffSortables = () => {
    try {
      staffSortableInstances.value.forEach((instance, key) => {
        try {
          instance.destroy()
        } catch (error) {
          console.warn(`Error destroying staff sortable for ${key}:`, error)
        }
      })
      staffSortableInstances.value.clear()

      // Clean up drag state
      isStaffDragging.value = false
      document.body.classList.remove('is-staff-dragging')
    } catch (error) {
      console.error('Error during staff sortable cleanup:', error)
    }
  }

  const updateJobStaffContainers = async (jobs: Job[]) => {
    await nextTick()

    // Remove instances for jobs that no longer exist
    const currentJobIds = new Set(jobs.map((job) => `job-${job.id}`))
    const instancesToRemove: string[] = []

    staffSortableInstances.value.forEach((_, key) => {
      if (key.startsWith('job-') && !currentJobIds.has(key)) {
        instancesToRemove.push(key)
      }
    })

    instancesToRemove.forEach((key) => destroyStaffSortable(key))
  }

  // Auto cleanup on component unmount
  onBeforeUnmount(() => {
    destroyAllStaffSortables()
  })

  return {
    isStaffDragging,
    initializeStaffPool,
    initializeJobStaffContainer,
    updateJobStaffContainers,
    destroyStaffSortable,
    destroyAllStaffSortables,
  }
}
