<template>
  <AppLayout>
    <!-- Main content with flex layout for full height utilisation -->
    <div class="flex flex-col min-h-screen mt-5 md:mt-15 lg:mt-0">
      <!-- Header section – flexible size -->
      <div class="flex-shrink-0 p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3 md:pt-1 lg:pt-6">
        <!-- Search section -->
        <div class="mb-2 md:mb-3 space-y-2">
          <div
            class="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 w-full"
          >
            <button
              @click="showAdvancedSearchDialog = true"
              class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-all duration-200 flex items-center flex-shrink-0"
            >
              <Search class="mr-1.5 h-3.5 w-3.5" />
              Advanced Search
            </button>

            <div class="w-full max-w-xs sm:max-w-md">
              <div class="relative">
                <Search
                  class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-grey-400"
                />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search..."
                  class="w-full pl-8 pr-3 py-2 text-sm border border-grey-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  @input="handleSearch"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Main Kanban content area – uses remaining space -->
        <div class="flex-1 flex flex-col px-2 sm:px-4 lg:px-6 py-1 md:py-2">
          <!-- Team members -->
          <div v-if="!showSearchResults" class="mb-2 md:mb-3 flex justify-center">
            <div class="flex justify-center w-full">
              <StaffPanel
                :active-filters="activeStaffFilters"
                @staff-filter-changed="handleStaffFilterChanged"
                @staff-panel-ready="handleStaffPanelReady"
              />
            </div>
          </div>

          <!-- Search results grid -->
          <div v-if="showSearchResults" class="mb-2 md:mb-3">
            <div class="flex items-centre justify-between mb-4">
              <h2 class="text-lg font-semibold text-grey-900">
                Search Results ({{ filteredJobs.length }} jobs found)
              </h2>
              <button
                @click="backToKanban"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colours flex items-centre text-sm"
              >
                <LayoutGrid class="mr-2 h-4 w-4" />
                Back to Kanban
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <JobCard v-for="job in filteredJobs" :key="job.id" :job="job" @click="viewJob(job)" />
            </div>
          </div>

          <!-- Kanban board – grows to fill available space -->
          <div v-if="!showSearchResults" class="flex-1 flex flex-col space-y-1 md:space-y-2">
            <!-- Mobile: Dropdown to select status -->
            <div class="block md:hidden">
              <select
                v-model="selectedMobileStatus"
                class="w-full p-3 text-base border border-grey-300 rounded-lg bg-white text-grey-900 font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option
                  v-for="status in visibleStatusChoices"
                  :key="status.key"
                  :value="status.key"
                >
                  {{ status.label }} ({{ getJobsByStatus(status.key).length }})
                </option>
              </select>
            </div>

            <!-- Mobile: Single column view -->
            <div class="block md:hidden">
              <div class="flex justify-centre px-4">
                <KanbanColumn
                  v-if="
                    selectedMobileStatus &&
                    visibleStatusChoices.find((s) => s.key === selectedMobileStatus)
                  "
                  :key="selectedMobileStatus"
                  :status="visibleStatusChoices.find((s) => s.key === selectedMobileStatus)!"
                  :jobs="getSortedJobsByStatus(selectedMobileStatus)"
                  :is-loading="isLoading"
                  :is-dragging="isDragging"
                  @job-click="viewJob"
                  @load-more="loadMoreJobs(selectedMobileStatus)"
                  @sortable-ready="handleSortableReady"
                  @job-ready="handleJobReady"
                  class="kanban-column w-full max-w-md mx-auto"
                />
              </div>
            </div>

            <!-- Desktop: kanban – grows to fill space -->
            <div class="hidden md:flex md:flex-1 md:flex-col">
              <!-- Tablet: Responsive grid layout for optimal viewing -->
              <div class="block lg:hidden">
                <div class="w-full mx-auto px-2">
                  <!-- Dynamic grid based on number of columns -->
                  <div
                    class="grid gap-3"
                    :class="{
                      'grid-cols-1': visibleStatusChoices.length <= 2,
                      'grid-cols-2':
                        visibleStatusChoices.length <= 4 && visibleStatusChoices.length > 2,
                      'grid-cols-3':
                        visibleStatusChoices.length <= 6 && visibleStatusChoices.length > 4,
                      'grid-cols-4': visibleStatusChoices.length > 6,
                    }"
                  >
                    <KanbanColumn
                      v-for="status in visibleStatusChoices"
                      :key="status.key"
                      :status="status"
                      :jobs="getSortedJobsByStatus(status.key)"
                      :is-loading="isLoading"
                      :is-dragging="isDragging"
                      @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)"
                      @sortable-ready="handleSortableReady"
                      @job-ready="handleJobReady"
                      class="kanban-column-responsive"
                    />
                  </div>
                </div>
              </div>

              <!-- Large Desktop: Responsive grid that shows all columns -->
              <div class="hidden lg:block">
                <div class="w-full mx-auto px-2">
                  <div
                    class="grid gap-2 xl:gap-3"
                    :style="`grid-template-columns: repeat(${visibleStatusChoices.length}, minmax(0, 1fr))`"
                  >
                    <KanbanColumn
                      v-for="status in visibleStatusChoices"
                      :key="status.key"
                      :status="status"
                      :jobs="getSortedJobsByStatus(status.key)"
                      :is-loading="isLoading"
                      :is-dragging="isDragging"
                      @job-click="viewJob"
                      @load-more="loadMoreJobs(status.key)"
                      @sortable-ready="handleSortableReady"
                      @job-ready="handleJobReady"
                      class="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

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
import { ref, onUnmounted, onMounted, nextTick } from 'vue'
import { Search, LayoutGrid } from 'lucide-vue-next'
import JobCard from '@/components/JobCard.vue'
import KanbanColumn from '@/components/KanbanColumn.vue'
import AppLayout from '@/components/AppLayout.vue'
import StaffPanel from '@/components/StaffPanel.vue'
import AdvancedSearchDialog from '@/components/AdvancedSearchDialog.vue'
import { useKanban } from '@/composables/useKanban'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useStaffDragAndDrop } from '@/composables/useStaffDragAndDrop'
import { useJobsStore } from '@/stores/jobs'
import { KanbanCategorizationService } from '@/services/kanban-categorization.service'
import type { AdvancedFilters } from '@/types'

