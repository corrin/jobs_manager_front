<template>
  <div class="p-4 sm:p-6 lg:px-4 lg:py-0 h-full overflow-y-auto bg-gray-50/50">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold text-gray-900 mb-2">Job Settings</h2>
          <p class="text-sm text-gray-600">Configure job details and preferences</p>
        </div>
        <button
          @click="saveSettings"
          type="button"
          :disabled="isLoading"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Loader2 v-if="isLoading" class="animate-spin h-4 w-4" />
          <span>{{ isLoading ? 'Saving...' : 'Save Changes' }}</span>
        </button>
      </div>

      <!-- Error Messages -->
      <div
        v-if="errorMessages.length > 0"
        class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
      >
        <div class="flex">
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">There were errors with your submission</h3>
            <div class="mt-2 text-sm text-red-700">
              <ul class="list-disc pl-5 space-y-1">
                <li v-for="error in errorMessages" :key="error">{{ error }}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Cards Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- Job Information Card -->
        <Card class="lg:col-span-1">
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
            <CardDescription>Basic job details and description</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Job Name</label>
              <input
                v-model="localJobData.name"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter job name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                v-model="localJobData.description"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Describe the job requirements and scope..."
              ></textarea>
            </div>
          </CardContent>
        </Card>

        <!-- Client Information Card -->
        <Card class="lg:col-span-1">
          <CardHeader>
            <CardTitle>Client Information</CardTitle>
            <CardDescription>Client details and contact information</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <div class="space-y-3">
                <div v-if="!isChangingClient" class="space-y-2">
                  <input
                    :value="localJobData.client_name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600"
                    readonly
                  />
                  <div class="flex gap-2">
                    <button
                      @click="startClientChange"
                      type="button"
                      class="flex-1 px-3 py-2 border border-blue-300 rounded-md text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                    >
                      Change Client
                    </button>
                    <button
                      @click="editCurrentClient"
                      type="button"
                      class="flex-1 px-3 py-2 border border-green-300 rounded-md text-sm bg-green-50 hover:bg-green-100 text-green-700 transition-colors"
                    >
                      Edit Client
                    </button>
                  </div>
                </div>

                <div v-else class="space-y-3">
                  <ClientLookup
                    id="clientChange"
                    label=""
                    placeholder="Search for a new client..."
                    :required="false"
                    v-model="newClientName"
                    @update:selected-id="handleNewClientSelected"
                    @update:selected-client="handleClientLookupSelected"
                  />
                  <div class="flex gap-2">
                    <button
                      @click="confirmClientChange"
                      type="button"
                      class="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 transition-colors"
                      :disabled="!newClientId"
                    >
                      Confirm
                    </button>
                    <button
                      @click="cancelClientChange"
                      type="button"
                      class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <p class="text-xs text-gray-500">
                  {{
                    isChangingClient
                      ? 'Select a new client for this job'
                      : 'Change or edit client information'
                  }}
                </p>
              </div>
            </div>

            <div>
              <ContactSelector
                id="contact"
                label="Contact Person"
                :optional="true"
                :client-id="currentClientId"
                :client-name="currentClientName"
                :initial-contact-id="safeContactId"
                v-model="contactDisplayValue"
                @update:selected-contact="handleContactSelected"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Order Number</label>
              <input
                v-model="localJobData.order_number"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Customer order number (optional)"
              />
            </div>
          </CardContent>
        </Card>

        <!-- Settings & Notes Card -->
        <Card class="lg:col-span-2 xl:col-span-1">
          <CardHeader>
            <CardTitle>Settings & Notes</CardTitle>
            <CardDescription>Job configuration and internal notes</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Pricing Method</label>
              <select
                v-model="localJobData.pricing_methodology"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="time_materials">Time & Materials</option>
                <option value="fixed_price">Fixed Price</option>
              </select>
            </div>

            <div class="flex-grow">
              <RichTextEditor
                v-model="jobNotesComputed"
                label="Internal Notes"
                placeholder="Add internal notes about this job..."
                :required="false"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { z } from 'zod'
import { schemas } from '../../api/generated/api'
import { jobService } from '../../services/job.service'
import { useJobsStore } from '../../stores/jobs'
import RichTextEditor from '../RichTextEditor.vue'
import ClientLookup from '../ClientLookup.vue'
import ContactSelector from '../ContactSelector.vue'
import { Loader2 } from 'lucide-vue-next'
import type { Client } from '../../composables/useClientLookup'
import { debugLog } from '../../utils/debug'
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
type JobCreateRequest = z.infer<typeof schemas.JobCreateRequest>
type ClientContact = z.infer<typeof schemas.ClientContactResult>
type Job = z.infer<typeof schemas.Job>

