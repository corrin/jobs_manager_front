<template>
  <AppLayout>
    <!-- Main Content with flex layout for full height utilization -->
    <div class="flex flex-col min-h-screen mt-5 md:mt-15 lg:mt-0">
      <!-- Header Section - flexible size -->
      <div class="flex-shrink-0 p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3 md:pt-1 lg:pt-6">
        <!-- Search Section -->
        <div class="mb-2 md:mb-3 space-y-2">
          <div class="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button @click="showAdvancedSearchDialog = true"
              class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-all duration-200 flex items-center flex-shrink-0">
              <Search class="mr-1.5 h-3.5 w-3.5" />
              Advanced Search
            </button>

            <div class="w-full max-w-xs sm:max-w-md">
              <div class="relative">
                <Search class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input v-model="searchQuery" type="text" placeholder="Search..."
                  class="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  @input="handleSearch" />
              </div>
            </div>
          </div>
        </div>

        <!-- Main Kanban Content Area - uses remaining space -->
        <div class="flex-1 flex flex-col px-2 sm:px-4 lg:px-6 py-1 md:py-2">
          <!-- Team Members -->
          <div v-if="!showSearchResults" class="mb-2 md:mb-3">
            <div class="flex justify-center">
              <StaffPanel :active-filters="activeStaffFilters" @staff-filter-changed="handleStaffFilterChanged"
                @staff-panel-ready="handleStaffPanelReady" />
            </div>
          </div>

          <!-- Search Results Grid -->
          <div v-if="showSearchResults" class="mb-2 md:mb-3">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900">Search Results ({{ filteredJobs.length }} jobs found)</h2>
              <button @click="backToKanban"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center text-sm">
                <LayoutGrid class="mr-2 h-4 w-4" />
                Back to Kanban
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <JobCard v-for="job in filteredJobs" :key="job.id" :job="job" @click="viewJob(job)" />
            </div>
          </div>

          <!-- Kanban Board - grows to fill available space -->
          <div v-if="!showSearchResults" class="flex-1 flex flex-col space-y-1 md:space-y-2">
            <!-- Mobile: Dropdown to select status -->
            <div class="block md:hidden">
              <select v-model="selectedMobileStatus"
                class="w-full p-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option v-for="status in visibleStatusChoices" :key="status.key" :value="status.key">
                  {{ status.label }} ({{ getJobsByStatus(status.key).length }})
                </option>
              </select>
            </div>

            <!-- Mobile: Single column view -->
            <div class="block md:hidden">
              <div class="flex justify-center px-4">
                <KanbanColumn
                  v-if="selectedMobileStatus && visibleStatusChoices.find(s => s.key === selectedMobileStatus)"
                  :key="selectedMobileStatus" :status="visibleStatusChoices.find(s => s.key === selectedMobileStatus)!"
                  :jobs="getJobsByStatus(selectedMobileStatus)"
                  :show-load-more="shouldShowLoadMore(selectedMobileStatus)" :is-loading="isLoading"
                  :is-dragging="isDragging" @job-click="viewJob" @load-more="loadMoreJobs(selectedMobileStatus)"
                  @sortable-ready="handleSortableReady" @job-ready="handleJobReady" class="mobile-column w-full max-w-md mx-auto" />
              </div>
            </div>

            <!-- Desktop: kanban - grows to fill space -->
            <div class="hidden md:flex md:flex-1 md:flex-col">
              <!-- Tablet: 4x2 grid layout for optimal viewing -->
              <div class="block lg:hidden">
                <div class="max-w-7xl mx-auto px-2">
                  <!-- First row: 4 columns -->
                  <div class="grid grid-cols-4 gap-2 mb-3">
                    <KanbanColumn
                      v-for="status in visibleStatusChoices.slice(0, 4)"
                      :key="status.key"
                      :status="status"
                      :jobs="getJobsByStatus(status.key)"
                      :show-load-more="shouldShowLoadMore(status.key)"
                      :is-loading="isLoading"
                      :is-dragging="isDragging"
                      @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)"
                      @sortable-ready="handleSortableReady"
                      @job-ready="handleJobReady"
                      class="tablet-column"
                    />
                  </div>

                  <!-- Second row: 4 columns -->
                  <div class="grid grid-cols-4 gap-2">
                    <KanbanColumn
                      v-for="status in visibleStatusChoices.slice(4, 8)"
                      :key="status.key"
                      :status="status"
                      :jobs="getJobsByStatus(status.key)"
                      :show-load-more="shouldShowLoadMore(status.key)"
                      :is-loading="isLoading"
                      :is-dragging="isDragging"
                      @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)"
                      @sortable-ready="handleSortableReady"
                      @job-ready="handleJobReady"
                      class="tablet-column"
                    />
                  </div>
                </div>
              </div>

              <!-- Large Desktop: Horizontal scrollable kanban -->
              <div class="hidden lg:block">
                <div class="max-w-full mx-auto">
                  <div class="flex justify-center gap-1 xl:gap-2 min-w-fit px-2">
                    <KanbanColumn v-for="status in visibleStatusChoices" :key="status.key" :status="status"
                      :jobs="getJobsByStatus(status.key)" :show-load-more="shouldShowLoadMore(status.key)"
                      :is-loading="isLoading" :is-dragging="isDragging" @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)" @sortable-ready="handleSortableReady"
                      @job-ready="handleJobReady" class="flex-shrink-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating Archived Button -->
    <FloatingArchivedButton
      :archived-jobs="getJobsByStatus('archived')"
      :archived-count="getJobCountByStatus('archived')"
      @job-click="viewJob"
      @job-ready="handleJobReady"
      @sortable-ready="handleSortableReady"
      @archive-job="handleArchiveJob"
    />

    <!-- Advanced Search Dialog -->
    <AdvancedSearchDialog
      :is-open="showAdvancedSearchDialog"
      :filters="advancedFilters"
      :is-loading="isLoading"
      @close="showAdvancedSearchDialog = false"
      @search="handleAdvancedSearchFromDialog"
      @clear-filters="clearFilters"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onUnmounted, onMounted } from 'vue'
