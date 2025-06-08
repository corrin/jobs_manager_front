<template>
  <AppLayout>
    <div class="flex flex-col h-screen">
      <!-- Fixed Header Section -->
      <div class="flex-shrink-0 p-3 sm:p-4 lg:p-6 pt-4 sm:pt-6">
        <!-- Search Section -->
        <div class="mb-4 space-y-3">
          <div class="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <button
              @click="toggleAdvancedSearch"
              class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md transition-all duration-200 flex items-center"
            >
              <Search class="mr-1.5 h-3.5 w-3.5" />
              Advanced
              <ChevronDown :class="['ml-1.5 h-3.5 w-3.5 transition-transform', showAdvancedSearch ? 'rotate-180' : '']" />
            </button>

            <div class="w-full max-w-xs sm:max-w-md">
              <div class="relative">
                <Search class="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Search..."
                  class="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  @input="handleSearch"
                />
              </div>
            </div>
          </div>

          <!-- Advanced Search Panel -->
          <div v-if="showAdvancedSearch" class="bg-white p-4 sm:p-6 rounded-lg shadow-lg border border-gray-200 transition-all duration-300">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Job Number</label>
                <input v-model="advancedFilters.job_number" type="text" class="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Job Name</label>
                <input v-model="advancedFilters.name" type="text" class="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <ClientDropdown
                  id="client"
                  label="Client"
                  v-model="advancedFilters.client_name"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select v-model="advancedFilters.status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option value="">All Status</option>
                  <option v-for="status in statusChoices" :key="status.key" :value="status.key">{{ status.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input v-model="advancedFilters.description" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input v-model="advancedFilters.contact_person" type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
              </div>
              <div>
                <StaffDropdown
                  id="createdBy"
                  label="Created By"
                  v-model="advancedFilters.created_by"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select v-model="advancedFilters.paid" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                  <option value="">Any</option>
                  <option value="true">Paid</option>
                  <option value="false">Unpaid</option>
                </select>
              </div>
            </div>
            <div class="flex space-x-3">
              <button @click="handleAdvancedSearch" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-md transition-colors">
                Search
              </button>
              <button @click="clearFilters" class="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md transition-colors">
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Team Members -->
        <div v-if="!showSearchResults" class="mb-4">
          <div class="flex justify-center px-2 sm:px-0">
            <StaffPanel
              :active-filters="activeStaffFilters"
              @staff-filter-changed="handleStaffFilterChanged"
              @staff-panel-ready="handleStaffPanelReady"
            />
          </div>
        </div>
      </div>

      <!-- Main Kanban Content Area -->
      <div class="flex-1 overflow-hidden p-3 sm:p-4 lg:p-6">
        <!-- Search Results Grid -->
        <div v-if="showSearchResults" class="mb-3">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Search Results ({{ filteredJobs.length }} jobs found)</h2>
            <button @click="backToKanban" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors flex items-center text-sm">
              <LayoutGrid class="mr-2 h-4 w-4" />
              Back to Kanban
            </button>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <JobCard
              v-for="job in filteredJobs"
              :key="job.id"
              :job="job"
              @click="viewJob(job)"
            />
          </div>
        </div>

        <!-- Kanban Board -->
        <div v-if="!showSearchResults" class="space-y-4 h-full">
          <!-- Mobile: Dropdown to select status -->
          <div class="block md:hidden">
            <select v-model="selectedMobileStatus" class="w-full p-3 text-base border border-gray-300 rounded-lg bg-white text-gray-900 font-medium shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option v-for="status in visibleStatusChoices" :key="status.key" :value="status.key">
                {{ status.label }} ({{ getJobsByStatus(status.key).length }})
              </option>
            </select>
          </div>

          <!-- Mobile: Single column view -->
          <div class="block md:hidden">
            <div class="flex justify-center">
              <KanbanColumn
                v-if="selectedMobileStatus && visibleStatusChoices.find(s => s.key === selectedMobileStatus)"
                :key="selectedMobileStatus"
                :status="visibleStatusChoices.find(s => s.key === selectedMobileStatus)!"
                :jobs="getJobsByStatus(selectedMobileStatus)"
                :show-load-more="shouldShowLoadMore(selectedMobileStatus)"
                :is-loading="isLoading"
                :is-dragging="isDragging"
                @job-click="viewJob"
                @load-more="loadMoreJobs(selectedMobileStatus)"
                @sortable-ready="handleSortableReady"
                @job-ready="handleJobReady"
                class="w-full max-w-sm mx-auto"
              />
            </div>
          </div>

          <!-- Desktop: Horizontal scrollable kanban -->
          <div class="hidden md:block h-full">
            <!-- Tablet: centered grid layout -->
            <div class="block lg:hidden h-full">
              <div class="max-w-6xl mx-auto px-2">
                <div class="grid grid-cols-2 gap-2 h-full overflow-y-auto">
                  <KanbanColumn
                    v-for="status in visibleStatusChoices"
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
                    class="w-full"
                  />
                </div>
              </div>
            </div>
            
            <!-- Large Desktop: Horizontal scrollable kanban -->
            <div class="hidden lg:block h-full">
              <div class="overflow-x-auto pb-4 h-full">
                <div class="flex gap-1 xl:gap-2 min-w-max h-full">
                  <KanbanColumn
                    v-for="status in visibleStatusChoices"
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
                    class="flex-shrink-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Fixed Archived Section at bottom -->
      <div v-if="!showSearchResults" class="flex-shrink-0 bg-white border-t-2 border-gray-300 shadow-lg">
        <button
          @click="toggleArchive"
          class="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div class="flex items-center">
            <Archive class="mr-3 h-5 w-5 text-gray-600" />
            <span class="font-bold text-gray-900 text-base">Archived Jobs</span>
            <span class="ml-3 px-2 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded-full">
              {{ getJobCountByStatus('archived') }}
            </span>
          </div>
          <ChevronDown
            class="h-5 w-5 text-gray-600 transition-transform duration-200"
            :class="{ 'rotate-180': showArchived }"
          />
        </button>

        <div v-if="showArchived" class="border-t border-gray-200 p-4 sm:p-6 h-64 overflow-y-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            <div
              v-for="job in getJobsByStatus('archived')"
              :key="job.id"
              class="bg-gray-100 p-3 sm:p-4 rounded-lg border border-gray-300 shadow-sm cursor-pointer hover:bg-gray-50 hover:shadow-md transition-all duration-200"
              @click="viewJob(job)"
            >
              <div class="flex justify-between items-start mb-2">
                <span class="text-sm font-bold text-gray-600">#{{ job.job_number }}</span>
                <span class="px-2 py-1 rounded-full text-xs font-semibold bg-orange-200 text-orange-800">Archived</span>
              </div>
              <h4 class="font-semibold text-gray-800 text-sm mb-2 line-clamp-2 leading-tight">{{ job.name }}</h4>
              <p class="text-sm text-gray-600 mb-2 line-clamp-2 leading-tight">{{ job.description }}</p>
              <div class="text-sm text-gray-500 space-y-1">
                <p class="truncate font-medium">{{ job.client_name }}</p>
                <p v-if="job.contact_person" class="truncate">{{ job.contact_person }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
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
} = useKanban()

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

// Cleanup on unmount
onUnmounted(() => {
  destroyAllSortables()
})
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
