<template>
  <AppLayout>
    <div class="flex flex-col min-h-screen mt-5 md:mt-15 lg:mt-0">
      <div class="flex-shrink-0 p-3 sm:p-4 lg:p-6 pt-2 sm:pt-3 md:pt-1 lg:pt-6">
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

        <div class="flex-1 flex flex-col px-2 sm:px-4 lg:px-6 py-1 md:py-2">
          <div v-if="!showSearchResults" class="mb-2 md:mb-3 flex justify-center">
            <div class="flex justify-center w-full">
              <StaffPanel
                :active-filters="activeStaffFilters"
                @staff-filter-changed="handleStaffFilterChanged"
              />
            </div>
          </div>

          <div v-if="showSearchResults" class="mb-2 md:mb-3">
            <div class="flex items-centre justify-between mb-4">
              <h2 class="text-lg font-semibold text-grey-900">
                <span v-if="!isLoading">Search Results ({{ filteredJobs.length }} jobs found)</span>
                <span v-else class="flex items-center">
                  <svg
                    class="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Searching...
                </span>
              </h2>
              <button
                @click="backToKanban"
                class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colours flex items-centre text-sm"
              >
                <LayoutGrid class="mr-2 h-4 w-4" />
                Back to Kanban
              </button>
            </div>

            <!-- Loading state for search results -->
            <div v-if="isLoading" class="flex justify-center items-center py-12">
              <div class="text-center">
                <svg
                  class="animate-spin mx-auto h-12 w-12 text-blue-500"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  ></circle>
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                <p class="mt-4 text-gray-600">Searching jobs...</p>
              </div>
            </div>

            <!-- Search results with vertical scrolling -->
            <div v-else class="relative">
              <!-- Scroll progress indicator -->
              <div
                class="sticky top-0 z-10 bg-white/90 backdrop-blur-sm border-b border-gray-200 mb-4"
              >
                <div class="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    class="h-full bg-blue-500 transition-all duration-300 ease-out"
                    :style="{ width: scrollProgress + '%' }"
                  ></div>
                </div>
                <div class="text-xs text-gray-500 text-center py-1">
                  Showing {{ Math.min(visibleJobsCount, filteredJobs.length) }} of
                  {{ filteredJobs.length }} jobs
                </div>
              </div>

              <!-- Vertical scrolling container -->
              <div
                ref="scrollContainer"
                class="max-h-[70vh] overflow-y-auto scroll-smooth"
                style="scrollbar-width: thin; scrollbar-color: #3b82f6 #e5e7eb"
                @scroll="handleScroll"
              >
                <div
                  class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-2"
                >
                  <div
                    v-for="(job, index) in filteredJobs"
                    :key="job.id"
                    class="transform transition-all duration-300 ease-out"
                    :class="{
                      'opacity-0 translate-y-4': !isJobVisible(index),
                      'opacity-100 translate-y-0': isJobVisible(index),
                    }"
                  >
                    <JobCard
                      :job="job"
                      @click="viewJob(job)"
                      class="h-full hover:shadow-lg transition-shadow duration-200"
                    />
                  </div>
                </div>

                <!-- Load more indicator -->
                <div v-if="hasMoreJobs" class="text-center py-4">
                  <div class="inline-flex items-center text-sm text-gray-500">
                    <svg
                      class="animate-spin -ml-1 mr-2 h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        class="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        stroke-width="4"
                      ></circle>
                      <path
                        class="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Loading more jobs...
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-if="!showSearchResults" class="flex-1 flex flex-col space-y-1 md:space-y-2">
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
                  @staff-assigned="handleStaffAssigned"
                  @staff-unassigned="handleStaffUnassigned"
                  class="kanban-column w-full max-w-md mx-auto"
                />
              </div>
            </div>

            <div class="hidden md:flex md:flex-1 md:flex-col">
              <div class="block lg:hidden">
                <div class="w-full mx-auto px-2">
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
                      @staff-assigned="handleStaffAssigned"
                      @staff-unassigned="handleStaffUnassigned"
                      class="kanban-column-responsive"
                    />
                  </div>
                </div>
              </div>

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
                      @staff-assigned="handleStaffAssigned"
                      @staff-unassigned="handleStaffUnassigned"
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
import { ref, onUnmounted, onMounted, nextTick, computed } from 'vue'
import { Search, LayoutGrid } from 'lucide-vue-next'
import JobCard from '@/components/JobCard.vue'
import KanbanColumn from '@/components/KanbanColumn.vue'
import AppLayout from '@/components/AppLayout.vue'
import StaffPanel from '@/components/StaffPanel.vue'
import AdvancedSearchDialog from '@/components/AdvancedSearchDialog.vue'
import { useKanban } from '@/composables/useKanban'
import { useDragAndDrop } from '@/composables/useDragAndDrop'
import { useJobsStore } from '@/stores/jobs'
import { KanbanCategorizationService } from '@/services/kanban-categorization.service'
import type { AdvancedFilters } from '@/constants/advanced-filters'

