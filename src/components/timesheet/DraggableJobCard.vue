<template>
  <div
    ref="jobCardRef"
    class="job-attachment-card bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 cursor-move transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
    :class="{
      'border-blue-500 bg-blue-50 dark:bg-blue-900/20': isDragging,
      'opacity-50': isDragging,
      'p-2': compact,
      'p-3': !compact,
      'min-w-[180px] max-w-[200px]': compact,
      'w-full': !compact
    }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <!-- Compact Layout -->
    <div v-if="compact" class="flex items-center justify-between">
      <div class="flex-1 min-w-0 mr-2">
        <div class="flex items-center gap-1 mb-1">
          <Badge variant="outline" class="text-xs font-mono px-1 py-0">
            {{ job.jobNumber }}
          </Badge>
        </div>
        <h4 class="font-medium text-xs text-gray-900 dark:text-white truncate">
          {{ job.name || job.jobName }}
        </h4>
        <p class="text-xs text-gray-600 dark:text-gray-400 truncate">
          {{ job.clientName }}
        </p>
      </div>
      <Button
        @click.stop.prevent="$emit('remove')"
        variant="ghost"
        size="sm"
        class="h-4 w-4 p-0 text-gray-400 hover:text-red-500 flex-shrink-0"
        :draggable="false"
      >
        <X class="h-3 w-3" />
      </Button>
    </div>

    <!-- Full Layout -->
    <div v-else class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1">
          <Badge variant="outline" class="text-xs font-mono">
            {{ job.jobNumber }}
          </Badge>
          <Badge :variant="getStatusVariant(job.status || 'unknown')" class="text-xs">
            {{ job.status || 'Unknown' }}
          </Badge>
        </div>

        <h4 class="font-medium text-sm text-gray-900 dark:text-white mb-1 truncate">
          {{ job.name || job.jobName }}
        </h4>

        <p class="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
          {{ job.clientName }}
        </p>

        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Rate: ${{ job.chargeOutRate || 0 }}/hr</span>
          <span v-if="job.estimatedHours">{{ job.estimatedHours }}h est.</span>
        </div>
      </div>

      <Button
        @click.stop.prevent="$emit('remove')"
        variant="ghost"
        size="sm"
        class="h-6 w-6 p-0 text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
        :draggable="false"
      >
        <X class="h-3 w-3" />
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { Job } from '@/types/timesheet'

interface Props {
  job: Job
  compact?: boolean
}

interface Emits {
  (e: 'remove'): void
  (e: 'drag-start', job: Job): void
  (e: 'drag-end'): void
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})
const emit = defineEmits<Emits>()

const jobCardRef = ref<HTMLElement>()
const isDragging = ref(false)

const getStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'quoting': return 'secondary'
    case 'accepted_quote': return 'default'
    case 'in_progress': return 'default'
    case 'completed': return 'outline'
    case 'on_hold': return 'destructive'
    default: return 'secondary'
  }
}

const handleDragStart = (event: DragEvent) => {
  console.log('DraggableJobCard - handleDragStart called for job:', props.job.jobNumber)
  
  // Prevenir propagação para evitar conflitos
  event.stopPropagation()
  
  isDragging.value = true

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    const dragPayload = {
      type: 'job',
      job: props.job
    }
    const dragPayloadString = JSON.stringify(dragPayload)
    event.dataTransfer.setData('text/plain', dragPayloadString)
    
    console.log('Drag data set:', dragPayloadString)
    
    // Definir uma imagem personalizada para o drag (opcional)
    if (jobCardRef.value) {
      event.dataTransfer.setDragImage(jobCardRef.value, 10, 10)
    }
  }

  emit('drag-start', props.job)
}

const handleDragEnd = (event: DragEvent) => {
  console.log('DraggableJobCard - handleDragEnd called for job:', props.job.jobNumber)
  
  // Prevenir propagação para evitar conflitos
  event.stopPropagation()
  
  isDragging.value = false
  emit('drag-end')
}
</script>

<style scoped>
.job-attachment-card {
  transition: all 0.2s ease-in-out;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  position: relative;
  z-index: 1;
}

.job-attachment-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 2;
}

.job-attachment-card.border-blue-500 {
  transform: rotate(2deg) scale(1.02);
  z-index: 10;
}

/* Melhorar o cursor durante drag */
.job-attachment-card[draggable="true"] {
  cursor: grab;
}

.job-attachment-card[draggable="true"]:active {
  cursor: grabbing;
}

/* Simplificar pointer events - remover a regra que desabilitava para todos os filhos */
.job-attachment-card button {
  position: relative;
  z-index: 5;
}

.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
