<template>
  <div
    class="bg-white p-2 rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-grab h-32 flex flex-col"
    :class="{
      'cursor-grabbing': isDragging,
      'opacity-50': isDragging,
      'shadow-sm': !isDragging,
      'ring-2 ring-blue-500 bg-blue-50': isMovementModeActive && isJobSelectedForMovement,
      'border-blue-400 hover:border-blue-500': isMovementModeActive && !isJobSelectedForMovement,
      'cursor-pointer': isMovementModeActive
    }"
    :data-id="job.id"
    @click="handleClick"
  >
    <!-- Movement Mode Indicator -->
    <div
      v-if="isMovementModeActive"
      class="absolute top-1 right-1 w-2 h-2 rounded-full transition-all duration-200"
      :class="isJobSelectedForMovement ? 'bg-blue-500' : 'bg-blue-300 opacity-60'"
    ></div>

    <!-- Header: Job Number and Status -->
    <div class="flex justify-between items-center mb-1">
      <span class="text-xs font-semibold text-blue-600">#{{ job.job_number }}</span>
      <StatusBadge
        :label="statusBadgeInfo.label"
        :color-class="statusBadgeInfo.colorClass"
        size="sm"
      />
    </div>

    <!-- Job Title -->
    <h4 class="font-medium text-gray-900 text-xs mb-1 leading-tight truncate">
      {{ truncatedJobName }}
    </h4>

    <!-- Job Description -->
    <p class="text-xs text-gray-600 mb-1 line-clamp-1 leading-tight">{{ job.description }}</p>

    <!-- Client Name -->
    <div class="text-xs text-gray-500 mb-1 truncate font-medium">{{ job.client_name }}</div>

    <!-- Staff Assignments -->
    <div
      ref="jobStaffContainerRef"
      class="flex gap-1 mt-auto h-4 p-1 rounded border border-dashed border-gray-300 transition-colors items-center"
      :class="{
        'border-blue-400 bg-blue-50': isStaffDragTarget,
        'bg-gray-50': (!job.people || job.people.length === 0)
      }"
    >
      <StaffAvatar
        v-for="staff in job.people"
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
import { KanbanCategorizationService } from '@/services/kanban-categorization.service'
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
  (e: 'job-ready', payload: { jobId: string, element: HTMLElement }): void
  (e: 'job-selected-for-movement', job: Job): void
}

const props = withDefaults(defineProps<JobCardProps>(), {
  isDragging: false,
  isStaffDragTarget: false,
  isMovementModeActive: false,
  isJobSelectedForMovement: false
})
const emit = defineEmits<JobCardEmits>()

const jobStaffContainerRef = ref<HTMLElement>()

// Use job card composable
const { handleClick } = useJobCard(props.job, emit)

// Computed property for status badge
const statusBadgeInfo = computed(() => {
  return KanbanCategorizationService.getBadgeInfo(props.job.status_key)
})

// Truncate job name to 12 characters
const truncatedJobName = computed(() => {
  return props.job.name.length > 12
    ? props.job.name.substring(0, 12) + '...'
    : props.job.name
})

// Emit job ready when component mounts
onMounted(() => {
  const cardElement = document.querySelector(`[data-id="${props.job.id}"]`) as HTMLElement
  if (cardElement) {
    emit('job-ready', {
      jobId: props.job.id.toString(),
      element: cardElement
    })
  }
})
</script>
