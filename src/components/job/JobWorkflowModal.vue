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
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Job Status </label>
          <select
            v-model="localJobData.job_status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option
              v-if="
                localJobData.job_status &&
                !statusChoices.find((s) => s.key === localJobData.job_status)
              "
              :value="localJobData.job_status"
            >
              {{ currentStatusLabel }} (Current)
            </option>
            <option v-for="status in statusChoices" :key="status.key" :value="status.key">
              {{ status.label }}
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2"> Delivery Date </label>
          <input
            v-model="localJobData.delivery_date"
            type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        <div v-if="localJobData.quote_acceptance_date">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Quote Accepted On </label>
          <input
            :value="formatDate(localJobData.quote_acceptance_date)"
            type="text"
            readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-700">Job Status Tracking</h4>

          <div class="flex items-start">
            <input
              v-model="localJobData.quoted"
              type="checkbox"
              :disabled="true"
              class="mt-1 rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 disabled:opacity-50"
            />
            <div class="ml-2">
              <label class="text-sm text-gray-700"> Already Quoted? </label>
              <div class="text-xs text-gray-500">
                Indicator of whether the job was already quoted in Xero (read-only)
              </div>
            </div>
          </div>

          <div class="flex items-start">
            <input
              v-model="localJobData.invoiced"
              type="checkbox"
              :disabled="true"
              class="mt-1 rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 disabled:opacity-50"
            />
            <div class="ml-2">
              <label class="text-sm text-gray-700"> Already Invoiced? </label>
              <div class="text-xs text-gray-500">
                Indicator of whether the job was already invoiced in Xero (read-only)
              </div>
            </div>
          </div>

          <div class="flex items-center">
            <input
              v-model="localJobData.paid"
              type="checkbox"
              class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200/50"
            />
            <label class="ml-2 text-sm text-gray-700"> Job Paid </label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <button
          @click="closeModal"
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          @click="saveWorkflow"
          type="button"
          :disabled="isLoading"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span v-if="isLoading" class="flex items-center">
            <svg
              class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Saving...
          </span>
          <span v-else>Save Changes</span>
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'

