import { ref, nextTick, onBeforeUnmount } from 'vue'
import Sortable from 'sortablejs'
import api from '@/services/api'
import { getCsrfToken } from '@/utils/csrf'
import { useDeviceDetection } from '@/composables/useDeviceDetection'

type StaffDragAndDropEmits = {
  (event: 'staff-assigned', payload: { jobId: string, staffId: string }): void
  (event: 'staff-removed', payload: { jobId: string, staffId: string }): void
  (event: 'jobs-reload-needed'): void
}

export function useStaffDragAndDrop(emit: StaffDragAndDropEmits) {
  const staffSortableInstances = ref<Map<string, Sortable>>(new Map())
  const isStaffDragging = ref(false)
  
  // Use device detection composable
  const { isMobile, getStaffDragConfig } = useDeviceDetection()

  const initializeStaffPool = (staffPanelElement: HTMLElement) => {
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

    // Get device-specific configuration for optimal touch experience
    const staffDragConfig = getStaffDragConfig()

    try {
      const sortableInstance = new Sortable(staffPanelElement, {
        group: {
          name: 'staffPool',
          pull: 'clone',
          put: false // Staff pool should only allow items to be pulled (cloned), not dropped into
        },
        sort: false,
        animation: 150,
        ghostClass: 'staff-sortable-ghost',
        chosenClass: 'staff-sortable-chosen',
        dragClass: 'staff-sortable-drag',
        
        // Apply device-specific configuration
        ...staffDragConfig,

        onStart: () => {
          isStaffDragging.value = true
          document.body.classList.add('is-staff-dragging')
        },

        onEnd: () => {
          isStaffDragging.value = false
          document.body.classList.remove('is-staff-dragging')
        },

        onAdd: (evt) => {
          // Staff returned to pool from job
          const staffId = evt.item.dataset.staffId
          const fromJobCard = evt.from.closest('[data-id]')

          if (fromJobCard && staffId) {
            const jobId = fromJobCard.getAttribute('data-id')
            if (jobId) {
              console.log(`Staff ${staffId} returned to pool from job ${jobId}`)
              removeStaffFromJob(jobId, staffId)
            }
          }

          // Remove the cloned element
          evt.item.remove()
        }
      })

      staffSortableInstances.value.set('staffPool', sortableInstance)
      return sortableInstance
    } catch (error) {
      console.error('Error initializing staff pool sortable:', error)
      return null
    }
  }

  const initializeJobStaffContainer = (jobStaffElement: HTMLElement, jobId: string) => {
    if (!jobStaffElement || !jobId) {
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

    // Get device-specific configuration
    const staffDragConfig = getStaffDragConfig()

    try {
      const sortableInstance = new Sortable(jobStaffElement, {
        group: {
          name: 'staffOnJob',
          pull: true,
          put: ['staffPool', 'staffOnJob']
        },
        animation: 150,
        ghostClass: 'staff-sortable-ghost',
        chosenClass: 'staff-sortable-chosen',
        dragClass: 'staff-sortable-drag',
        
        // Apply device-specific configuration
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
          const staffId = evt.item.getAttribute('data-staff-id')
          const targetJobCard = evt.to.closest('[data-id]')

          if (staffId && targetJobCard) {
            const targetJobId = targetJobCard.getAttribute('data-id')
            if (targetJobId) {
              console.log(`Staff ${staffId} added to job ${targetJobId}`)
              
              // Check if this came from the staff pool
              const fromStaffPool = evt.from.classList.contains('staff-list') || 
                                   evt.from.closest('#staff-panel')
              
              try {
                await assignStaffToJob(targetJobId, staffId)
                
                // If it came from staff pool, remove the dragged clone element
                if (fromStaffPool) {
                  evt.item.remove()
                }
              } catch (error) {
                console.error('Failed to assign staff, reverting drag operation')
                // If assignment failed, revert the drag operation
                evt.item.remove()
              }
            }
          }
        }
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
      const csrfToken = getCsrfToken()
      const response = await api.post(`/api/job/${jobId}/assignment`, {
        staff_id: staffId,
        job_id: jobId
      }, {
        headers: {
          'X-CSRFToken': csrfToken || ''
        }
      })

      if (response.data.success) {
        emit('staff-assigned', { jobId, staffId })
        emit('jobs-reload-needed')
      } else {
        throw new Error(response.data.error || 'Failed to assign staff')
      }
    } catch (error) {
      console.error('Error assigning staff to job:', error)
      throw error
    }
  }

  const removeStaffFromJob = async (jobId: string, staffId: string) => {
    try {
      const csrfToken = getCsrfToken()
      const response = await api.delete(`/api/job/${jobId}/assignment`, {
        data: {
          job_id: jobId,
          staff_id: staffId
        },
        headers: {
          'X-CSRFToken': csrfToken || ''
        }
      })

      if (response.data.success) {
        emit('staff-removed', { jobId, staffId })
        emit('jobs-reload-needed')
      } else {
        throw new Error(response.data.error || 'Failed to remove staff')
      }
    } catch (error) {
      console.error('Error removing staff from job:', error)
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

  const updateJobStaffContainers = async (jobs: any[]) => {
    await nextTick()

    // Remove instances for jobs that no longer exist
    const currentJobIds = new Set(jobs.map(job => `job-${job.id}`))
    const instancesToRemove: string[] = []

    staffSortableInstances.value.forEach((_, key) => {
      if (key.startsWith('job-') && !currentJobIds.has(key)) {
        instancesToRemove.push(key)
      }
    })

    instancesToRemove.forEach(key => destroyStaffSortable(key))
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
    destroyAllStaffSortables
  }
}
