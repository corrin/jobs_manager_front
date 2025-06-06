<template>
  <AppLayout>
    <div class="kanban-container p-4 bg-background">
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
                placeholder="🔍 Search jobs (name, description, client, contact, creator)..."
                class="flex-1"
                @input="handleSearch"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Search Form -->
      <Card v-if="showAdvancedSearch" class="mt-4">
        <CardHeader>
          <CardTitle>Advanced Search</CardTitle>
        </CardHeader>
        <CardContent>
          <form @submit.prevent="handleAdvancedSearch" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label for="jobNumber" class="block text-sm font-medium mb-1">Job Number</label>
              <Input id="jobNumber" v-model="advancedFilters.jobNumber" />
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
              <select v-model="advancedFilters.client" class="w-full p-2 border rounded-md">
                <option value="">Any Client</option>
                <!-- TODO: Load clients from API -->
              </select>
            </div>
            <div>
              <label for="createdBy" class="block text-sm font-medium mb-1">Created By</label>
              <select v-model="advancedFilters.createdBy" class="w-full p-2 border rounded-md">
                <option value="">Any User</option>
                <!-- TODO: Load users from API -->
              </select>
            </div>
            <div>
              <label for="status" class="block text-sm font-medium mb-1">Status</label>
              <select v-model="advancedFilters.status" multiple class="w-full p-2 border rounded-md">
                <option v-for="status in statusChoices" :key="status.key" :value="status.key">
                  {{ status.label }}
                </option>
              </select>
            </div>
            <div class="md:col-span-2 lg:col-span-3 flex gap-2 mt-4">
              <Button type="submit">
                <Search class="mr-2 h-4 w-4" />
                Search
              </Button>
              <Button type="button" variant="outline" @click="clearFilters">
                <X class="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
              <Button type="button" variant="outline" @click="showAdvancedSearch = false">
                <ChevronUp class="mr-2 h-4 w-4" />
                Close Advanced Search
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
          Search Results <small class="text-muted-foreground">({{ filteredJobs.length }} jobs)</small>
        </h3>
        <Button variant="outline" size="sm" @click="backToKanban">
          <LayoutGrid class="mr-2 h-4 w-4" />
          Back to Kanban
        </Button>
      </div>
      <div class="search-results-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      <div class="kanban-board grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
        <div
          v-for="status in visibleStatusChoices"
          :key="status.key"
          class="kanban-column"
        >
          <div class="column-header bg-card p-3 rounded-t-lg border-b">
            <h3 class="font-semibold text-sm">
              {{ status.label }}
              <Badge variant="secondary" class="ml-2">
                {{ getJobCountByStatus(status.key) }}
              </Badge>
            </h3>
          </div>
          <div class="job-list bg-card rounded-b-lg border border-t-0 min-h-[400px] p-2">
            <JobCard
              v-for="job in getJobsByStatus(status.key)"
              :key="job.id"
              :job="job"
              class="mb-2"
              @click="viewJob(job)"
            />

            <!-- Load More Button -->
            <div v-if="shouldShowLoadMore(status.key)" class="load-more-container mt-2">
              <Button
                variant="outline"
                size="sm"
                class="w-full"
                @click="loadMoreJobs(status.key)"
              >
                <ChevronDown class="mr-2 h-4 w-4" />
                More
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Archive Section -->
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
            <div class="archive-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <JobCard
                v-for="job in getJobsByStatus('archived')"
                :key="job.id"
                :job="job"
                @click="viewJob(job)"
              />

              <!-- Load More Archived -->
              <div v-if="shouldShowLoadMore('archived')" class="col-span-full">
                <Button
                  variant="outline"
                  size="sm"
                  class="w-full"
                  @click="loadMoreJobs('archived')"
                >
                  <ChevronDown class="mr-2 h-4 w-4" />
                  More
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  Archive
} from 'lucide-vue-next'
import JobCard from '@/components/JobCard.vue'
import AppLayout from '@/components/AppLayout.vue'
import { useKanban } from '@/composables/useKanban'

const {
  // State
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
  handleSearch,
  handleAdvancedSearch,
  clearFilters,
  toggleAdvancedSearch,
  backToKanban,
  toggleArchive,
  shouldShowLoadMore,
  loadMoreJobs,
  viewJob
} = useKanban()
</script>

<style scoped>
.kanban-column {
  min-width: 250px;
}

.search-results-grid {
  max-height: 600px;
  overflow-y: auto;
}

.job-list {
  max-height: 500px;
  overflow-y: auto;
}
</style>