const props = defineProps<{
  jobData: Job
}>()

const emit = defineEmits<{
  'job-updated': [job: JobDetailResponse]
}>()

const jobsStore = useJobsStore()

const localJobData = ref<Partial<Job>>({})
const isLoading = ref(false)
const errorMessages = ref<string[]>([])

const isChangingClient = ref(false)
const newClientId = ref('')
const newClientName = ref('')
const selectedNewClient = ref<Client | null>(null)

const contactDisplayValue = ref('')

const jobStatusChoices = ref<{ value: string; label: string }[]>([])

onMounted(async () => {
  try {
    const statusMap = await jobService.getStatusChoices()
    if (statusMap.statuses) {
      jobStatusChoices.value = Object.entries(statusMap.statuses).map(([value, label]) => ({
        value,
        label: String(label),
      }))
    }
  } catch {
    debugLog('Failed to load job status choices')
    toast.error('Failed to load job status choices - please contact Corrin.')
    jobStatusChoices.value = []
  }
})

// Simple data sanitization to prevent errors when sending to API - just to enforce really, Zodios already does this
const currentClientId = computed(() => {
  const clientId =
    isChangingClient.value && newClientId.value
      ? newClientId.value
      : String(localJobData.value.client_id || '')

  debugLog('JobSettingsTab - currentClientId computed:', {
    isChangingClient: isChangingClient.value,
    newClientId: newClientId.value,
    localJobDataClientId: localJobData.value.client_id,
    result: clientId,
  })

  return clientId
})

const currentClientName = computed(() => {
  return isChangingClient.value && newClientName.value
    ? newClientName.value
    : String(localJobData.value.client_name || '')
})

const safeContactId = computed((): string | undefined => {
  return localJobData.value.contact_id ? String(localJobData.value.contact_id) : undefined
})

const jobNotesComputed = computed({
  get: () => localJobData.value.notes || '',
  set: (value: string) => {
    localJobData.value.notes = value || null
  },
})

const resetClientChangeState = () => {
  isChangingClient.value = false
  newClientId.value = ''
  newClientName.value = ''
  selectedNewClient.value = null
}

watch(
  () => props.jobData,
  (newJobData) => {
    debugLog('JobSettingsTab - jobData watcher triggered. New jobData:', newJobData)
    if (!newJobData || !newJobData.id) {
      debugLog(
        '🚫 JobSettingsTab - Watcher: Received null/undefined/invalid jobData, skipping initialization.',
      )
      return
    }
    debugLog(
      '✅ JobSettingsTab - Watcher: Received valid jobData, initializing. ID:',
      newJobData.id,
    )

    // Initialize local data with proper structure
    localJobData.value = {
      id: newJobData.id,
      name: newJobData.name,
      description: newJobData.description,
      client_id: newJobData.client_id,
      client_name: newJobData.client_name,
      contact_id: newJobData.contact_id,
      contact_name: newJobData.contact_name,
      order_number: newJobData.order_number,
      notes: newJobData.notes,
      pricing_methodology: newJobData.pricing_methodology,
      job_status: newJobData.job_status,
      delivery_date: newJobData.delivery_date,
      paid: newJobData.paid,
      quoted: newJobData.quoted,
      invoiced: newJobData.invoiced,
    }

    contactDisplayValue.value = String(newJobData.contact_name || '')

    debugLog('JobSettingsTab - Local job data initialized:', localJobData.value)
  },
  { immediate: true, deep: true },
)

const sanitizeJobData = (data: Record<string, unknown>): Partial<JobCreateRequest> => {
  if (!data) return {}

  const sanitized: Record<string, unknown> = { ...data }

  const nullableFields = ['description', 'notes', 'contact_id', 'contact_name', 'order_number']

  // Map to match Zodios schema definition
  nullableFields.forEach((field) => {
    if (sanitized[field] === null) {
      sanitized[field] = undefined
    }
  })

  if (
    !sanitized.pricing_methodology ||
    (sanitized.pricing_methodology !== 'fixed_price' &&
      sanitized.pricing_methodology !== 'time_materials')
  ) {
    sanitized.pricing_methodology = ''
    debugLog(
      'sanitizeJobData - Invalid pricing_methodology, resetting to empty string',
      sanitized.pricing_methodology,
    )
    toast.error('Invalid pricing methodology selected. Please contact Corrin.')
  }

  return sanitized as Partial<JobCreateRequest>
}

