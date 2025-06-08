import { ref, computed, onMounted } from 'vue'
import { JobService } from '@/services/job.service'
import type { Job, StatusChoice, AdvancedFilters } from '@/types'

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
  const selectedMobileStatus = ref('')

  // Staff filters
  const activeStaffFilters = ref<string[]>([])

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

  // Helper function to check if job matches staff filters
  const jobMatchesStaffFilters = (job: Job): boolean => {
    if (activeStaffFilters.value.length === 0) {
      return true
    }

    // Check if job is assigned to any of the filtered staff
    const assignedStaffIds = job.people?.map((staff: any) => staff.id.toString()) || []
    const isAssignedToActiveStaff = assignedStaffIds.some((staffId: string) =>
      activeStaffFilters.value.includes(staffId)
    )

    // Check if job was created by any of the filtered staff
    const isCreatedByActiveStaff = job.created_by_id ? 
      activeStaffFilters.value.includes(job.created_by_id.toString()) : false

    return isAssignedToActiveStaff || isCreatedByActiveStaff
  }

  // Computed
  const getJobsByStatus = computed(() => (status: string) => {
    let jobList: Job[]
    
    if (status === 'archived') {
      jobList = archivedJobs.value
    } else {
      jobList = jobs.value.filter(job => job.status_key === status)
    }

    // Apply staff filters
    return jobList.filter(job => jobMatchesStaffFilters(job))
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
      
      // Initialize selectedMobileStatus with first visible status
      if (!selectedMobileStatus.value && statusChoices.value.length > 0) {
        const firstStatus = statusChoices.value.find(s => s.key !== 'archived')
        selectedMobileStatus.value = firstStatus?.key || statusChoices.value[0].key
      }
    } catch (err) {
      console.error('Error loading status choices:', err)
      // Fallback to default status choices
      statusChoices.value = [
        { key: 'pending', label: 'Pending', tooltip: '' },
        { key: 'in_progress', label: 'In Progress', tooltip: '' },
        { key: 'review', label: 'Review', tooltip: '' },
        { key: 'completed', label: 'Completed', tooltip: '' },
        { key: 'archived', label: 'Archived', tooltip: '' }
      ]
      
      // Initialize with first non-archived status
      if (!selectedMobileStatus.value) {
        selectedMobileStatus.value = 'pending'
      }
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
    jobId: string,
    beforeId?: string,
    afterId?: string,
    status?: string
  ): Promise<void> => {
    try {
      await jobService.reorderJob(
        jobId,
        beforeId,
        afterId,
        status
      )
      await loadJobs() // Reload jobs after reordering
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder job'
      console.error('Error reordering job:', err)
    }
  }

  // Staff filter management
  const handleStaffFilterChanged = (staffIds: string[]): void => {
    activeStaffFilters.value = staffIds
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
    activeStaffFilters,
    selectedMobileStatus,

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
    reorderJob,
    handleStaffFilterChanged
  }
}
