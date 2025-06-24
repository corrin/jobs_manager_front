import { ref, computed } from 'vue'
import { useJobsStore } from '@/stores/jobs'

export function useJobData(jobId: string | Ref<string | null>) {
  const jobsStore = useJobsStore()
  const loading = ref(false)
  const error = ref<string | null>(null)

  const jobData = computed(() => {
    const id = typeof jobId === 'string' ? jobId : jobId.value
    return id ? jobsStore.getJobById(id) : null
  })

  async function loadJob() {
    loading.value = true
    error.value = null
    try {
      const data = await jobsStore.fetchJob(jobId.value)
      console.log('[useJobData] fetchJob result:', data)
      if (data && data.job) {
        jobsStore.setDetailedJob({ ...data.job, events: data.events || [] })
      } else if (data && data.id) {
        jobsStore.setDetailedJob({ ...data, events: data.events || [] })
      } else {
        throw new Error('Job data is missing or invalid from fetchJob')
      }
    } catch (err: unknown) {
      const e = err as Error
      error.value = e.message || 'Failed to load job data.'

      console.error('[useJobData] Error in loadJob:', err)
    } finally {
      loading.value = false
    }
  }

  async function updateJob() {
    if (!jobId || (typeof jobId !== 'string' && !jobId.value)) return
    loading.value = true
    error.value = null
    try {
    } catch (err: unknown) {
      const e = err as Error
      error.value = e?.message || 'Failed to update job'
    } finally {
      loading.value = false
    }
  }

  async function deleteJob() {
    if (!jobId || (typeof jobId !== 'string' && !jobId.value)) return
    loading.value = true
    error.value = null
    try {
    } catch (err: unknown) {
      const e = err as Error
      error.value = e?.message || 'Failed to delete job'
    } finally {
      loading.value = false
    }
  }

  return {
    jobData,
    loading,
    error,
    loadJob,
    updateJob,
    deleteJob,
  }
}
