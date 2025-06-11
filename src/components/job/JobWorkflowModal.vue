<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && closeModal()">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Workflow Settings</DialogTitle>
        <DialogDescription>
          Configure job status, delivery dates, and workflow tracking.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 max-h-[60vh] overflow-y-auto">
        <!-- Job Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Job Status
          </label>
          <select v-model="localJobData.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <!-- Delivery Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Delivery Date
          </label>
          <input v-model="localJobData.delivery_date" type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        <!-- Quote Acceptance Date -->
        <div v-if="localJobData.quote_acceptance_date">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Quote Accepted On
          </label>
          <input :value="formatDate(localJobData.quote_acceptance_date)" type="text" readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" />
        </div>

        <!-- Status Checkboxes -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-700">Job Status Tracking</h4>

          <div class="flex items-start">
            <input v-model="localJobData.quoted" type="checkbox"
              class="mt-1 rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
            <div class="ml-2">
              <label class="text-sm text-gray-700">
                Already Quoted?
              </label>
              <div class="text-xs text-gray-500">Indicator of whether the job was already quoted in Xero</div>
            </div>
          </div>

          <div class="flex items-start">
            <input v-model="localJobData.invoiced" type="checkbox"
              class="mt-1 rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
            <div class="ml-2">
              <label class="text-sm text-gray-700">
                Already Invoiced?
              </label>
              <div class="text-xs text-gray-500">Indicator of whether the job was already invoiced in Xero</div>
            </div>
          </div>

          <div class="flex items-center">
            <input v-model="localJobData.paid" type="checkbox"
              class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
            <label class="ml-2 text-sm text-gray-700">
              Job Paid
            </label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <button @click="closeModal" type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Cancel
        </button>
        <button @click="saveWorkflow" type="button"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Save Changes
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { JobData } from '@/services/jobRestService'
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
  jobData: JobData | null
  isOpen: boolean
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  close: []
  'workflow-updated': [data: Partial<JobData>]
}>()

// Local job data for editing
const localJobData = ref<Partial<JobData>>({})

// Watch for props changes
watch(() => props.jobData, (newJobData) => {
  if (newJobData) {
    localJobData.value = { ...newJobData }
  }
}, { immediate: true })

// Methods
const closeModal = () => {
  emit('close')
}

const saveWorkflow = () => {
  if (props.jobData && localJobData.value) {
    emit('workflow-updated', localJobData.value)
  }
  closeModal()
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
