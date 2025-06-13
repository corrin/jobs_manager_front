<template>
  <div class="job-attachment-zone">
    <!-- Available Jobs Grid -->
    <div class="flex items-center gap-4 flex-wrap">
      <!-- Attached Jobs in horizontal grid -->
      <div v-if="attachedJobs.length > 0" class="flex flex-wrap gap-2 flex-1">
        <DraggableJobCard
          v-for="job in attachedJobs"
          :key="job.id"
          :job="job"
          :compact="true"
          @remove="removeJob(job.id)"
          @drag-start="handleJobDragStart"
          @drag-end="handleJobDragEnd"
        />
      </div>

      <!-- Add Job Button -->
      <Button
        @click="showJobSelection = true"
        variant="outline"
        size="sm"
        class="border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors whitespace-nowrap"
        :class="{ 'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isDragOverJobZone }"
      >
        <Plus class="h-4 w-4 mr-2" />
        {{ attachedJobs.length === 0 ? 'Attach Job' : 'Add Job' }}
      </Button>
    </div>

    <!-- Job Selection Modal -->
    <JobSelectionModal
      :is-open="showJobSelection"
      @close="showJobSelection = false"
      @job-selected="handleJobSelected"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import DraggableJobCard from './DraggableJobCard.vue'
import JobSelectionModal from './JobSelectionModal.vue'
import type { Job } from '@/types/timesheet'

interface Props {
  attachedJobs: Job[]
  isDragOverJobZone?: boolean
}

interface Emits {
  (e: 'job-attached', job: Job): void
  (e: 'job-removed', jobId: string): void
  (e: 'job-drag-start', job: Job): void
  (e: 'job-drag-end'): void
}

const props = withDefaults(defineProps<Props>(), {
  isDragOverJobZone: false
})

const emit = defineEmits<Emits>()

const showJobSelection = ref(false)

const handleJobSelected = (job: Job) => {
  // Check if job is already attached
  const isAlreadyAttached = props.attachedJobs.some(attachedJob => attachedJob.id === job.id)

  if (!isAlreadyAttached) {
    emit('job-attached', job)
  }

  showJobSelection.value = false
}

const removeJob = (jobId: string) => {
  emit('job-removed', jobId)
}

const handleJobDragStart = (job: Job) => {
  emit('job-drag-start', job)
}

const handleJobDragEnd = () => {
  emit('job-drag-end')
}
</script>

<style scoped>
.job-attachment-zone {
  min-height: 50px;
  max-height: 80px;
  /* Remover overflow que interfere com drag */
  overflow: visible;
}

/* Garantir que o container não interfira com drag */
.job-attachment-zone > div {
  overflow: visible;
}
</style>
