<template>
  <div class="p-4 sm:p-6 lg:p-8 h-full overflow-y-auto bg-gray-50/50">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Workflow Settings</h2>
          <p class="text-sm text-gray-600">
            Configure job status, delivery dates, and workflow tracking
          </p>
        </div>
        <button
          @click="saveWorkflow"
          type="button"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Loader2 v-if="isLoading" class="animate-spin h-4 w-4" />
          <span>{{ isLoading ? 'Saving...' : 'Save Changes' }}</span>
        </button>
      </div>

      <!-- Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Job Status & Dates Card -->
        <Card>
          <CardHeader>
            <CardTitle>Job Status & Timeline</CardTitle>
            <CardDescription>Current status and important dates</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Job Status</label>
              <select
                v-model="localJobData.job_status"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
              <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
              <input
                v-model="localJobData.delivery_date"
                type="date"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>

            <div v-if="localJobData.quote_acceptance_date">
              <label class="block text-sm font-medium text-gray-700 mb-2">Quote Accepted On</label>
              <input
                :value="formatDate(localJobData.quote_acceptance_date as string)"
                type="text"
                readonly
                class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Status Tracking Card -->
        <Card>
          <CardHeader>
            <CardTitle>Status Tracking</CardTitle>
            <CardDescription>Track job progress and payment status</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-4">
              <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  v-model="localJobData.quoted"
                  type="checkbox"
                  :disabled="true"
                  class="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200/50 disabled:opacity-50"
                />
                <div class="flex-1">
                  <label class="text-sm font-medium text-gray-700">Already Quoted</label>
                  <p class="text-xs text-gray-500 mt-1">
                    Indicates whether the job was already quoted in Xero (read-only)
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  v-model="localJobData.fully_invoiced"
                  type="checkbox"
                  :disabled="true"
                  class="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200/50 disabled:opacity-50"
                />
                <div class="flex-1">
                  <label class="text-sm font-medium text-gray-700">Fully Invoiced</label>
                  <p class="text-xs text-gray-500 mt-1">
                    Indicates whether the job is fully invoiced (read-only)
                  </p>
                </div>
              </div>

              <div class="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <input
                  v-model="localJobData.paid"
                  type="checkbox"
                  class="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200/50"
                />
                <div class="flex-1">
                  <label class="text-sm font-medium text-gray-700">Job Paid</label>
                  <p class="text-xs text-gray-500 mt-1">Mark this job as paid (editable)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useJobsStore } from '../../stores/jobs'
import { toast } from 'vue-sonner'
import { JOB_STATUS_CHOICES, JobStatusKey, getStatusLabel } from '../../constants/job-status'
import { schemas } from '../../api/generated/api'
import { z } from 'zod'
import { Loader2 } from 'lucide-vue-next'
import { jobService } from '../../services/job.service'
import { debugLog } from '../../utils/debug'

// Simple Card components (placeholder)
const Card = {
  template: '<div class="bg-white rounded-lg border border-gray-200 shadow-sm"><slot /></div>',
}
const CardHeader = { template: '<div class="px-6 py-4 border-b border-gray-200"><slot /></div>' }
const CardTitle = { template: '<h3 class="text-lg font-semibold text-gray-900"><slot /></h3>' }
const CardDescription = { template: '<p class="text-sm text-gray-600 mt-1"><slot /></p>' }
const CardContent = { template: '<div class="px-6 py-4"><slot /></div>' }

type JobDetailResponse = z.infer<typeof schemas.JobDetailResponse>
type Job = z.infer<typeof schemas.Job>

type Props = {
  jobData: Job
}

const props = defineProps<Props>()

defineEmits<{
  'job-updated': [job: JobDetailResponse]
}>()

const jobsStore = useJobsStore()

const localJobData = ref<Partial<Job>>({})
const isLoading = ref(false)

const statusChoices = JOB_STATUS_CHOICES