const jobsStore = useJobsStore()

onMounted(() => {
  jobsStore.setCurrentContext('kanban')
})

onUnmounted(() => {
  if (jobsStore.currentContext === 'kanban') {
    jobsStore.setCurrentContext(null)
  }
})

const {
  jobs,
  filteredJobs,
  isLoading,
  searchQuery,
  showSearchResults,
  advancedFilters,
  activeStaffFilters,
  selectedMobileStatus,

  visibleStatusChoices,

  getJobsByStatus,

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
  nextTick(() => {
    initialiseSortableForAllColumns()
  })
})

// Handler para atribuição de staff
const handleStaffAssigned = async (payload: { staffId: string; jobId: string }) => {
  try {
    // Recarregar os jobs para atualizar a reatividade
    await loadJobs()
    console.log(`✅ Staff ${payload.staffId} assigned to job ${payload.jobId}`)
  } catch (error) {
    console.error('Error handling staff assignment:', error)
  }
}

// Handler para desatribuição de staff
const handleStaffUnassigned = async (payload: { staffId: string; jobId: string }) => {
  try {
    // Recarregar os jobs para atualizar a reatividade
    await loadJobs()
    console.log(`✅ Staff ${payload.staffId} unassigned from job ${payload.jobId}`)
  } catch (error) {
    console.error('Error handling staff unassignment:', error)
  }
}

const showAdvancedSearchDialog = ref(false)

// Vertical scrolling variables
const scrollContainer = ref<HTMLElement | null>(null)
const scrollProgress = ref(0)
const visibleJobsCount = ref(20) // Initial visible jobs
const JOBS_PER_BATCH = 20

// Computed properties for scroll functionality
const hasMoreJobs = computed(() => visibleJobsCount.value < filteredJobs.value.length)

const isJobVisible = (index: number) => {
  return index < visibleJobsCount.value
}

// Scroll handling functions
const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight

  // Update scroll progress
  scrollProgress.value = (scrollTop / (scrollHeight - clientHeight)) * 100

  // Load more jobs when near bottom
  if (scrollTop + clientHeight >= scrollHeight - 100) {
    loadMoreVisibleJobs()
  }
}

const loadMoreVisibleJobs = () => {
  if (hasMoreJobs.value) {
    visibleJobsCount.value = Math.min(
      visibleJobsCount.value + JOBS_PER_BATCH,
      filteredJobs.value.length,
    )
  }
}

// Reset visible jobs when search results change
const resetVisibleJobs = () => {
  visibleJobsCount.value = Math.min(JOBS_PER_BATCH, filteredJobs.value.length)
  scrollProgress.value = 0
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0
  }
}

const handleAdvancedSearchFromDialog = async (filters: AdvancedFilters) => {
  try {
    Object.assign(advancedFilters.value, filters)
    await handleAdvancedSearch()
    resetVisibleJobs()
  } catch (error) {
    console.error('Error performing advanced search from dialog:', error)
  }
}

const { isDragging, initializeSortable, destroyAllSortables } = useDragAndDrop((event, payload) => {
  if (event === 'job-moved') {
    const { jobId, fromStatus, toStatus, beforeId, afterId } = payload
    if (fromStatus !== toStatus) {
      const actualStatus = KanbanCategorizationService.getDefaultStatusForColumn(toStatus)
      updateJobStatus(jobId, actualStatus)
    } else {
      reorderJob(jobId, beforeId, afterId, toStatus)
    }
  }
})

const sortableInitialized = ref<Set<string>>(new Set())
const columnsReadyForSortable = ref<Map<string, HTMLElement>>(new Map())

const handleSortableReady = (element: HTMLElement, status: string) => {
  columnsReadyForSortable.value.set(status, element)

  if (jobs.value.length > 0 && !sortableInitialized.value.has(status)) {
    initializeSortableForColumn(status, element)
  }
}

