<template>
  <div
    class="bg-white p-1.5 rounded border border-gray-200 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
    :class="{
      'cursor-grabbing': isDragging,
      'opacity-50': isDragging,
      'shadow-sm': !isDragging
    }"
    :data-id="job.id"
    @click="handleClick"
  >
    <div class="flex justify-between items-center mb-1">
      <span class="text-xs font-semibold text-blue-600">#{{ job.job_number }}</span>
      <span :class="['w-2 h-2 rounded-full', job.paid ? 'bg-green-500' : 'bg-red-500']"></span>
    </div>
    
    <h4 class="font-medium text-gray-900 text-xs mb-1 leading-tight line-clamp-1">{{ job.name }}</h4>
    
    <p class="text-xs text-gray-600 mb-1 line-clamp-1 leading-tight">{{ job.description }}</p>
    
    <div class="text-xs text-gray-500 mb-1">
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
import { ref, onMounted } from 'vue'
import StaffAvatar from '@/components/StaffAvatar.vue'
import { useJobCard } from '@/composables/useJobCard'
import type { Job } from '@/types'

interface JobCardProps {
  job: Job
  isDragging?: boolean
  isStaffDragTarget?: boolean
}

interface JobCardEmits {
  (e: 'click', job: Job): void
  (e: 'job-ready', payload: { jobId: string, element: HTMLElement }): void
}

const props = withDefaults(defineProps<JobCardProps>(), {
  isDragging: false,
  isStaffDragTarget: false
})
const emit = defineEmits<JobCardEmits>()

const jobStaffContainerRef = ref<HTMLElement>()
const { handleClick } = useJobCard(props.job, emit)

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
</style>
