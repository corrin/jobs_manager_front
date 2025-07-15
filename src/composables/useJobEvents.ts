import { ref, computed, watch } from 'vue'
import { useJobsStore } from '@/stores/jobs'
import type { JobEvent } from '@/schemas/job.schemas'
import { useJobData } from '@/composables/useJobData'
import type { Ref } from 'vue'
import { debugLog } from '@/utils/debug'

export function useJobEvents(jobId: string | Ref<string | null>) {
  const jobsStore = useJobsStore()
  const { jobData } = useJobData(jobId)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const jobEvents = ref<JobEvent[]>([])

  const getJobId = () => (typeof jobId === 'string' ? jobId : jobId.value)

  function loadEvents() {
    const id = getJobId()
    debugLog('[useJobEvents] loadEvents called. jobId:', id)
    if (jobData.value && Array.isArray(jobData.value.events)) {
      jobEvents.value = [...jobData.value.events]
      debugLog('[useJobEvents] Loaded events from jobData:', jobEvents.value)
    } else if (
      jobData.value &&
      Array.isArray(jobData.value.events) === false &&
      Array.isArray(jobData.value.events) !== undefined
    ) {
      jobEvents.value = []
      debugLog('[useJobEvents] No events found in jobData, set to empty array.')
    } else {
      const job = id ? jobsStore.getJobById(id) : null
      jobEvents.value = job?.events ? [...job.events] : []
      debugLog('[useJobEvents] Loaded events from store:', jobEvents.value)
    }
  }

  watch(
    () => jobData.value,
    (val) => {
      debugLog('[useJobEvents] jobData changed:', val)
      loadEvents()
    },
    { immediate: true, deep: true },
  )

  async function addEvent(description: string) {
    const id = getJobId()
    if (!id || !description) {
      debugLog('[useJobEvents] addEvent called with missing id or description', {
        id,
        description,
      })
      return
    }
    loading.value = true
    error.value = null
    try {
      debugLog('[useJobEvents] Adding event via API:', { id, description })
      const response = await jobRestService.addJobEvent(id, description)
      debugLog('[useJobEvents] API response:', response)
      if (response.success) {
        if (typeof jobData.value?.reload === 'function') {
          debugLog('[useJobEvents] Calling jobData.reload() after event add')
          await jobData.value.reload()
        }
        loadEvents()
        debugLog('[useJobEvents] Event added and events reloaded.')
      } else {
        debugLog('[useJobEvents] Failed to add event:', response.error)
        throw new Error(response.error || 'Failed to add event')
      }
    } catch (err: unknown) {
      const e = err as Error
      error.value = e?.message || 'Failed to add event'
      debugLog('[useJobEvents] Error adding event:', error.value)
    } finally {
      loading.value = false
      debugLog('[useJobEvents] addEvent finished. loading:', loading.value)
    }
  }

  return {
    jobEvents: computed(() => jobEvents.value),
    loading,
    error,
    addEvent,
  }
}