import {
  Search,
  X,
  LayoutGrid,
  Archive,
  ChevronDown,
  AlertCircle,
  RefreshCw
} from 'lucide-vue-next'
import JobCard from '@/components/JobCard.vue'
import KanbanColumn from '@/components/KanbanColumn.vue'
import AppLayout from '@/components/AppLayout.vue'
import StaffPanel from '@/components/StaffPanel.vue'
import StaffDropdown from '@/components/StaffDropdown.vue'
import ClientDropdown from '@/components/ClientDropdown.vue'
import FloatingArchivedButton from '@/components/FloatingArchivedButton.vue'
import AdvancedSearchDialog from '@/components/AdvancedSearchDialog.vue'
import { useKanban } from '@/composables/useKanban'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useStaffDragAndDrop } from '@/composables/useStaffDragAndDrop'

// Staff filters state
const {
  // State
  jobs,
  archivedJobs,
  filteredJobs,
  isLoading,
  error,
  searchQuery,
  showAdvancedSearch,
  showSearchResults,
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
  handleSearch,
  handleAdvancedSearch,
  clearFilters,
  toggleAdvancedSearch,
  backToKanban,
  shouldShowLoadMore,
  loadMoreJobs,
  viewJob,
  updateJobStatus,
  reorderJob,
  handleStaffFilterChanged
} = useKanban()

// Local state for dialog
const showAdvancedSearchDialog = ref(false)

// Handle advanced search from dialog seguindo clean code principles
const handleAdvancedSearchFromDialog = async (filters: any) => {
  try {
    // Delegate to existing advanced search functionality
    Object.assign(advancedFilters.value, filters)
    await handleAdvancedSearch()
  } catch (error) {
    console.error('Error performing advanced search from dialog:', error)
  }
}

// Toggle advanced search seguindo early return pattern
const toggleAdvancedSearchDialog = () => {
  // Switch between panel and dialog
  switch (showAdvancedSearch.value) {
    case true:
      // Close panel, open dialog
      showAdvancedSearch.value = false
      showAdvancedSearchDialog.value = true
      break
    case false:
      // Open dialog directly
      showAdvancedSearchDialog.value = true
      break
  }
}

