import { ref, computed, onMounted } from 'vue'
import { JobService } from '@/services/job.service'
import type { Job, StatusChoice, AdvancedFilters } from '@/types/kanban.types'

export function useKanban() {
  const jobService = JobService.getInstance()

  // State
  const jobs = ref<Job[]>([])
  const filteredJobs = ref<Job[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const showAdvancedSearch = ref(false)
  const showSearchResults = ref(false)
  const showArchived = ref(false)
  const totalArchivedJobs = ref(0)

  // Advanced filters
  const advancedFilters = ref<AdvancedFilters>({
    jobNumber: '',
    name: '',
    description: '',
    client: '',
    createdBy: '',
    status: [],
    createdAfter: '',
    createdBefore: '',
    paid: ''
  })

  // Constants
  const statusChoices: StatusChoice[] = [
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'review', label: 'Review' },
    { key: 'completed', label: 'Completed' },
    { key: 'archived', label: 'Archived' }
  ]

  // Computed
  const getJobsByStatus = computed(() => (status: string) => {
    return jobs.value.filter(job => job.status === status)
  })

  const getJobCountByStatus = computed(() => (status: string) => {
    return getJobsByStatus.value(status).length
  })

  const visibleStatusChoices = computed(() =>
    statusChoices.filter(s => s.key !== 'archived')
  )

  // Methods
  const loadJobs = async (): Promise<void> => {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      const jobsData = await jobService.getAllJobs()
      jobs.value = jobsData

      // Count archived jobs
      totalArchivedJobs.value = jobsData.filter(job => job.status === 'archived').length
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load jobs'
      console.error('Error loading jobs:', err)
    } finally {
      isLoading.value = false
    }
  }

  const handleSearch = (): void => {
    if (!searchQuery.value.trim()) {
      showSearchResults.value = false
      filteredJobs.value = []
      return
    }

    filteredJobs.value = jobService.searchJobs(jobs.value, searchQuery.value)
    showSearchResults.value = true
  }

  const handleAdvancedSearch = (): void => {
    // TODO: Implement advanced search logic with filters
    console.log('Advanced search:', advancedFilters.value)
  }

  const clearFilters = (): void => {
    advancedFilters.value = {
      jobNumber: '',
      name: '',
      description: '',
      client: '',
      createdBy: '',
      status: [],
      createdAfter: '',
      createdBefore: '',
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

  // Initialize on mount
  onMounted(() => {
    loadJobs()
  })

  return {
    // State
    jobs,
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
    handleSearch,
    handleAdvancedSearch,
    clearFilters,
    toggleAdvancedSearch,
    backToKanban,
    toggleArchive,
    shouldShowLoadMore,
    loadMoreJobs,
    viewJob
  }
}