const currentStatusLabel = computed(() => {
  if (!localJobData.value.job_status) {
    return ''
  }
  return getStatusLabel(localJobData.value.job_status as JobStatusKey)
})

const initializeLocalJobData = (jobData: Job) => {
  if (!jobData || !jobData.id) {
    debugLog('🚫 JobWorkflowTab - initializeLocalJobData: Invalid jobData received')
    return
  }

  debugLog('🔄 JobWorkflowTab - initializeLocalJobData: Initializing with job:', jobData.id)

  localJobData.value = {
    id: jobData.id,
    job_status: jobData.job_status,
    delivery_date: jobData.delivery_date,
    quote_acceptance_date: jobData.quote_acceptance_date,
    quoted: !!jobData.quoted,
    fully_invoiced: !!jobData.fully_invoiced,
    paid: !!jobData.paid,
    name: jobData.name,
    client_id: jobData.client_id,
    client_name: jobData.client_name,
  }

  debugLog('JobWorkflowTab - Local job data initialized:', localJobData.value)
}

watch(
  () => props.jobData,
  (newJobData) => {
    if (!newJobData || !newJobData.id) {
      debugLog(
        '🚫 JobWorkflowTab - Received null/undefined/invalid jobData, skipping initialization',
      )
      return
    }

    debugLog('✅ JobWorkflowTab - Received valid jobData, initializing:', newJobData.id)
    initializeLocalJobData(newJobData)
  },
  { immediate: true, deep: true },
)

const saveWorkflow = async () => {
  if (!props.jobData?.id) {
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
      'JobWorkflowTab - saveWorkflow - Collecting form data:',
      JSON.parse(JSON.stringify(localJobData.value)),
    )

    // Construct the complete JobDetailResponse structure
    const jobDetailResponse: JobDetailResponse = {
      success: true,
      data: {
        job: {
          ...props.jobData,
          ...localJobData.value,
        },
        events: [], // We don't have events in this context
        company_defaults: {
          wage_rate: 0,
          time_markup: 0,
          materials_markup: 0,
          charge_out_rate: 0,
        },
      },
    }

    debugLog(
      'JobWorkflowTab - saveWorkflow - Prepared jobDetailResponse:',
      JSON.parse(JSON.stringify(jobDetailResponse)),
    )

    // Call the real job update API
    const result = await jobService.updateJob(props.jobData.id, jobDetailResponse)

    if (!result.success) {
      throw new Error(result.error || 'Failed to update workflow - request failed')
    }

    if (result.data) {
      handleSuccessfulUpdate(result.data)
    } else {
      debugLog('⚠️ JobWorkflowTab - API returned success but no data, refreshing from server')
      const refreshedJob = await jobService.getJob(props.jobData.id)
      handleSuccessfulUpdate(refreshedJob)
    }
  } catch (error) {
    handleUpdateError(error)
  } finally {
    isLoading.value = false
  }
}

const handleSuccessfulUpdate = (updatedJobData: JobDetailResponse) => {
  debugLog(
    'JobWorkflowTab - handleSuccessfulUpdate - About to update store with:',
    JSON.parse(JSON.stringify(updatedJobData)),
  )

  if (!updatedJobData?.data?.job?.id) {
    debugLog('🚨 JobWorkflowTab - handleSuccessfulUpdate called with invalid data')
    throw new Error('Invalid job data received - missing job ID')
  }

  debugLog('🎯 JobWorkflowTab - Processing valid job data:', updatedJobData.data.job.id)
  debugLog('🔍 JobWorkflowTab - Updated job_status:', updatedJobData.data.job.job_status)

  toast.success('Workflow updated', {
    description: `Status and settings for ${updatedJobData.data.job.name} have been saved`,
  })

  debugLog('📝 JobWorkflowTab - Calling jobsStore.setDetailedJob')
  // Extract the JobDetail (data) from the API response wrapper before passing to store
  jobsStore.setDetailedJob(updatedJobData.data)

  debugLog('✅ JobWorkflowTab - Store updated successfully')
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
</script>
