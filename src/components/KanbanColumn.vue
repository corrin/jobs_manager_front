<template>
  <div class="w-full flex-shrink-0" :class="{ 'w-full': isArchive }">
    <div v-if="!isArchive" class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="p-3 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 text-sm">
            {{ status.label }} ({{ jobs.length }})
          </h3>
          <div
            v-if="status.tooltip"
            class="group relative"
            :title="status.tooltip"
          >
            <svg class="w-4 h-4 text-gray-400 hover:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path>
            </svg>
          </div>
        </div>
      </div>

      <div ref="jobListRef" :data-status="status.key"
        class="p-3 grid grid-cols-2 gap-2 overflow-y-auto transition-colors duration-200"
        style="height: calc(90vh - 12.5rem); touch-action: pan-y; -webkit-overflow-scrolling: touch;"
        :class="{
          'bg-blue-50 border-blue-200': isDragging
        }"
      >
        <JobCard
          v-for="job in jobs"
          :key="job.id"
          :job="job"
          :is-dragging="isDragging"
          :is-movement-mode-active="isMovementModeActive"
          :is-job-selected-for-movement="isJobSelectedForMovement(job.id.toString())"
          @click="$emit('job-click', job)"
          @job-ready="$emit('job-ready', $event)"
          @job-selected-for-movement="$emit('job-selected-for-movement', $event)"
        />

        <!-- Empty state -->
        <div
          v-if="jobs.length === 0"
          class="col-span-2 empty-state flex items-center justify-center text-gray-500 h-32"
        >
          <div class="text-center">
            <div class="text-sm">No jobs in {{ status.label.toLowerCase() }}</div>
            <div class="text-xs mt-1">Drag jobs here to update status</div>
          </div>
        </div>

        <!-- Load more button -->
        <div v-if="showLoadMore && !isLoading" class="col-span-2 text-center">
          <button
            @click="$emit('load-more')"
            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
          >
            Load More
          </button>
        </div>

        <!-- Loading spinner -->
        <div v-if="isLoading" class="col-span-2 text-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>

    <!-- Archive layout -->
    <div v-else class="w-full">
      <div
        ref="jobListRef"
        :data-status="status.key"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <div
          v-for="job in jobs"
          :key="job.id"
          :data-id="job.id"
          class="job-item bg-gray-50 p-3 rounded-md border border-gray-200 opacity-75"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="text-xs font-medium text-gray-500">#{{ job.job_number }}</span>
            <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">Archived</span>
          </div>
          <h4 class="font-medium text-gray-700 text-sm mb-1">{{ job.name }}</h4>
          <p class="text-xs text-gray-500 mb-2">{{ job.description }}</p>
          <div class="text-xs text-gray-400">
            <p>{{ job.client_name }}</p>
            <p>{{ job.contact_person }}</p>
          </div>
        </div>

        <!-- Empty state for archive -->
        <div v-if="jobs.length === 0" class="col-span-full text-center py-8">
          <div class="text-xs text-gray-500">No archived jobs</div>
        </div>

        <!-- Load more button for archive -->
        <div v-if="showLoadMore && !isLoading" class="col-span-full text-center">
          <button @click="$emit('load-more')"
            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors">
            Load More Archived
          </button>
        </div>

        <!-- Loading spinner for archive -->
        <div v-if="isLoading" class="col-span-full text-center">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import JobCard from '@/components/JobCard.vue'
import type { Job, StatusChoice } from '@/types'

interface KanbanColumnProps {
  status: StatusChoice
  jobs: Job[]
  showLoadMore?: boolean
  isLoading?: boolean
  isDragging?: boolean
  isArchive?: boolean
  isMovementModeActive?: boolean
  isJobSelectedForMovement?: (jobId: string) => boolean
}

interface KanbanColumnEmits {
  (e: 'job-click', job: Job): void
  (e: 'load-more'): void
  (e: 'sortable-ready', element: HTMLElement, status: string): void
  (e: 'job-ready', payload: { jobId: string, element: HTMLElement }): void
  (e: 'job-selected-for-movement', job: Job): void
}

const props = withDefaults(defineProps<KanbanColumnProps>(), {
  showLoadMore: false,
  isLoading: false,
  isDragging: false,
  isArchive: false,
  isMovementModeActive: false,
  isJobSelectedForMovement: () => false
})

const emit = defineEmits<KanbanColumnEmits>()

const jobListRef = ref<HTMLElement>()
const isSortableInitialized = ref(false)

// Handler for archived job drop events
const handleArchivedJobDrop = (event: CustomEvent) => {
  console.log('KanbanColumn received archived job drop:', event.detail)
  // Re-emit to parent KanbanView
  const dropEvent = new CustomEvent('archived-job-drop', {
    detail: event.detail,
    bubbles: true
  })
  document.dispatchEvent(dropEvent)
}

onMounted(() => {
  if (jobListRef.value && !isSortableInitialized.value) {
    emit('sortable-ready', jobListRef.value, props.status.key)
    isSortableInitialized.value = true
  }

  // Add event listener for archived job drops on this column
  if (jobListRef.value) {
    jobListRef.value.addEventListener('archived-job-drop', handleArchivedJobDrop as EventListener)
  }
})

onUnmounted(() => {
  isSortableInitialized.value = false

  // Remove event listener
  if (jobListRef.value) {
    jobListRef.value.removeEventListener('archived-job-drop', handleArchivedJobDrop as EventListener)
  }
})

// Only re-initialize if jobs change significantly or sortable wasn't initialized
watch(
  () => props.jobs,
  () => {
    if (jobListRef.value && !isSortableInitialized.value) {
      emit('sortable-ready', jobListRef.value, props.status.key)
      isSortableInitialized.value = true
    }
  },
  { deep: true }
)
</script>
