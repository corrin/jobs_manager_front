import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { JobService } from '@/services/job.service'
import { useJobsStore } from '@/stores/jobs'
import { KanbanCategorizationService } from '@/services/kanban-categorization.service'
import type { Job, StatusChoice, AdvancedFilters, Staff } from '@/types'

export function useKanban(onJobsLoaded?: () => void) {
  const jobService = JobService.getInstance()
  const router = useRouter()
  const jobsStore = useJobsStore()

  // State local (UI específico do kanban)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const searchQuery = ref('')
  const showAdvancedSearch = ref(false)
  const showSearchResults = ref(false)
  const showArchived = ref(false)
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
    paid: '',
  })

  // Computed para acessar dados do store
  const jobs = computed(() =>
    jobsStore.allKanbanJobs.filter((job) => job.status_key !== 'archived'),
  )
  const archivedJobs = computed(() =>
    jobsStore.allKanbanJobs.filter((job) => job.status_key === 'archived'),
  )
  const filteredJobs = ref<Job[]>([])
  const totalArchivedJobs = computed(() => archivedJobs.value.length)

  // Helper function to check if job matches staff filters
  const jobMatchesStaffFilters = (job: Job): boolean => {
    if (activeStaffFilters.value.length === 0) {
      return true
    }

    // Check if job is assigned to any of the filtered staff
    const assignedStaffIds = job.people?.map((staff: Staff) => staff.id.toString()) || []
    const isAssignedToActiveStaff = assignedStaffIds.some((staffId: string) =>
      activeStaffFilters.value.includes(staffId),
    )

    // Check if job was created by any of the filtered staff
    const isCreatedByActiveStaff = job.created_by_id
      ? activeStaffFilters.value.includes(job.created_by_id.toString())
      : false

    return isAssignedToActiveStaff || isCreatedByActiveStaff
  }

  // Computed using new categorization system
  const getJobsByStatus = computed(() => (columnId: string) => {
    let jobList: Job[]

    // Handle archived column specially
    if (columnId === 'archived') {
      jobList = archivedJobs.value
    } else {
      // Use categorization service to filter jobs for this column
      jobList = KanbanCategorizationService.getJobsForColumn(jobs.value, columnId)
    }

    // Apply staff filters
    return jobList.filter((job) => jobMatchesStaffFilters(job))
  })

  const getJobCountByStatus = computed(() => (columnId: string) => {
    if (columnId === 'archived') {
      return archivedJobs.value.length
    }
    return getJobsByStatus.value(columnId).length
  })

  // Get kanban columns instead of individual statuses
  const visibleStatusChoices = computed(() => {
    return KanbanCategorizationService.getAllColumns()
      .filter((col) => col.columnId !== 'archived')
      .map((col) => ({
        key: col.columnId,
        label: col.columnTitle,
        tooltip: `Includes: ${col.subCategories.map((sub) => sub.badgeLabel).join(', ')}`,
      }))
  })

  // Methods
  const loadJobs = async (): Promise<void> => {
    if (isLoading.value) return

    try {
      isLoading.value = true
      error.value = null

      // Configurar contexto no store
      jobsStore.setCurrentContext('kanban')
      jobsStore.setLoadingKanban(true)

      const data = await jobService.getAllJobs()

      // Converter jobs para o formato do kanban e salvar no store
      const kanbanJobs = [...data.activeJobs, ...data.archivedJobs].map((job) => ({
        id: job.id,
        name: job.name,
        description: job.description,
        job_number: job.job_number,
        client_name: job.client_name,
        contact_person: job.contact_person,
        people: job.people || [],
        status: job.status_key || '', // Use status_key for categorization
        status_key: job.status_key || '',
        status_display: job.status || '', // Keep display name separate
        job_status: job.status_key || '', // Mapear status_key para job_status
        paid: job.paid,
        created_by_id: job.created_by_id,
        created_at: job.created_at,
        priority: job.priority,
      }))

      jobsStore.setKanbanJobs(kanbanJobs)

      console.log('Jobs loaded and stored:', {
        activeJobs: data.activeJobs.length,
        archivedJobs: data.archivedJobs.length,
        totalArchived: data.totalArchived,
      })

      // Callback to reinitialize sortable after jobs are loaded
      if (onJobsLoaded) {
        onJobsLoaded()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load jobs'
      console.error('Error loading jobs:', err)
    } finally {
      isLoading.value = false
      jobsStore.setLoadingKanban(false)
    }
  }

  const loadStatusChoices = async (): Promise<void> => {
    try {
      const data = await jobService.getStatusChoices()

      // Convert statuses object to array format expected by the frontend
      // Note: These are now kanban columns, not individual job statuses
      statusChoices.value = Object.entries(data.statuses).map(([key, label]) => ({
        key,
        label,
        tooltip: data.tooltips[key] || '',
      }))

      // Initialize selectedMobileStatus with first visible status
      if (!selectedMobileStatus.value && statusChoices.value.length > 0) {
        const firstStatus = statusChoices.value.find((s) => s.key !== 'archived')
        selectedMobileStatus.value = firstStatus?.key || statusChoices.value[0].key
      }
    } catch (err) {
      console.error('Error loading status choices:', err)

      // Fallback to kanban columns from categorization service
      const columns = KanbanCategorizationService.getAllColumns()
      statusChoices.value = columns.map((col) => ({
        key: col.columnId,
        label: col.columnTitle,
        tooltip: `Includes: ${col.subCategories.map((sub) => sub.badgeLabel).join(', ')}`,
      }))

      // Initialize with first non-archived column
      if (!selectedMobileStatus.value) {
        selectedMobileStatus.value =
          columns.find((c) => c.columnId !== 'archived')?.columnId || 'draft'
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
      paid: '',
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

  const shouldShowLoadMore = (): boolean => {
    // TODO: Implement pagination logic
    return false
  }

  const loadMoreJobs = (status: string): void => {
    // TODO: Implement load more functionality
    console.log('Load more jobs for status:', status)
  }

  const viewJob = (job: Job): void => {
    // Navigate to job edit view using the correct route path
    router.push(`/jobs/${job.id}`)
  }

  const updateJobStatus = async (jobId: string, newStatus: string): Promise<void> => {
    try {
      // Update server first
      await jobService.updateJobStatus(jobId, newStatus)

      // Then update local store
      jobsStore.updateJobStatus(jobId, newStatus)

      // Reload jobs to ensure UI is synchronized and counters are updated
      await loadJobs()

      console.log(`✅ Job ${jobId} status updated to ${newStatus}`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update job status'
      console.error('Error updating job status:', err)

      // In case of error, reload to revert optimistic changes
      await loadJobs()
    }
  }

  const reorderJob = async (
    jobId: string,
    beforeId?: string,
    afterId?: string,
    status?: string,
  ): Promise<void> => {
    try {
      // Para reordenação, fazemos apenas a requisição ao servidor
      // pois a mudança visual já foi feita pelo SortableJS
      await jobService.reorderJob(jobId, beforeId, afterId, status)

      console.log(`✅ Job ${jobId} reordered`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder job'
      console.error('Error reordering job:', err)

      // Em caso de erro, recarregar para reverter mudanças visuais
      await loadJobs()
    }
  }

  // Staff filter management
  const handleStaffFilterChanged = (staffIds: string[]): void => {
    activeStaffFilters.value = staffIds
  }

  // Ordenação dos jobs por prioridade antes de exibir
  const jobsSortedByPriority = computed(() => {
    const arr = jobs.value.slice().sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    console.log(
      '[KANBAN DEBUG] Jobs ordenados por prioridade:',
      arr.map((j) => ({
        job_number: j.job_number,
        id: j.id,
        priority: j.priority,
        status: j.status,
        job_status: j.job_status,
      })),
    )
    return arr
  })

  // Initialize on mount
  onMounted(async () => {
    await Promise.all([loadJobs(), loadStatusChoices()])
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
    jobsSortedByPriority, // Adicionado para evitar erro de variável não usada

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
    handleStaffFilterChanged,
  }
}
