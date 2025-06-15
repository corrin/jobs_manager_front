<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && $emit('close')">
    <DialogContent class="sm:max-w-6xl">
      <DialogHeader>
        <DialogTitle>Select Job for Timesheet</DialogTitle>
        <DialogDescription>
          Search and select a job to add to the timesheet
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Search Input -->
        <div class="flex gap-2">
          <div class="flex-1">
            <input 
              v-model="searchQuery" 
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Search jobs by name, number, or client..." 
              @input="handleSearch"
            />
          </div>
          <Button @click="showAdvancedFilters = !showAdvancedFilters" variant="outline">
            <Search class="h-4 w-4 mr-2" />
            Advanced
          </Button>
        </div>

        <!-- Advanced Filters (collapsible) -->
        <div v-if="showAdvancedFilters" class="border rounded-lg p-4 bg-gray-50">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Job Number</label>
              <input 
                v-model="filters.job_number" 
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter job number" 
                @input="handleAdvancedSearch"
              />
            </div>

            <div class="flex items-end">
              <Button @click="clearFilters" variant="outline" class="w-full">
                Clear Filters
              </Button>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span class="ml-2 text-gray-600">Searching jobs...</span>
        </div>

        <!-- Results Grid -->
        <div v-else-if="filteredJobs.length > 0" class="max-h-96 overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="job in paginatedJobs"
              :key="job.id"
              class="job-card border rounded-lg p-3 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
              :class="{ 'bg-blue-100 border-blue-500': selectedJob?.id === job.id }"
              @click="selectJob(job)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-sm">{{ job.jobNumber }}</span>
                    <Badge variant="outline" class="text-xs">
                      Job
                    </Badge>
                  </div>
                  <h3 class="font-medium text-gray-900 mb-1 text-sm line-clamp-1">
                    {{ job.name || job.jobName }}
                  </h3>
                  <div class="text-xs text-gray-500 space-y-1">
                    <div>Rate: ${{ job.chargeOutRate || 0 }}/hr</div>
                    <div v-if="job.estimatedHours">Est. Hours: {{ job.estimatedHours }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-4">
            <Button 
              @click="currentPage--" 
              :disabled="currentPage === 1" 
              variant="outline" 
              size="sm"
            >
              Previous
            </Button>
            <span class="text-sm text-gray-600">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <Button 
              @click="currentPage++" 
              :disabled="currentPage === totalPages" 
              variant="outline" 
              size="sm"
            >
              Next
            </Button>
          </div>
        </div>        <!-- No Results -->
        <div v-else-if="(searchQuery || hasActiveFilters) && filteredJobs.length === 0" class="text-center py-8 text-gray-500">
          <Search class="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No jobs found matching your criteria</p>
        </div>

        <!-- Initial State - Show all jobs -->
        <div v-else-if="!searchQuery && !hasActiveFilters && allJobs.length === 0" class="text-center py-8 text-gray-500">
          <Search class="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No active jobs available for timesheet entries.</p>
        </div>
      </div>

      <DialogFooter>
        <Button @click="$emit('close')" variant="outline">
          Cancel
        </Button>
        <Button @click="confirmSelection" :disabled="!selectedJob">
          Select Job
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Search } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useJobsStore } from '@/stores/jobs'
import { useTimesheetStore } from '@/stores/timesheet'
import { useKanban } from '@/composables/useKanban'
import { getStatusVariant } from '@/utils/statusUtils'
import type { Job } from '@/types/timesheet'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'job-selected', job: Job): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const jobsStore = useJobsStore()
const timesheetStore = useTimesheetStore()
const { loadJobs } = useKanban()

// State
const searchQuery = ref('')
const showAdvancedFilters = ref(false)
const selectedJob = ref<Job | null>(null)
const isLoading = ref(false)
const currentPage = ref(1)
const itemsPerPage = 12

const filters = ref({
  job_number: ''
})

// Get jobs from timesheet store - show actual Jobs with Reality pricing only
const allJobs = computed(() => {
  // Filter jobs to exclude rejected, archived, and special status
  // And ensure we only show Reality pricing entries (one per job)
  const validStatusJobs = timesheetStore.jobs.filter(job => {
    const status = job.status?.toLowerCase()
    return status !== 'rejected' && status !== 'archived' && status !== 'special'
  })

  // Group by jobId to show only one entry per actual Job (Reality pricing)
  const jobMap = new Map()
  
  validStatusJobs.forEach(jobPricing => {
    const jobId = jobPricing.jobId || jobPricing.id
    
    // Only add if this is a Reality pricing or if we don't have this job yet
    if (!jobMap.has(jobId) || (jobPricing as any).pricingType === 'reality') {
      jobMap.set(jobId, {
        id: jobPricing.id, // Keep the JobPricing ID for functionality  
        jobId: jobId, // The actual Job ID
        jobNumber: jobPricing.jobNumber,
        name: jobPricing.jobName, // Show job name from Reality pricing
        jobName: jobPricing.jobName,
        displayName: `${jobPricing.jobNumber} - ${jobPricing.jobName}`,
        status: jobPricing.status,
        chargeOutRate: jobPricing.chargeOutRate,
        estimatedHours: jobPricing.estimatedHours,
        clientName: jobPricing.clientName,
        isShopJob: jobPricing.isShopJob || false,
        // Ensure this is marked as undefined to show as "Job" not task name
        taskName: undefined
      })
    }
  })

  return Array.from(jobMap.values())
})

// Filtering logic
const filteredJobs = computed(() => {
  let jobs = allJobs.value

  // Show all jobs initially if no search or filters
  if (!searchQuery.value.trim() && !hasActiveFilters.value) {
    return jobs
  }

  // Text search
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    jobs = jobs.filter(job => 
      job.name?.toLowerCase().includes(query) ||
      job.jobNumber?.toLowerCase().includes(query) ||
      job.displayName?.toLowerCase().includes(query)
    )
  }

  // Advanced filters
  if (filters.value.job_number) {
    jobs = jobs.filter(job => 
      job.jobNumber?.toLowerCase().includes(filters.value.job_number.toLowerCase())
    )
  }

  return jobs
})

const paginatedJobs = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredJobs.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredJobs.value.length / itemsPerPage))

const hasActiveFilters = computed(() => 
  filters.value.job_number
)

// Methods
const handleSearch = () => {
  currentPage.value = 1
  selectedJob.value = null
}

const handleAdvancedSearch = () => {
  currentPage.value = 1
  selectedJob.value = null
}

const clearFilters = () => {
  filters.value = {
    job_number: ''
  }
  searchQuery.value = ''
  currentPage.value = 1
  selectedJob.value = null
}

const selectJob = (job: Job) => {
  selectedJob.value = job
}

const confirmSelection = () => {
  if (selectedJob.value) {
    emit('job-selected', selectedJob.value)
    selectedJob.value = null
  }
}

// Reset when modal closes
watch(() => props.isOpen, async (isOpen) => {
  if (isOpen) {
    // Load timesheet jobs (JobPricing IDs) if not available
    if (timesheetStore.jobs.length === 0) {
      await timesheetStore.loadJobs()
    }
  } else {
    clearFilters()
    selectedJob.value = null
  }
})
</script>

<style scoped>
.line-clamp-1 {
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  line-clamp: 1;
}

.job-card {
  transition: all 0.2s ease;
}

.job-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
