<template>
  <div 
    v-if="showSelector" 
    class="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
    @click.self="$emit('cancel')"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">      <div class="text-center mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">
          Move Job
        </h3>
        <div v-if="selectedJob" class="text-sm text-gray-600">
          <div class="font-medium">#{{ selectedJob.job_number }}</div>
          <div class="truncate">{{ selectedJob.name }}</div>
        </div>
      </div>
      
      <div class="space-y-3 mb-6">        <button
          v-for="status in availableStatuses"
          :key="status.key"
          @click="$emit('column-selected', status.key)"
          class="w-full p-3 text-left rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
          :class="{
            'opacity-50 cursor-not-allowed': status.key === currentStatus,
            'border-blue-300 bg-blue-50': status.key !== currentStatus
          }"
          :disabled="status.key === currentStatus"
        >
          <div class="flex items-center justify-between">
            <span class="font-medium text-gray-900">{{ status.label }}</span>            <span 
              v-if="status.key === currentStatus" 
              class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded"
            >
              Current
            </span>
          </div>
        </button>
      </div>
      
      <div class="flex gap-3">        <button
          @click="$emit('cancel')"
          class="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Job, JobStatus } from '@/types'

interface ColumnSelectorProps {
  showSelector: boolean
  selectedJob: Job | null
  currentStatus: string
  availableStatuses: JobStatus[]
}

interface ColumnSelectorEmits {
  (e: 'column-selected', status: string): void
  (e: 'cancel'): void
}

defineProps<ColumnSelectorProps>()
defineEmits<ColumnSelectorEmits>()
</script>
