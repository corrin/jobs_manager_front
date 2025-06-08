<template>
  <div class="kanban-column" :class="{ 'archive-column': isArchive }">
    <div v-if="!isArchive" class="bg-white rounded-lg shadow-sm border border-gray-200">
      <div class="p-2 border-b border-gray-200">
        <h3 class="font-semibold text-gray-900 text-xs">{{ status.label }}</h3>
        <span class="text-xs text-gray-500">{{ jobs.length }}</span>
      </div>

      <div ref="jobListRef" :data-status="status.key"
        class="p-1 space-y-1 min-h-[360px] max-h-[480px] overflow-y-auto transition-colors duration-200" :class="{
          'bg-blue-50 border-blue-200': isDragging
        }">
        <JobCard
          v-for="job in jobs"
          :key="job.id"
          :job="job"
          :is-dragging="isDragging"
          @click="$emit('job-click', job)"
          @job-ready="$emit('job-ready', $event)"
        />

        <!-- Empty state -->
        <div
          v-if="jobs.length === 0"
          class="empty-state flex items-center justify-center text-gray-500 h-32"
        >
          <div class="text-center">
            <div class="text-sm">No jobs in {{ status.label.toLowerCase() }}</div>
            <div class="text-xs mt-1">Drag jobs here to update status</div>
          </div>
        </div>

        <!-- Load more button -->
        <div v-if="showLoadMore && !isLoading" class="text-center">
          <button
            @click="$emit('load-more')"
            class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
          >
            Load More
          </button>
        </div>

        <!-- Loading spinner -->
        <div v-if="isLoading" class="text-center">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    </div>

    <!-- Archive layout -->
    <div v-else class="archive-column">
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
}

interface KanbanColumnEmits {
  (e: 'job-click', job: Job): void
  (e: 'load-more'): void
  (e: 'sortable-ready', element: HTMLElement, status: string): void
  (e: 'job-ready', payload: { jobId: string, element: HTMLElement }): void
}

const props = withDefaults(defineProps<KanbanColumnProps>(), {
  showLoadMore: false,
  isLoading: false,
  isDragging: false,
  isArchive: false
})

const emit = defineEmits<KanbanColumnEmits>()

const jobListRef = ref<HTMLElement>()
const isSortableInitialized = ref(false)

onMounted(() => {
  if (jobListRef.value && !isSortableInitialized.value) {
    emit('sortable-ready', jobListRef.value, props.status.key)
    isSortableInitialized.value = true
  }
})

onUnmounted(() => {
  isSortableInitialized.value = false
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

<style scoped>
.kanban-column {
  min-width: 170px;
  max-width: 170px;
  width: 210px;
}

.kanban-column.archive-column {
  min-width: 100%;
  max-width: none;
  width: 100%;
}

.job-list {
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
}

.archive-grid {
  max-height: none;
  overflow-y: visible;
}

.job-item-archive {
  min-width: 280px;
  width: 100%;
}

.job-list::-webkit-scrollbar {
  width: 6px;
}

.job-list::-webkit-scrollbar-track {
  background: transparent;
}

.job-list::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

.job-list::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--border)) / 0.8;
}

.empty-state {
  border: 2px dashed hsl(var(--border));
  border-radius: 8px;
  margin: 8px 0;
}

:global(.sortable-ghost) {
  opacity: 0.4;
  transform: rotate(5deg);
}

:global(.sortable-chosen) {
  cursor: grabbing;
}

:global(.sortable-drag) {
  transform: rotate(5deg);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

:global(.is-dragging) .job-list {
  min-height: 500px;
}

:global(.is-dragging) .empty-state {
  border-color: hsl(var(--primary)) / 0.5;
  background: hsl(var(--primary)) / 0.05;
}
</style>