const startClientChange = () => {
  isChangingClient.value = true
}

const cancelClientChange = () => {
  resetClientChangeState()
}

const handleNewClientSelected = (clientId: string) => {
  newClientId.value = clientId
}

const handleClientLookupSelected = (client: Client | null) => {
  selectedNewClient.value = client

  if (client) {
    newClientName.value = client.name
  }
}

const confirmClientChange = () => {
  if (!newClientId.value || !selectedNewClient.value) {
    debugLog('No new client selected')
    return
  }

  localJobData.value.client_id = newClientId.value
  localJobData.value.client_name = selectedNewClient.value.name

  localJobData.value.contact_id = undefined
  localJobData.value.contact_name = undefined
  contactDisplayValue.value = ''

  resetClientChangeState()
}

const editCurrentClient = () => {
  if (!props.jobData?.client_id) {
    debugLog('No current client to edit')
    return
  }

  const url = `/clients/${props.jobData.client_id}/edit`
  window.open(url, '_blank')
}

const handleContactSelected = (contact: ClientContact | null) => {
  if (contact) {
    localJobData.value.contact_id = contact.id
    localJobData.value.contact_name = contact.name
    contactDisplayValue.value = contact.name
  } else {
    localJobData.value.contact_id = undefined
    localJobData.value.contact_name = undefined
    contactDisplayValue.value = ''
  }
}

const saveSettings = async () => {
  if (!props.jobData || !props.jobData.id) {
    debugLog('JobSettingsTab - saveSettings - Error: props.jobData or job ID is missing.')
    errorMessages.value = ['Job data is missing, cannot save.']
    return
  }
  isLoading.value = true
  errorMessages.value = []
  try {
    debugLog(
      'JobSettingsTab - saveSettings - Collecting form data:',
      JSON.parse(JSON.stringify(localJobData.value)),
    )
    const sanitizedData = sanitizeJobData(localJobData.value)

    debugLog(
      `JobSettingsTab - saveSettings - Sanitized data for job ID: ${props.jobData.id}:`,
      JSON.parse(JSON.stringify(sanitizedData)),
    )

    // Construct the complete JobDetailResponse structure
    const jobDetailResponse: JobDetailResponse = {
      success: true,
      data: {
        job: {
          ...props.jobData,
          ...sanitizedData,
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

    const result = await jobService.updateJob(props.jobData.id, jobDetailResponse)

    debugLog('JobSettingsTab - saveSettings - API call result:', JSON.parse(JSON.stringify(result)))

    if (result.success) {
      debugLog(
        'JobSettingsTab - saveSettings - API call successful. result.data:',
        JSON.parse(JSON.stringify(result.data)),
      )
      if (result.data !== null && result.data !== undefined) {
        handleSuccessfulSettingsUpdate(result.data)
      } else {
        debugLog(
          'JobSettingsTab - saveSettings - API call successful but result.data is null or undefined. Calling handleFallbackSettingsUpdate.',
        )
        const refreshedJob = await jobService.getJob(props.jobData.id)
        handleSuccessfulSettingsUpdate(refreshedJob)
      }
    } else {
      debugLog('JobSettingsTab - saveSettings - API call failed:', result.error)
      errorMessages.value.push(result.error || 'Failed to update job settings.')
    }
  } catch (e: unknown) {
    debugLog('JobSettingsTab - saveSettings - Unexpected error during save:', e)
    const errorMessage =
      e instanceof Error ? e.message : 'An unexpected error occurred while saving.'
    errorMessages.value.push(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const handleSuccessfulSettingsUpdate = (apiData: JobDetailResponse) => {
  debugLog(
    'JobSettingsTab - handleSuccessfulSettingsUpdate - About to update store with:',
    JSON.parse(JSON.stringify(apiData)),
  )
  updateJobInStore(apiData)
}

const updateJobInStore = (jobDataToStore: JobDetailResponse) => {
  // Extract the JobDetail (data) from the API response wrapper before passing to store
  if (jobDataToStore.data) {
    jobsStore.setDetailedJob(jobDataToStore.data)
    debugLog(
      `JobSettingsTab - Called jobsStore.setDetailedJob with job ID: ${jobDataToStore.data.job?.id}`,
    )
  } else {
    debugLog('🚨 JobSettingsTab - Invalid job data structure, cannot update store')
  }

  emit('job-updated', jobDataToStore)
  debugLog('JobSettingsTab - Settings saved, store updated, event emitted.')
}
</script>
