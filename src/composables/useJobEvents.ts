import { ref, computed, watch } from 'vue'
import { useJobsStore } from '@/stores/jobs'
import { useJobData } from '@/composables/useJobData'
import { jobService } from '@/services/job.service'
import type { Ref } from 'vue'
import { debugLog } from '@/utils/debug'
import { schemas } from '../api/generated/api'
import { api } from '@/api/client'
import { z } from 'zod'
import { toast } from 'vue-sonner'

type JobEvent = z.infer<typeof schemas.JobEvent>

export function useJobEvents(jobId: string | Ref<string | null>) {
  const jobsStore = useJobsStore()
  const { jobData, jobEvents: dataEvents, loadJob } = useJobData(jobId)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const jobEvents = ref<JobEvent[]>([])

  const getJobId = () => (typeof jobId === 'string' ? jobId : jobId.value)

  async function loadEvents(refresh: boolean = false) {
    const id = getJobId()
    debugLog('[useJobEvents] loadEvents called. jobId:', id)

    if (refresh) {
      debugLog('[useJobEvents] Refreshing events for jobId:', id)
      const response = await jobService.getJob(id)
      if (!response.success) {
        error.value = response.error || 'Failed to load job events'
        debugLog('[useJobEvents] Error loading events:', error.value)
        toast.error('Failed to reload job events')
        return
      }
      jobEvents.value = response.data.events || []
      debugLog('[useJobEvents] Events refreshed from API:', jobEvents.value)
      return
    }

    if (dataEvents.value && Array.isArray(dataEvents.value)) {
      jobEvents.value = [...dataEvents.value]
      debugLog('[useJobEvents] Loaded events from useJobData:', jobEvents.value)
    } else if (jobData.value && Array.isArray(jobData.value.events)) {
      jobEvents.value = [...jobData.value.events]
      debugLog('[useJobEvents] Loaded events from jobData:', jobEvents.value)
    } else {
      const job = id ? jobsStore.getJobById(id) : null
      jobEvents.value = job?.events ? [...job.events] : []
      debugLog('[useJobEvents] Loaded events from store:', jobEvents.value)
    }
  }

  async function initializeEvents() {
    const id = getJobId()
    if (id && (!dataEvents.value || dataEvents.value.length === 0)) {
      debugLog('[useJobEvents] Initializing events by loading job data')
      await loadJob()
    }
  }

  watch(
    [() => jobData.value, () => dataEvents.value],
    () => {
      debugLog('[useJobEvents] jobData or dataEvents changed')
      loadEvents()
    },
    { immediate: true, deep: true },
  )

  watch(
    () => getJobId(),
    async (id) => {
      if (id) {
        debugLog('[useJobEvents] JobId changed, initializing events:', id)
        await initializeEvents()
      }
    },
    { immediate: true },
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

      const response = await api.job_rest_jobs_events_create(
        { description },
        {
          params: { job_id: id },
        },
      )
      debugLog('[useJobEvents] API response:', response)
      if (response.success) {
        await loadJob()
        debugLog('[useJobEvents] Event added and job data reloaded.')
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
      await loadEvents(true)
    }
  }

  return {
    jobEvents: computed(() => jobEvents.value),
    loading,
    error,
    addEvent,
  }
}
