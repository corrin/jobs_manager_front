import { ref, computed, onMounted } from 'vue'
import { JobService } from '@/services/job.service'
import type { Job, StatusChoice, AdvancedFilters } from '@/schemas/kanban.schemas'

export function useKanban() {
  const jobService = JobService.getInstance()

  // State
  const jobs = ref<Job[]>([])
  const archivedJobs = ref<Job[]>([])
  const filteredJobs = ref<Job[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const showAdvancedSearch = ref(false)
  const showSearchResults = ref(false)
  const showArchived = ref(false)
  const totalArchivedJobs = ref(0)
  const statusChoices = ref<StatusChoice[]>([])

  // Advanced filters
  const advancedFilters = ref<AdvancedFilters>({
    job_number: '',
    name: '',
    description: '',
    client_name: '',
    contact_person: '',
    created_by: '',
    status: [],
    created_after: '',
    created_before: '',
    paid: ''
  })

  // Computed
  const getJobsByStatus = computed(() => (status: string) => {
    if (status === 'archived') {
      return archivedJobs.value
    }
    return jobs.value.filter(job => job.status_key === status)
  })

  const getJobCountByStatus = computed(() => (status: string) => {
    if (status === 'archived') {
      return archivedJobs.value.length
    }
    return getJobsByStatus.value(status).length
  })

  const visibleStatusChoices = computed(() =>
    statusChoices.value.filter(s => s.key !== 'archived')
  )

  // Methods
  const loadJobs = async (): Promise<void> => {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      const data = await jobService.getAllJobs()
      jobs.value = data.activeJobs
      archivedJobs.value = data.archivedJobs
      totalArchivedJobs.value = data.totalArchived

      console.log('Jobs loaded:', {
        activeJobs: data.activeJobs.length,
        archivedJobs: data.archivedJobs.length,
        totalArchived: data.totalArchived
      })
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load jobs'
      console.error('Error loading jobs:', err)
    } finally {
      isLoading.value = false
    }
  }

  const loadStatusChoices = async (): Promise<void> => {
    try {
      const data = await jobService.getStatusChoices()
      // Convert statuses object to array format expected by the frontend
      statusChoices.value = Object.entries(data.statuses).map(([key, label]) => ({
        key,
        label,
        tooltip: data.tooltips[key] || ''
      }))
    } catch (err) {
      console.error('Error loading status choices:', err)
      // Fallback to default status choices
      statusChoices.value = [
        { key: 'pending', label: 'Pending' },
        { key: 'in_progress', label: 'In Progress' },
        { key: 'review', label: 'Review' },
        { key: 'completed', label: 'Completed' },
        { key: 'archived', label: 'Archived' }
      ]
    }
  }

  const handleSearch = (): void => {
    if (!searchQuery.value.trim()) {
      showSearchResults.value = false
      filteredJobs.value = []
      return
    }

    // Combine active and archived jobs for search
    const allJobs = [...jobs.value, ...archivedJobs.value]
    filteredJobs.value = jobService.searchJobs(allJobs, searchQuery.value)
    showSearchResults.value = true
  }

  const handleAdvancedSearch = async (): Promise<void> => {
    try {
      isLoading.value = true
      const response = await jobService.performAdvancedSearch(advancedFilters.value)
      filteredJobs.value = response.jobs
      showSearchResults.value = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to perform advanced search'
      console.error('Error performing advanced search:', err)
    } finally {
      isLoading.value = false
    }
  }

  const clearFilters = (): void => {
    advancedFilters.value = {
      job_number: '',
      name: '',
      description: '',
      client_name: '',
      contact_person: '',
      created_by: '',
      status: [],
      created_after: '',
      created_before: '',
      paid: ''
    }
  }

  const toggleAdvancedSearch = (): void => {
    showAdvancedSearch.value = !showAdvancedSearch.value
  }

  const backToKanban = (): void => {
    showSearchResults.value = false
    searchQuery.value = ''
    filteredJobs.value = []
  }

  const toggleArchive = (): void => {
    showArchived.value = !showArchived.value
  }

  const shouldShowLoadMore = (status: string): boolean => {
    // TODO: Implement pagination logic
    return false
  }

  const loadMoreJobs = (status: string): void => {
    // TODO: Implement load more functionality
    console.log('Load more jobs for status:', status)
  }

  const viewJob = (job: Job): void => {
    // TODO: Navigate to job detail view or emit event
    console.log('View job:', job)
  }

  const updateJobStatus = async (jobId: string, newStatus: string): Promise<void> => {
    try {
      await jobService.updateJobStatus(jobId, newStatus)
      await loadJobs() // Reload jobs after status update
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update job status'
      console.error('Error updating job status:', err)
    }
  }

  const reorderJob = async (
    jobId: number,
    beforeId?: number,
    afterId?: number,
    status?: string
  ): Promise<void> => {
    try {
      await jobService.reorderJob(
        jobId.toString(),
        beforeId?.toString(),
        afterId?.toString(),
        status
      )
      await loadJobs() // Reload jobs after reordering
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder job'
      console.error('Error reordering job:', err)
    }
  }

  // Initialize on mount
  onMounted(async () => {
    await Promise.all([
      loadJobs(),
      loadStatusChoices()
    ])
  })

  return {
    // State
    jobs,
    archivedJobs,
    filteredJobs,
    isLoading,
    error,
    searchQuery,
    showAdvancedSearch,
    showSearchResults,
    showArchived,
    totalArchivedJobs,
    advancedFilters,

    // Constants
    statusChoices,
    visibleStatusChoices,

    // Computed
    getJobsByStatus,
    getJobCountByStatus,

    // Methods
    loadJobs,
    loadStatusChoices,
    handleSearch,
    handleAdvancedSearch,
    clearFilters,
    toggleAdvancedSearch,
    backToKanban,
    toggleArchive,
    shouldShowLoadMore,
    loadMoreJobs,
    viewJob,
    updateJobStatus,
    reorderJob
  }
}
