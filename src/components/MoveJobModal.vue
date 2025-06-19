<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && $emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Move Job #{{ jobNumber }}</DialogTitle>
        <DialogDescription>
          Select the new status for this job:
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-2">
        <button
          v-for="status in availableStatuses"
          :key="status.value"
          @click="selectStatus(status.value)"
          class="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 flex items-center justify-between group"
          :class="{
            'border-blue-400 bg-blue-50': selectedStatus === status.value
          }"
        >
          <div class="flex items-center space-x-3">
            <div
              class="w-3 h-3 rounded-full"
              :class="status.colorClass"
            ></div>
            <div>
              <div class="font-medium text-gray-900">{{ status.label }}</div>
              <div class="text-xs text-gray-500">{{ status.description }}</div>
            </div>
          </div>

          <svg
            v-if="selectedStatus === status.value"
            class="w-5 h-5 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </button>
      </div>

      <DialogFooter>
        <button
          @click="$emit('close')"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          @click="confirmMove"
          :disabled="!selectedStatus || isLoading"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Moving...' : 'Confirm' }}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

// Props
interface Props {
  isOpen: boolean
  jobId: string | null
  jobNumber: string
  currentStatus: string
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  close: []
  move: [jobId: string, newStatus: string]
}>()

// Local state
const selectedStatus = ref<string>('')
const isLoading = ref(false)

// Available statuses (could be moved to a composable or store)
const availableStatuses = [
  {
    value: 'pending',
    label: 'Pending',
    description: 'Job is waiting to be started',
    colorClass: 'bg-gray-400'
  },
  {
    value: 'in_progress',
    label: 'In Progress',
    description: 'Job is currently being worked on',
    colorClass: 'bg-blue-500'
  },
  {
    value: 'review',
    label: 'Review',
    description: 'Job is ready for review',
    colorClass: 'bg-yellow-500'
  },
  {
    value: 'completed',
    label: 'Completed',
    description: 'Job has been completed',
    colorClass: 'bg-green-500'
  },
  {
    value: 'archived',
    label: 'Archived',
    description: 'Job has been archived',
    colorClass: 'bg-gray-600'
  }
].filter(status => status.value !== props.currentStatus)

// Methods
const selectStatus = (status: string) => {
  selectedStatus.value = status
}

const confirmMove = () => {
  if (!selectedStatus.value || !props.jobId) return

  isLoading.value = true
  emit('move', props.jobId, selectedStatus.value)

  // Reset loading state after a short delay (the parent should handle the actual loading)
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}
</script>
