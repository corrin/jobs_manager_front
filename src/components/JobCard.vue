<template>
  <Card
    class="job-card cursor-pointer hover:shadow-md transition-all duration-200 border-l-4"
    :class="[
      statusConfig.borderClass,
      {
        'cursor-grabbing': isDragging,
        'hover:scale-105': !isDragging,
        'opacity-50': isDragging
      }
    ]"
    :data-id="job.id"
    @click="handleClick"
  >
    <CardHeader class="pb-2">
      <div class="flex justify-between items-start">
        <div class="text-sm font-medium truncate">
          {{ job.name }}
        </div>
        <Badge
          :variant="statusConfig.variant"
          class="text-xs"
        >
          {{ formatStatus(job.status) }}
        </Badge>
      </div>
    </CardHeader>

    <CardContent class="pt-0 space-y-2">
      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <div class="flex items-center gap-1">
          <Hash class="h-3 w-3" />
          <span>{{ job.job_number }}</span>
        </div>
        <Badge v-if="job.paid" variant="outline" class="text-xs bg-green-50 text-green-700">
          <DollarSign class="h-3 w-3 mr-1" />
          PAID
        </Badge>
      </div>

      <p class="text-sm text-muted-foreground line-clamp-2">
        {{ job.description }}
      </p>

      <div class="flex justify-between items-center text-xs text-muted-foreground">
        <span class="truncate">{{ job.client_name }}</span>
        <div class="flex items-center gap-1">
          <Calendar class="h-3 w-3" />
          <span>{{ formattedDate }}</span>
        </div>
      </div>

      <div v-if="job.contact_person" class="flex items-center gap-1 text-xs text-muted-foreground">
        <User class="h-3 w-3" />
        <span class="truncate">{{ job.contact_person }}</span>
      </div>

      <!-- Staff Assignments -->
      <div 
        ref="jobStaffContainerRef"
        class="job-assigned-staff flex gap-1 mt-2 min-h-[32px] p-1 rounded border-2 border-dashed border-transparent transition-colors"
        :class="{
          'border-blue-300 bg-blue-50': isStaffDragTarget,
          'bg-gray-50': job.people && job.people.length === 0
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
          class="text-xs text-muted-foreground flex items-center justify-center w-full"
        >
          Drag staff here
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Calendar, User, Hash, DollarSign } from 'lucide-vue-next'
import StaffAvatar from '@/components/StaffAvatar.vue'
import { useJobCard } from '@/composables/useJobCard'
import type { Job } from '@/schemas/kanban.schemas'

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
const { statusConfig, formattedDate, formatStatus, handleClick } = useJobCard(props.job, emit)

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