// Initialise store
const jobsStore = useJobsStore()

// Set kanban context when component mounts
onMounted(() => {
  jobsStore.setCurrentContext('kanban')
})

// Clear context when component unmounts
onUnmounted(() => {
  if (jobsStore.currentContext === 'kanban') {
    jobsStore.setCurrentContext(null)
  }
})

// Staff filters state
const {
  // State
  jobs,
  archivedJobs,
  filteredJobs,
  isLoading,
  searchQuery,
  showSearchResults,
  advancedFilters,
  activeStaffFilters,
  selectedMobileStatus,

  // Constants
  visibleStatusChoices,

  // Computed
  getJobsByStatus,
  jobsSortedByPriority, // ADDED

  // Methods
  loadJobs,
  handleSearch,
  handleAdvancedSearch,
  clearFilters,
  backToKanban,
  loadMoreJobs,
  viewJob,
  updateJobStatus,
  reorderJob,
  handleStaffFilterChanged,
} = useKanban(() => {
  // Callback called after jobs are loaded – initialise sortable for all ready columns
  nextTick(() => {
    initialiseSortableForAllColumns()
  })
})

// Local state for dialog
const showAdvancedSearchDialog = ref(false)

// Handle advanced search from dialog following clean code principles
const handleAdvancedSearchFromDialog = async (filters: AdvancedFilters) => {
  try {
    Object.assign(advancedFilters.value, filters)
    await handleAdvancedSearch()
  } catch (error) {
    console.error('Error performing advanced search from dialog:', error)
  }
}

// Drag and drop for jobs (with callback to update state)
const { isDragging, initializeSortable, destroyAllSortables } = useDragAndDrop((event, payload) => {
  if (event === 'job-moved') {
    const { jobId, fromStatus, toStatus, beforeId, afterId } = payload
    if (fromStatus !== toStatus) {
      // Map column to appropriate status using categorisation service
      const actualStatus = KanbanCategorizationService.getDefaultStatusForColumn(toStatus)
      updateJobStatus(jobId, actualStatus)
    } else {
      // Reorder within same status
      reorderJob(jobId, beforeId, afterId, toStatus)
    }
  }
})

