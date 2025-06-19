<template>
  <div
    class="job-card"
    :class="{
      'cursor-grabbing': isDragging,
      'opacity-50': isDragging,
      'shadow-sm': !isDragging,
      'ring-2 ring-blue-500/50 bg-blue-50': isMovementModeActive && isJobSelectedForMovement,
      'border-blue-400 hover:border-blue-500': isMovementModeActive && !isJobSelectedForMovement,
      'cursor-pointer': isMovementModeActive
    }"
    :data-id="job.id"
    @click="handleClick"
  >
    <!-- Movement Mode Indicator -->
    <div 
      v-if="isMovementModeActive"
      class="absolute top-2 right-2 w-3 h-3 rounded-full transition-all duration-200"
      :class="isJobSelectedForMovement ? 'bg-blue-500' : 'bg-blue-300 opacity-60'"
    ></div>
    <div class="job-card-header">
      <span class="job-card-id">#{{ job.job_number }}</span>
      <span :class="['w-2 h-2 rounded-full', job.paid ? 'bg-green-500' : 'bg-red-500']"></span>
    </div>
    
    <!-- Status Badge -->
    <div class="mb-2 flex justify-between items-center">
      <StatusBadge 
        :label="statusBadgeInfo.label"
        :color-class="statusBadgeInfo.colorClass"
        size="sm"
      />
    </div>
    
    <h4 class="job-card-title">{{ job.name }}</h4>
    
    <p class="job-card-client">{{ job.description }}</p>
    
    <div class="job-card-client">
      <div class="truncate font-medium">{{ job.client_name }}</div>
      <div v-if="job.contact_person" class="truncate">{{ job.contact_person }}</div>
    </div>

    <!-- Staff Assignments -->
    <div 
      ref="jobStaffContainerRef"
      class="job-assigned-staff flex gap-1 mt-1 min-h-[16px] p-1 rounded border border-dashed border-gray-300 transition-colors"
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
const { handleClick } = useJobCard(
  props.job, 
  (e, job) => emit('click', job),
  (e, job) => emit('job-selected-for-movement', job),
  props.isMovementModeActive
)

// Computed property for status badge information
const statusBadgeInfo = computed(() => {
  return KanbanCategorizationService.getBadgeInfo(props.job.status || props.job.status_key || '')
})

onMounted(() => {
  if (jobStaffContainerRef.value) {
    emit('job-ready', {
      jobId: props.job.id.toString(),
      element: jobStaffContainerRef.value
    })
  }
})
</script>

<style scoped>
/* Base styles */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 1;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-clamp: 2;
}

.job-card:hover {
  transform: translateY(-1px);
}

/* Drag handle styles for mobile */
.drag-handle {
  background: rgba(148, 163, 184, 0.1);
  border-radius: 4px;
  transition: all 0.2s ease;
  touch-action: manipulation;
}

.drag-handle:hover,
.drag-handle:active {
  background: rgba(148, 163, 184, 0.3);
  color: #475569;
}

.drag-handle:active {
  transform: scale(0.95);
}

/* Responsive improvements for tablets */
@media (min-width: 768px) and (max-width: 1023px) {
  .job-card {
    padding: 0.875rem; /* Increased padding for tablets */
    min-height: 120px; /* Ensure consistent card height */
  }
  
  .job-number {
    font-size: 0.875rem; /* Slightly larger font for better readability */
  }
  
  .job-title {
    font-size: 0.875rem; /* Larger title for tablets */
    line-height: 1.25;
    margin-bottom: 0.375rem;
  }
  
  .job-description {
    font-size: 0.75rem;
    line-height: 1.3;
    margin-bottom: 0.375rem;
  }
  
  .job-client {
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
  }
  
  .job-assigned-staff {
    min-height: 20px; /* Slightly larger staff area */
    padding: 0.375rem;
  }
  
  /* Allow more content to show on tablets */
  .line-clamp-1 {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

/* Desktop improvements */
@media (min-width: 1024px) {
  .job-card {
    min-height: 100px;
  }
  
  /* Desktop keeps compact design */
  .job-title,
  .job-description {
    -webkit-line-clamp: 1;
    line-clamp: 1;
  }
}

/* Large desktop improvements */
@media (min-width: 1440px) {
  .job-card {
    padding: 0.75rem;
    min-height: 110px;
  }
  
  .job-title {
    font-size: 0.75rem;
  }
  
  .job-description {
    font-size: 0.75rem;
  }
}

/* Mobile improvements */
@media (max-width: 767px) {
  .job-card {
    padding: 1rem;
    min-height: 130px;
  }
  
  .job-number {
    font-size: 0.875rem;
  }
  
  .job-title {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .job-description {
    font-size: 0.875rem;
    margin-bottom: 0.5rem;
  }
  
  .job-client {
    font-size: 0.875rem;
    margin-bottom: 0.75rem;
  }
  
  .job-assigned-staff {
    min-height: 24px;
    padding: 0.5rem;
  }
  
  /* Show more content on mobile */
  .line-clamp-1 {
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }
}

/* Hover improvements across devices */
@media (hover: hover) {
  .job-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* Touch device optimizations */
@media (hover: none) {
  .job-card:active {
    transform: scale(0.98);
  }
}

/* Accessibility improvements */
.job-card:focus {
  outline: 2px solid rgba(59, 130, 246, 0.5);
  outline-offset: 2px;
}

/* Animation improvements */
.job-card {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Staff area responsiveness */
@media (min-width: 768px) and (max-width: 1023px) {
  .job-assigned-staff .text-xs {
    font-size: 0.75rem;
  }
}
</style>
