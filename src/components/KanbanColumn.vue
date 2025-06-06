<template>
  <div class="kanban-column">
    <div class="column-header bg-card p-3 rounded-t-lg border-b">
      <h3 class="font-semibold text-sm flex items-center justify-between">
        <span>{{ status.label }}</span>
        <Badge variant="secondary" class="ml-2">
          {{ jobs.length }}
        </Badge>
      </h3>
    </div>
    
    <div 
      ref="jobListRef"
      :data-status="status.key"
      class="job-list bg-card rounded-b-lg border border-t-0 min-h-[400px] p-2 transition-colors duration-200"
      :class="{
        'bg-blue-50 border-blue-200': isDragging,
        'bg-background': !isDragging
      }"
    >
      <div
        v-for="job in jobs"
        :key="job.id"
        :data-job-id="job.id"
        class="job-item mb-2"
      >
        <JobCard
          :job="job"
          :is-dragging="isDragging"
          @click="$emit('job-click', job)"
        />
      </div>

      <!-- Empty state -->
      <div 
        v-if="jobs.length === 0" 
        class="empty-state flex items-center justify-center h-32 text-muted-foreground"
      >
        <div class="text-center">
          <div class="text-sm">No jobs in {{ status.label.toLowerCase() }}</div>
          <div class="text-xs mt-1">Drag jobs here to update status</div>
        </div>
      </div>

      <!-- Load More Button -->
      <div v-if="showLoadMore" class="load-more-container mt-2">
        <Button
          variant="outline"
          size="sm"
          class="w-full"
          @click="$emit('load-more')"
          :disabled="isLoading"
        >
          <ChevronDown class="mr-2 h-4 w-4" />
          <span v-if="isLoading">Loading...</span>
          <span v-else>Load More</span>
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-vue-next'
import JobCard from '@/components/JobCard.vue'
import type { Job, StatusChoice } from '@/schemas/kanban.schemas'

interface KanbanColumnProps {
  status: StatusChoice
  jobs: Job[]
  showLoadMore?: boolean
  isLoading?: boolean
  isDragging?: boolean
}

interface KanbanColumnEmits {
  (e: 'job-click', job: Job): void
  (e: 'load-more'): void
  (e: 'sortable-ready', element: HTMLElement, status: string): void
}

const props = withDefaults(defineProps<KanbanColumnProps>(), {
  showLoadMore: false,
  isLoading: false,
  isDragging: false
})

const emit = defineEmits<KanbanColumnEmits>()

const jobListRef = ref<HTMLElement>()

onMounted(() => {
  if (jobListRef.value) {
    emit('sortable-ready', jobListRef.value, props.status.key)
  }
})

// Watch for jobs changes to update sortable
watch(
  () => props.jobs,
  () => {
    if (jobListRef.value) {
      emit('sortable-ready', jobListRef.value, props.status.key)
    }
  },
  { deep: true }
)
</script>

<style scoped>
.kanban-column {
  min-width: 280px;
  max-width: 320px;
}

.job-list {
  max-height: 600px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--border)) transparent;
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