const initializeSortableForColumn = (status: string, element: HTMLElement) => {
  if (sortableInitialized.value.has(status)) {
    return
  }

  nextTick(() => {
    initializeSortable(element, status)
    sortableInitialized.value.add(status)
  })
}

const initialiseSortableForAllColumns = () => {
  columnsReadyForSortable.value.forEach((element, status) => {
    if (!sortableInitialized.value.has(status)) {
      initializeSortableForColumn(status, element)
    }
  })
}

function getSortedJobsByStatus(statusKey: string) {
  // Use the filtered getJobsByStatus from useKanban instead of directly calling KanbanCategorizationService
  return getJobsByStatus.value(statusKey)
}

onMounted(async () => {
  await loadJobs()
})

onUnmounted(() => {
  destroyAllSortables()
  sortableInitialized.value.clear()
  columnsReadyForSortable.value.clear()
})
</script>

<style scoped>
.mobile-column {
  min-width: 320px;
  max-width: 400px;
  width: 100%;
}

@media (max-width: 767px) {
  .mobile-column :deep(.kanban-column) {
    min-width: 320px;
    max-width: 400px;
    width: 100%;
  }

  .mobile-column :deep(.job-card) {
    min-width: 280px;
    width: 100%;
    padding: 16px;
  }

  .mobile-column :deep(.p-1) {
    padding: 12px;
  }

  .mobile-column :deep(.space-y-1 > * + *) {
    margin-top: 8px;
  }
}

.tablet-column {
  min-width: 200px;
  max-width: 280px;
  width: 100%;
}

@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-column {
    width: calc((100% - 0.75rem) / 4);
    min-width: 160px;
    max-width: 200px;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .tablet-column :deep(.kanban-column) {
    min-width: 160px;
    max-width: 200px;
    width: 100%;
    height: fit-content;
  }
}

[data-is-clone='true'] {
  pointer-events: none !important;
  z-index: 9999;
}

.sortable-ghost,
.staff-sortable-ghost {
  opacity: 0.3 !important;
  pointer-events: none !important;
}

.staff-sortable-chosen {
  opacity: 0.8 !important;
}

.staff-sortable-drag {
  opacity: 0.6 !important;
  transform: rotate(5deg);
}

.staff-list [data-is-clone='true'],
.sortable-chosen[data-is-clone='true'] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

.is-staff-dragging * {
  will-change: transform;
  transform: translate3d(0, 0, 0);
}

[style*='position: absolute'][style*='left: -9999px'] {
  display: none !important;
}

/* Staff drag visual feedback on job cards */
.job-card {
  transition: outline 0.2s ease;
}

.job-card:hover {
  cursor: default;
}

/* When staff is being dragged, job cards get visual feedback */
.sortable-fallback {
  display: none !important;
}

/* Drag handle styles */
.drag-handle {
  transition: all 0.2s ease;
  font-size: 8px;
  line-height: 1;
}

.drag-handle:hover {
  transform: scale(1.1);
  background-color: #2563eb !important;
}

/* Vertical scrolling styles */
.scroll-smooth {
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* iOS momentum scrolling */
}

/* Custom scrollbar styling */
.scroll-smooth::-webkit-scrollbar {
  width: 8px;
}

.scroll-smooth::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 4px;
}

.scroll-smooth::-webkit-scrollbar-thumb {
  background: #3b82f6;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.scroll-smooth::-webkit-scrollbar-thumb:hover {
  background: #2563eb;
}

/* Firefox scrollbar */
.scroll-smooth {
  scrollbar-width: thin;
  scrollbar-color: #3b82f6 #f1f5f9;
}

/* Touch-friendly scroll indicators */
@media (hover: none) and (pointer: coarse) {
  .scroll-smooth {
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }

  .scroll-smooth::-webkit-scrollbar {
    width: 12px;
  }
}

/* Smooth animations for job cards */
.job-card-enter-active,
.job-card-leave-active {
  transition: all 0.3s ease-out;
}

.job-card-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.job-card-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* Progress bar animation */
.progress-bar {
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Responsive grid adjustments */
@media (max-width: 640px) {
  .scroll-smooth {
    max-height: 60vh;
  }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .scroll-smooth {
    max-height: 65vh;
  }
}

@media (min-width: 1025px) {
  .scroll-smooth {
    max-height: 70vh;
  }
}
</style>