const {
  isDragging,
  initializeSortable,
  destroyAllSortables
} = useDragAndDrop((event, payload) => {
  if (event === 'job-moved') {
    const { jobId, fromStatus, toStatus, beforeId, afterId } = payload

    if (fromStatus !== toStatus) {
      // Status change
      updateJobStatus(jobId, toStatus)
    } else {
      // Reorder within same status
      reorderJob(jobId, beforeId, afterId, toStatus)
    }
  }
})

// Staff drag and drop composable
const {
  isStaffDragging,
  initializeStaffPool,
  initializeJobStaffContainer,
  updateJobStaffContainers
} = useStaffDragAndDrop(async (event: string, payload?: any) => {
  if (event === 'staff-assigned') {
    console.log(`Staff ${payload.staffId} assigned to job ${payload.jobId}`)
  } else if (event === 'staff-removed') {
    console.log(`Staff ${payload.staffId} removed from job ${payload.jobId}`)
  } else if (event === 'jobs-reload-needed') {
    await loadJobs()
    // Update staff containers after jobs are reloaded
    const allJobs = [...jobs.value, ...archivedJobs.value]
    updateJobStaffContainers(allJobs)
  }
})

const handleSortableReady = (element: HTMLElement, status: string) => {
  const allJobs = [...jobs.value, ...archivedJobs.value]
  initializeSortable(element, status, allJobs)
}

const handleStaffPanelReady = (staffPanelElement: HTMLElement) => {
  console.log('Staff panel ready, initializing staff pool drag and drop')
  initializeStaffPool(staffPanelElement)
}

const handleJobReady = (payload: { jobId: string, element: HTMLElement }) => {
  console.log(`Job ${payload.jobId} ready, initializing staff container`)
  initializeJobStaffContainer(payload.element, payload.jobId)
}

const clearSearch = () => {
  searchQuery.value = ''
  handleSearch()
}

const handleArchiveJob = (jobId: string) => {
  console.log(`Archiving job ${jobId}`)
  updateJobStatus(jobId, 'archived')
}

// Handler for archived job drop events
const handleArchivedJobDrop = (event: CustomEvent) => {
  console.log('Archived job drop event received:', event.detail)
  const { jobId, targetStatus } = event.detail

  if (jobId && targetStatus) {
    console.log(`Moving job ${jobId} from archived to ${targetStatus}`)
    updateJobStatus(jobId, targetStatus)
  }
}

// Setup global event listener for archived job drops
onMounted(async () => {
  document.addEventListener('archived-job-drop', handleArchivedJobDrop as EventListener)
})

// Cleanup on unmount
onUnmounted(() => {
  destroyAllSortables()
  document.removeEventListener('archived-job-drop', handleArchivedJobDrop as EventListener)
})
</script>

<style scoped>
/* Mobile column styling for better job card display */
.mobile-column {
  min-width: 320px;
  max-width: 400px;
  width: 100%;
}

/* Mobile-specific improvements for job cards and columns */
@media (max-width: 767px) {
  .mobile-column :deep(.kanban-column) {
    min-width: 320px;
    max-width: 400px;
    width: 100%;
  }
  
  /* Increase job card width in mobile */
  .mobile-column :deep(.job-card) {
    min-width: 280px;
    width: 100%;
    padding: 16px;
  }
  
  /* Better spacing for mobile column content */
  .mobile-column :deep(.p-1) {
    padding: 12px;
  }
  
  .mobile-column :deep(.space-y-1 > * + *) {
    margin-top: 8px;
  }
}

/* Tablet column styling for optimal job card display */
.tablet-column {
  min-width: 200px;
  max-width: 280px;
  width: 100%;
}

/* Ensure proper responsiveness for 4x2 tablet layout */
@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-column {
    /* Each column gets 1/4 of container width minus gaps */
    width: calc((100% - 0.75rem) / 4);
    min-width: 160px;
    max-width: 200px;
  }
}

/* Override default column sizing for tablet layout - maintain normal heights */
@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-column :deep(.kanban-column) {
    min-width: 160px;
    max-width: 200px;
    width: 100%;
    height: fit-content;
  }
}
</style>