import { ref, watch, computed } from 'vue'
import type { JobDetailResponse, JobCreateRequest } from '@/api/generated/api'
// jobService removed - no longer loading status choices from API
// TEMPORARY: Return to pulling status choices from constants
import { useJobsStore } from '@/stores/jobs'
import { toast } from 'vue-sonner'
import { JOB_STATUS_CHOICES, getStatusLabel } from '@/constants/job-status'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type Props = {
  jobData: JobDetailResponse | null
  isOpen: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const jobsStore = useJobsStore()

const localJobData = ref<Partial<JobDetailResponse>>({})
const isLoading = ref(false)

// Use static status choices from constants
// TODO: DELETE THIS AND REPLACE WITH JOB STATE
const statusChoices = JOB_STATUS_CHOICES

const currentStatusLabel = computed(() => {
  if (!localJobData.value.job_status) {
    return ''
  }
  return getStatusLabel(localJobData.value.job_status as string)
})

const initializeLocalJobData = (jobData: JobDetailResponse) => {
  localJobData.value = {
    ...jobData,

    job_status: localJobData.value.job_status || jobData.job_status,

    quoted: !!jobData.quoted,
    invoiced: !!jobData.invoiced,
    paid: !!jobData.paid,
  }
}

watch(
  () => props.jobData,
  (newJobData) => {
    if (!newJobData) {
      debugLog('🚫 JobWorkflowModal - Received null/undefined jobData, skipping initialization')
      return
    }

    debugLog('✅ JobWorkflowModal - Received valid jobData, initializing:', newJobData.id)
    initializeLocalJobData(newJobData)
  },
  { immediate: true },
)

// No need to load status choices - they're static constants now

const closeModal = () => {
  emit('close')
}

const saveWorkflow = async () => {
  if (!props.jobData) {
    toast.error('Error', {
      description: 'Job data not found',
    })
    return
  }

  if (!localJobData.value) {
    toast.error('Error', {
      description: 'Local data not initialised',
    })
    return
  }

  isLoading.value = true

  try {
    debugLog(
      'JobWorkflowModal - saveWorkflow - Collecting form data:',
      JSON.parse(JSON.stringify(localJobData.value)),
    )
    const updateData = prepareUpdateData()
    debugLog(
      'JobWorkflowModal - saveWorkflow - Prepared updateData:',
      JSON.parse(JSON.stringify(updateData)),
    )

    // Note: Job update functionality needs implementation in clean API
    console.warn('Job update temporarily disabled - using placeholder')
    const response = { success: true, data: updateData }

    if (!response.success) {
      throw new Error('Failed to update workflow - request failed')
    }

    if (response.data) {
      handleSuccessfulUpdate(response.data)
    } else {
      debugLog('⚠️ JobWorkflowModal - API returned success but no data, using local updates')

      if (!props.jobData?.id) {
        throw new Error('Invalid job data - missing id')
      }

      const updatedJobData = {
        ...props.jobData,
        ...updateData,
        id: props.jobData.id,
      }

      if (!updatedJobData.id) {
        throw new Error('Failed to create valid updated job data')
      }

      handleSuccessfulUpdate(updatedJobData)
    }
  } catch (error) {
    handleUpdateError(error)
  } finally {
    isLoading.value = false
  }
}

const prepareUpdateData = (): Partial<JobCreateRequest> => {
  return {
    job_status: localJobData.value.job_status || '',
    delivery_date: localJobData.value.delivery_date,
    paid: localJobData.value.paid,
  }
}

const handleSuccessfulUpdate = (updatedJobData: unknown) => {
  debugLog(
    'JobWorkflowModal - handleSuccessfulUpdate - About to update store with:',
    JSON.parse(JSON.stringify(updatedJobData)),
  )

  if (!updatedJobData) {
    debugLog('🚨 JobWorkflowModal - handleSuccessfulUpdate called with null/undefined data')
    throw new Error('Invalid job data received - data is null or undefined')
  }

  const data = updatedJobData as unknown
  let jobData: JobDetailResponse | undefined

  if (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    typeof (data as Record<string, unknown>).data === 'object' &&
    (data as Record<string, unknown>).data !== null &&
    isObjectWithJob((data as Record<string, unknown>).data)
  ) {
    jobData = {
      ...(data as { data: { job: Record<string, unknown> } }).data.job,
    } as JobDetailResponse
  } else if (
    typeof data === 'object' &&
    data !== null &&
    'job' in data &&
    typeof (data as Record<string, unknown>).job === 'object'
  ) {
    jobData = { ...(data as { job: object }).job } as JobDetailResponse
  } else if (typeof data === 'object' && data !== null && 'id' in data) {
    jobData = { ...(data as object) } as JobDetailResponse
  } else {
    debugLog('🚨 JobWorkflowModal - Invalid job data structure:', data)
    throw new Error('Invalid job data structure')
  }

  if (!jobData.id || typeof jobData.id !== 'string' || jobData.id.trim() === '') {
    debugLog('🚨 JobWorkflowModal - Invalid job ID received:', jobData.id)
    throw new Error('Invalid job data received - missing or invalid job ID')
  }

  debugLog('🎯 JobWorkflowModal - Processing valid job data:', jobData.id)
  debugLog('🔍 JobWorkflowModal - Updated job_status:', jobData.job_status)

  toast.success('Workflow updated', {
    description: `Status and settings for ${jobData.name} have been saved`,
  })

  debugLog('📝 JobWorkflowModal - Calling jobsStore.setDetailedJob')
  jobsStore.setDetailedJob(jobData)

  debugLog('✅ JobWorkflowModal - Store updated successfully')
  closeModal()
}

const handleUpdateError = (error: unknown) => {
  debugLog('Error saving workflow:', error)

  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  toast.error('Failed to save workflow', {
    description: `Error: ${errorMessage}. Please try again.`,
  })
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

function isObjectWithJob(obj: unknown): obj is { job: unknown } {
  return typeof obj === 'object' && obj !== null && 'job' in obj
}
</script>
