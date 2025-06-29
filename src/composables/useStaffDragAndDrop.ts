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

  const removeClonedElement = (element: HTMLElement, shouldRemove: boolean = true) => {
    if (!shouldRemove || !element) return undefined

    try {
      console.log('🗑️ Removing cloned element:', element)

      element.style.transform = 'translate3d(0,0,0)'

      element.style.display = 'none'
      element.style.visibility = 'hidden'
      element.style.opacity = '0'
      element.style.pointerEvents = 'none'

      if (element.parentNode) {
        element.parentNode.removeChild(element)
        console.log('✅ Element removed via parentNode')

        return
      }

      requestAnimationFrame(() => {
        if (element && element.parentNode) {
          element.parentNode.removeChild(element)
          console.log('✅ Element removed via requestAnimationFrame')
        }
      })
    } catch (error) {
      console.warn('❌ Error removing cloned element:', error)

      try {
        element.style.cssText =
          'display: none !important; visibility: hidden !important; opacity: 0 !important; position: absolute !important; left: -9999px !important;'
      } catch (hideError) {
        console.warn('❌ Could not even hide element:', hideError)
      }
    }
  }

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
    removeCloneOnHide: true,
    emptyInsertThreshold: 5,
    revertOnSpill: false,
  })

  const initializeStaffPool = (staffPanelElement: HTMLElement) => {
    console.log('🧑‍💼 Initializing staff pool:', staffPanelElement)
    if (!staffPanelElement) {
      console.warn('Staff panel element not provided for staff drag and drop')
      return null
    }

    const existingInstance = staffSortableInstances.value.get('staffPool')
    if (existingInstance) {
      try {
        existingInstance.destroy()
        staffSortableInstances.value.delete('staffPool')
      } catch (error) {
        console.warn('Error destroying existing staff pool sortable:', error)
      }
    }

    const staffDragConfig = getStaffDragConfig()

    try {
      const sortableInstance = new Sortable(staffPanelElement, {
        group: {
          name: 'staffPool',
          pull: 'clone',
          put: ['staffOnJob'],
        },
        sort: false,
        animation: 150,
        ghostClass: 'staff-sortable-ghost',
        chosenClass: 'staff-sortable-chosen',
        dragClass: 'staff-sortable-drag',

        onClone: (evt) => {
          console.log('📋 Staff clone created:', evt.clone)

          evt.clone.setAttribute('data-is-clone', 'true')
        },

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

          const cleanupElements = () => {
            const clones = document.querySelectorAll('[data-is-clone="true"]')
            clones.forEach((clone) => {
              console.log('🗑️ Cleaning up leftover clone:', clone)
              removeClonedElement(clone as HTMLElement, true)
            })

            const ghosts = document.querySelectorAll('.sortable-ghost, .staff-sortable-ghost')
            ghosts.forEach((ghost) => {
              console.log('👻 Removing ghost element:', ghost)
              if (ghost.parentNode) {
                ghost.parentNode.removeChild(ghost)
              }
            })
          }

          cleanupElements()
          requestAnimationFrame(cleanupElements)
          setTimeout(cleanupElements, 200)
        },

        onAdd: (evt) => {
          console.log('🔄 Staff returned to pool:', evt)

          const staffId = evt.item.dataset.staffId
          const fromJobCard = evt.from.closest('[data-id]')

          if (fromJobCard && staffId) {
            const jobId = fromJobCard.getAttribute('data-id')
            if (jobId) {
              console.log(`🧑‍💼 Staff ${staffId} returned to pool from job ${jobId}`)
              removeStaffFromJob(jobId, staffId)
            }
          }

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
    if (!jobStaffElement || !jobId) {
      console.warn('Job staff element or jobId not provided')
      return null
    }

    const instanceKey = `job-${jobId}`

    const existingInstance = staffSortableInstances.value.get(instanceKey)
    if (existingInstance) {
      try {
        existingInstance.destroy()
        staffSortableInstances.value.delete(instanceKey)
      } catch (error) {
        console.warn(`Error destroying existing job staff sortable for job ${jobId}:`, error)
      }
    }

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

              const fromStaffPool = Boolean(
                evt.from.classList.contains('staff-list') ||
                  evt.from.closest('#staff-panel') ||
                  isClone,
              )

              try {
                await assignStaffToJob(targetJobId, staffId)
                console.log('✅ Staff assignment successful')

                if (fromStaffPool || isClone) {
                  console.log('🗑️ Removing clone after successful assignment')
                  removeClonedElement(evt.item, true)
                }
              } catch (error) {
                console.error('❌ Failed to assign staff, reverting drag operation:', error)

                removeClonedElement(evt.item, true)
              }
            }
          } else {
            console.log('⚠️ Invalid drop target, removing element')

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

      isStaffDragging.value = false
      document.body.classList.remove('is-staff-dragging')
    } catch (error) {
      console.error('Error during staff sortable cleanup:', error)
    }
  }

  const updateJobStaffContainers = async (jobs: Job[]) => {
    await nextTick()

    const currentJobIds = new Set(jobs.map((job) => `job-${job.id}`))
    const instancesToRemove: string[] = []

    staffSortableInstances.value.forEach((_, key) => {
      if (key.startsWith('job-') && !currentJobIds.has(key)) {
        instancesToRemove.push(key)
      }
    })

    instancesToRemove.forEach((key) => destroyStaffSortable(key))
  }

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
