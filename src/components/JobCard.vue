<template>
  <div
    class="job-card"
    :class="{
      'cursor-grabbing': isDragging,
      'opacity-50': isDragging && false,
      'ring-2 ring-blue-500 bg-blue-50': isMovementModeActive && isJobSelectedForMovement,
      'border-blue-400 hover:border-blue-500': isMovementModeActive && !isJobSelectedForMovement,
      'cursor-pointer': isMovementModeActive,
      'cursor-grab': !isDragging && !isMovementModeActive,
    }"
    :data-id="job.id || ''"
    :data-job-id="job.id || ''"
    @click="handleClick"
  >
    <div
      v-if="isMovementModeActive"
      class="absolute top-1 right-1 w-2 h-2 rounded-full transition-all duration-200"
      :class="isJobSelectedForMovement ? 'bg-blue-500' : 'bg-blue-300 opacity-60'"
    ></div>

    <div class="flex justify-between items-center mb-1">
      <span class="text-xs font-semibold text-blue-600">#{{ job.job_number }}</span>
    </div>

    <h4 class="font-medium text-gray-900 text-xs mb-1 leading-tight">
      {{ truncatedJobName }}
    </h4>

    <p class="text-xs text-gray-600 mb-1 line-clamp-1 leading-tight">{{ job.description }}</p>

    <div class="text-xs text-gray-500 mb-2 truncate font-medium">{{ job.client_name }}</div>

    <StatusBadge
      :label="friendlyStatusName"
      :status="job.status_key || ''"
      size="xs"
      class="mb-2 text-[10px]"
    />

    <div
      ref="jobStaffContainerRef"
      class="flex gap-1 mt-auto h-4 p-1 rounded border border-dashed border-gray-300 transition-colors items-center"
      :class="{
        'border-blue-400 bg-blue-50': isStaffDragTarget,
        'bg-gray-50': !job.people || job.people.length === 0,
      }"
    >
      <StaffAvatar
        v-for="staff in job.people || []"
        :key="staff.id"
        :staff="staff"
        size="sm"
        :title="staff.display_name"
        :data-staff-id="staff.id"
      />
      <div
        v-if="!job.people || job.people.length === 0"
        class="text-xs text-gray-400 flex items-center justify-center w-full font-medium"
      >
        +
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import StaffAvatar from '@/components/StaffAvatar.vue'
import StatusBadge from '@/components/kanban/StatusBadge.vue'
import { useJobCard } from '@/composables/useJobCard'
import { statusNameMap } from '@/utils/statusMappings'
import type { Job } from '@/types'

interface JobCardProps {
  job: Job
  isDragging?: boolean
  isStaffDragTarget?: boolean
  isMovementModeActive?: boolean
  isJobSelectedForMovement?: boolean
}

interface JobCardEmits {
  (e: 'click', job: Job): void
  (e: 'job-ready', payload: { jobId: string; element: HTMLElement }): void
  (e: 'job-selected-for-movement', job: Job): void
}

const props = withDefaults(defineProps<JobCardProps>(), {
  isDragging: false,
  isStaffDragTarget: false,
  isMovementModeActive: false,
  isJobSelectedForMovement: false,
})
const emit = defineEmits<JobCardEmits>()

const jobStaffContainerRef = ref<HTMLElement>()

const { handleClick } = useJobCard(props.job, emit)

const friendlyStatusName = computed(() => {
  return statusNameMap[props.job.status_key || ''] || props.job.status_key || ''
})

const truncatedJobName = computed(() => {
  return props.job.name.length > 12 ? props.job.name.substring(0, 12) + '...' : props.job.name
})

onMounted(() => {
  const cardElement = document.querySelector(`[data-id="${props.job.id}"]`) as HTMLElement
  if (cardElement && jobStaffContainerRef.value) {
    emit('job-ready', {
      jobId: props.job.id.toString(),
      element: jobStaffContainerRef.value,
    })
  }
})
</script>

<style scoped>
.job-card {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: #fff;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.03);
  padding: 0.75rem 0.75rem 0.5rem 0.75rem;
  margin: 0;
  max-height: 210px;
  min-height: 120px;
  height: auto;
  align-self: start;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;
  cursor: pointer;
  overflow: hidden;
}

.job-card:active {
  cursor: grabbing;
}

.job-card .text-xs {
  font-size: 0.78rem;
  line-height: 1.1;
}

.job-card h4 {
  font-size: 0.92rem;
  font-weight: 500;
  margin-bottom: 0.15rem;
  line-height: 1.15;
}

.job-card .mb-2 {
  margin-bottom: 0.3rem !important;
}

.job-card .mb-1 {
  margin-bottom: 0.18rem !important;
}

.job-card .p-1 {
  padding: 0.18rem !important;
}

.job-card .h-4 {
  height: 1.1rem !important;
}

.job-card .rounded {
  border-radius: 0.35rem !important;
}

.job-card .border-dashed {
  border-style: dashed !important;
}

.job-card .gap-1 {
  gap: 0.18rem !important;
}

.job-card .font-medium {
  font-weight: 500 !important;
}

.job-card .font-semibold {
  font-weight: 600 !important;
}

.job-card .truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.job-card .line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

:global(.job-card.sortable-chosen) {
  opacity: 0.8 !important;
  transform: scale(1.02) !important;
}
:global(.job-card.sortable-drag) {
  opacity: 0.6 !important;
}
:global(.job-card.sortable-ghost) {
  opacity: 0.3 !important;
  background: #e3f2fd !important;
  border: 2px dashed #2196f3 !important;
}

.job-card:hover {
  box-shadow: 0 2px 8px 0 rgb(0 0 0 / 0.08);
  border-color: #60a5fa;
  cursor: grab !important;
}

.job-card:active {
  cursor: grabbing !important;
}
</style>
