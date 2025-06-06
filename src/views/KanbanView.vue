<template>
  <AppLayout>
    <div class="kanban-container p-4 bg-background">
      <!-- Loading State -->
      <div v-if="isLoading && jobs.length === 0" class="flex items-center justify-center h-64">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p class="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="mb-4">
        <div class="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div class="flex items-center gap-2">
            <AlertCircle class="h-4 w-4 text-destructive" />
            <span class="text-destructive font-medium">Error</span>
          </div>
          <p class="text-destructive/80 mt-1">{{ error }}</p>
          <Button
            variant="outline"
            size="sm"
            class="mt-2"
            @click="loadJobs"
          >
            <RefreshCw class="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>

      <!-- Search Container -->
      <div class="search-container mb-6">
        <div class="search-controls-wrapper">
          <div class="search-block-aligner">
            <div class="search-staff-container">
              <div class="search-wrapper flex gap-2 mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  @click="toggleAdvancedSearch"
                  class="hover:bg-accent"
                >
                  <Search class="mr-2 h-4 w-4" />
                  Advanced Search
                </Button>
                <Input
                  v-model="searchQuery"
                  placeholder="🔍 Search jobs (name, description, client, contact, job number)..."
                  class="flex-1"
                  @input="handleSearch"
                />
                <Button
                  v-if="searchQuery"
                  variant="ghost"
                  size="sm"
                  @click="clearSearch"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Advanced Search Form -->
        <Card v-if="showAdvancedSearch" class="mt-4">
          <CardHeader>
            <CardTitle class="flex items-center justify-between">
              <span>Advanced Search</span>
              <Button
                variant="ghost"
                size="sm"
                @click="showAdvancedSearch = false"
              >
                <X class="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form @submit.prevent="handleAdvancedSearch" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label for="jobNumber" class="block text-sm font-medium mb-1">Job Number</label>
                <Input id="jobNumber" v-model="advancedFilters.job_number" />
              </div>
              <div>
                <label for="jobName" class="block text-sm font-medium mb-1">Job Name</label>
                <Input id="jobName" v-model="advancedFilters.name" />
              </div>
              <div>
                <label for="description" class="block text-sm font-medium mb-1">Description</label>
                <Input id="description" v-model="advancedFilters.description" />
              </div>
              <div>
                <label for="client" class="block text-sm font-medium mb-1">Client</label>
                <Input id="client" v-model="advancedFilters.client_name" />
              </div>
              <div>
                <label for="contactPerson" class="block text-sm font-medium mb-1">Contact Person</label>
                <Input id="contactPerson" v-model="advancedFilters.contact_person" />
              </div>
              <div>
                <label for="createdBy" class="block text-sm font-medium mb-1">Created By</label>
                <Input id="createdBy" v-model="advancedFilters.created_by" />
              </div>
              <div>
                <label for="status" class="block text-sm font-medium mb-1">Status</label>
                <select v-model="advancedFilters.status" multiple class="w-full p-2 border rounded-md">
                  <option v-for="status in statusChoices" :key="status.key" :value="status.key">
                    {{ status.label }}
                  </option>
                </select>
              </div>
              <div>
                <label for="paid" class="block text-sm font-medium mb-1">Payment Status</label>
                <select v-model="advancedFilters.paid" class="w-full p-2 border rounded-md">
                  <option value="">Any</option>
                  <option value="true">Paid</option>
                  <option value="false">Unpaid</option>
                </select>
              </div>
              <div class="md:col-span-2 lg:col-span-3 flex gap-2 mt-4">
                <Button type="submit" :disabled="isLoading">
                  <Search class="mr-2 h-4 w-4" />
                  <span v-if="isLoading">Searching...</span>
                  <span v-else>Search</span>
                </Button>
                <Button type="button" variant="outline" @click="clearFilters">
                  <X class="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <!-- Search Results -->
      <div v-if="showSearchResults" class="search-results-container mb-6">
        <div class="search-results-header flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">
            Search Results
            <Badge variant="secondary" class="ml-2">{{ filteredJobs.length }} jobs</Badge>
          </h3>
          <Button variant="outline" size="sm" @click="backToKanban">
            <LayoutGrid class="mr-2 h-4 w-4" />
            Back to Kanban
          </Button>
        </div>
        <div class="search-results-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <JobCard
            v-for="job in filteredJobs"
            :key="job.id"
            :job="job"
            @click="viewJob(job)"
          />
        </div>
      </div>

      <!-- Kanban Board -->
      <div v-if="!showSearchResults" class="kanban-container">
        <div class="kanban-board flex gap-4 mb-8 overflow-x-auto pb-4">
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
          />
        </div>

        <!-- Archive Section as Collapsible Column -->
        <div class="archive-section">
          <Card>
            <CardHeader @click="toggleArchive" class="cursor-pointer hover:bg-accent">
              <div class="flex justify-between items-center">
                <CardTitle class="flex items-center">
                  <Archive class="mr-2 h-5 w-5" />
                  Archived Jobs
                  <Badge variant="secondary" class="ml-2">
                    {{ getJobCountByStatus('archived') }}/{{ totalArchivedJobs }}
                  </Badge>
                </CardTitle>
                <ChevronDown
                  class="h-5 w-5 transition-transform duration-200"
                  :class="{ 'rotate-180': showArchived }"
                />
              </div>
            </CardHeader>

            <CardContent v-if="showArchived" class="pt-0">
              <!-- Use KanbanColumn for archived jobs to enable drag and drop -->
              <KanbanColumn
                :status="{ key: 'archived', label: 'Archived Jobs', tooltip: 'Archived jobs' }"
                :jobs="getJobsByStatus('archived')"
                :show-load-more="shouldShowLoadMore('archived')"
                :is-loading="isLoading"
                :is-dragging="isDragging"
                :is-archive="true"
                @job-click="viewJob"
                @load-more="loadMoreJobs('archived')"
                @sortable-ready="handleSortableReady"
                class="archive-kanban-column"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import { useKanban } from '@/composables/useKanban'
import { useDragAndDrop } from '@/composables/useDragAndDrop'

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
  reorderJob
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

const handleSortableReady = (element: HTMLElement, status: string) => {
  const allJobs = [...jobs.value, ...archivedJobs.value]
  initializeSortable(element, status, allJobs)
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
.kanban-board {
  min-height: 600px;
}

.search-results-grid {
  max-height: 600px;
  overflow-y: auto;
}

.archive-grid {
  max-height: 400px;
  overflow-y: auto;
}

/* Scrollbar styling */
.kanban-board::-webkit-scrollbar {
  height: 8px;
}

.kanban-board::-webkit-scrollbar-track {
  background: hsl(var(--background));
}

.kanban-board::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 4px;
}

.kanban-board::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--border)) / 0.8;
}
</style>