// Staff drag and drop composable
interface StaffAssignmentPayload {
  staffId: string
  jobId: string
}

const { initializeStaffPool, initializeJobStaffContainer, updateJobStaffContainers } =
  useStaffDragAndDrop(async (event: string, payload?: StaffAssignmentPayload) => {
    if (event === 'staff-assigned') {
      if (payload) {
        console.log(`Staff ${payload.staffId} assigned to job ${payload.jobId}`)
      }
    } else if (event === 'staff-removed') {
      if (payload) {
        console.log(`Staff ${payload.staffId} removed from job ${payload.jobId}`)
      }
    } else if (event === 'jobs-reload-needed') {
      await loadJobs()
      // Update staff containers after jobs are reloaded
      const allJobs = [...jobs.value, ...archivedJobs.value]
      updateJobStaffContainers(allJobs)
    }
  })

// Sortable instances tracking to prevent multiple initialisations
const sortableInitialized = ref<Set<string>>(new Set())
const columnsReadyForSortable = ref<Map<string, HTMLElement>>(new Map())

const handleSortableReady = (element: HTMLElement, status: string) => {
  // Store the column element for later initialisation
  columnsReadyForSortable.value.set(status, element)

  // Only initialise if jobs are already loaded and we haven't initialised this column yet
  if (jobs.value.length > 0 && !sortableInitialized.value.has(status)) {
    initializeSortableForColumn(status, element)
  }
}

const initializeSortableForColumn = (status: string, element: HTMLElement) => {
  if (sortableInitialized.value.has(status)) {
    return
  }

  nextTick(() => {
    const jobCards = element.querySelectorAll('.job-card-simple')
    console.log(`🔧 Initialising SortableJS for status ${status}:`, {
      jobCards: jobCards.length,
    })

    initializeSortable(element, status)
    sortableInitialized.value.add(status)
  })
}

// Initialise sortable for all ready columns when jobs are loaded
const initialiseSortableForAllColumns = () => {
  columnsReadyForSortable.value.forEach((element, status) => {
    if (!sortableInitialized.value.has(status)) {
      initializeSortableForColumn(status, element)
    }
  })
}

const handleStaffPanelReady = (staffPanelElement: HTMLElement) => {
  console.log('🧑‍💼 Staff panel ready, initialising staff pool')
  initializeStaffPool(staffPanelElement)
}

const handleJobReady = (payload: { jobId: string; element: HTMLElement }) => {
  initializeJobStaffContainer(payload.element, payload.jobId)
}

// Utility function to filter jobs ordered by priority by status (NZ English comment)
function getSortedJobsByStatus(statusKey: string) {
  // Use kanban categorisation logic, but keep priority order
  return KanbanCategorizationService.getJobsForColumn(jobsSortedByPriority.value, statusKey)
}

// Setup drag and drop functionality
onMounted(async () => {})

// Cleanup on unmount
onUnmounted(() => {
  destroyAllSortables()
  sortableInitialized.value.clear()
  columnsReadyForSortable.value.clear()
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

/* Override default column sizing for tablet layout – maintain normal heights */
@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-column :deep(.kanban-column) {
    min-width: 160px;
    max-width: 200px;
    width: 100%;
    height: fit-content;
  }
}

/* Staff drag and drop styling and cleanup */
[data-is-clone='true'] {
  pointer-events: none !important;
  z-index: 9999;
}

/* Ensure ghost elements are hidden */
.sortable-ghost,
.staff-sortable-ghost {
  opacity: 0.3 !important;
  pointer-events: none !important;
}

/* Hide any leftover clones immediately */
.staff-list [data-is-clone='true'],
.sortable-chosen[data-is-clone='true'] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

/* Force hardware acceleration for smoother drag operations */
.is-staff-dragging * {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

/* Clean up any orphaned elements */
[style*='position: absolute'][style*='left: -9999px'] {
  display: none !important;
}
</style>
