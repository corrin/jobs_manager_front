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
        <div class="flex items-center gap-3">
          <span v-if="saveStatusText" class="text-xs text-gray-500">{{ saveStatusText }}</span>
          <button
            v-if="saveHasError"
            type="button"
            class="text-xs text-red-600 hover:text-red-700 underline"
            @click="retrySave"
          >
            Retry
          </button>
        </div>
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
                @blur="handleBlurFlush"
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
                @blur="handleBlurFlush"
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
                  v-model="localJobData.invoiced"
                  type="checkbox"
                  :disabled="true"
                  class="mt-1 rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200/50 disabled:opacity-50"
                />
                <div class="flex-1">
                  <label class="text-sm font-medium text-gray-700">Already Invoiced</label>
                  <p class="text-xs text-gray-500 mt-1">
                    Indicates whether the job was already invoiced in Xero (read-only)
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
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useJobsStore } from '../../stores/jobs'
import { JOB_STATUS_CHOICES, JobStatusKey, getStatusLabel } from '../../constants/job-status'
import { schemas } from '../../api/generated/api'
import { z } from 'zod'
import { jobService } from '../../services/job.service'
import { debugLog } from '../../utils/debug'
import { createJobAutosave } from '../../composables/useJobAutosave'
import { toast } from 'vue-sonner'

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
const originalJobData = ref<Partial<Job>>({}) // Snapshot dos dados originais

const statusChoices = JOB_STATUS_CHOICES
const isInitializing = ref(true)

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

  const jobDataSnapshot = {
    id: jobData.id,
    job_status: jobData.job_status,
    delivery_date: jobData.delivery_date,
    quote_acceptance_date: jobData.quote_acceptance_date,
    quoted: !!jobData.quoted,
    invoiced: !!jobData.invoiced,
    paid: !!jobData.paid,
    name: jobData.name,
    client_id: jobData.client_id,
    client_name: jobData.client_name,
  }

  localJobData.value = { ...jobDataSnapshot }
  originalJobData.value = { ...jobDataSnapshot } // Mantém snapshot original

  debugLog('JobWorkflowTab - Local job data initialized:', localJobData.value)
}

watch(
  () => props.jobData,
  async (newJobData) => {
    if (!newJobData || !newJobData.id) {
      debugLog(
        '🚫 JobWorkflowTab - Received null/undefined/invalid jobData, skipping initialization',
      )
      return
    }

    debugLog('✅ JobWorkflowTab - Received valid jobData, initializing:', newJobData.id)
    isInitializing.value = true
    initializeLocalJobData(newJobData)
    await nextTick()
    isInitializing.value = false
  },
  { immediate: true, deep: true },
)

/* ------------------------------
   Autosave integration (instance, watchers, bindings, status)
------------------------------ */

const router = useRouter()

let unbindRouteGuard: () => void = () => {}

/** Instance */
const autosave = createJobAutosave({
  jobId: props.jobData?.id || '',
  getSnapshot: () => {
    // Retorna snapshot dos dados ORIGINAIS, não dos dados atuais
    const data = originalJobData.value || {}
    return {
      id: data.id,
      job_status: data.job_status,
      delivery_date: data.delivery_date,
      quote_acceptance_date: data.quote_acceptance_date,
      quoted: data.quoted,
      invoiced: data.invoiced,
      paid: data.paid,
      name: data.name,
      client_id: data.client_id,
      client_name: data.client_name,
    }
  },
  applyOptimistic: (patch) => {
    Object.entries(patch).forEach(([k, v]) => {
      ;(localJobData.value as Record<string, unknown>)[k] = v as unknown
    })
  },
  rollbackOptimistic: (previous) => {
    Object.entries(previous).forEach(([k, v]) => {
      ;(localJobData.value as Record<string, unknown>)[k] = v as unknown
    })
  },
  saveAdapter: async (patch) => {
    try {
      if (!props.jobData?.id) {
        return { success: false, error: 'Missing job id' }
      }

      const mergedJob = {
        ...(props.jobData as Job),
        ...(patch as Partial<Job>),
      } as Job

      const jobDetailResponse: JobDetailResponse = {
        success: true,
        data: {
          job: mergedJob,
          events: [],
          company_defaults: {
            wage_rate: 0,
            time_markup: 0,
            materials_markup: 0,
            charge_out_rate: 0,
          },
        },
      }

      const result = await jobService.updateJob(props.jobData.id, jobDetailResponse)
      if (result.success) {
        if (result.data?.data) {
          jobsStore.setDetailedJob(result.data.data)

          // Atualiza snapshot original com os dados salvos
          const savedJob = result.data.data.job
          originalJobData.value = {
            id: savedJob.id,
            job_status: savedJob.job_status,
            delivery_date: savedJob.delivery_date,
            quote_acceptance_date: savedJob.quote_acceptance_date,
            quoted: !!savedJob.quoted,
            invoiced: !!savedJob.invoiced,
            paid: !!savedJob.paid,
            name: savedJob.name,
            client_id: savedJob.client_id,
            client_name: savedJob.client_name,
          }
        }
        // Notifica sucesso
        toast.success('Job updated successfully')
        return { success: true, serverData: result.data }
      }

      return { success: false, error: result.error || 'Update failed' }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return { success: false, error: msg }
    }
  },
  devLogging: true,
})

/** Bindings de ciclo de vida */
onMounted(() => {
  autosave.onBeforeUnloadBind()
  autosave.onVisibilityBind()
  unbindRouteGuard = autosave.onRouteLeaveBind({
    beforeEach: router.beforeEach.bind(router),
  })
})

onUnmounted(() => {
  autosave.onBeforeUnloadUnbind()
  autosave.onVisibilityUnbind()
  unbindRouteGuard()
})

/** Watchers granulares */
const enqueueIfNotInitializing = (key: string, value: unknown) => {
  if (!isInitializing.value) {
    autosave.queueChange(key, value)
  }
}

watch(
  () => localJobData.value.job_status,
  (v) => enqueueIfNotInitializing('job_status', v),
)
watch(
  () => localJobData.value.delivery_date,
  (v) => enqueueIfNotInitializing('delivery_date', v),
)

/** UI helpers */
const handleBlurFlush = () => {
  void autosave.flush('blur')
}
const retrySave = () => {
  void autosave.flush('retry-click')
}

const saveHasError = computed(() => !!autosave.error.value)
const saveStatusText = computed(() => {
  if (autosave.isSaving.value) return 'Saving...'
  if (autosave.error.value) return 'Save failed'
  if (autosave.lastSavedAt.value) {
    try {
      return `Saved at ${autosave.lastSavedAt.value.toLocaleTimeString()}`
    } catch {
      return 'Saved'
    }
  }
  return ''
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
