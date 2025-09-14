<template>
  <div class="p-4 sm:p-6 lg:px-4 lg:py-0 h-full overflow-y-auto bg-gray-50/50">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6 flex justify-between items-center">
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
                @blur="handleBlurFlush"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter job name"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                v-model="descriptionComputed"
                rows="4"
                @blur="handleBlurFlush"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Describe the job requirements and scope..."
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
              <input
                v-model="deliveryDateComputed"
                type="date"
                @blur="handleBlurFlush"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
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
                    :value="localJobData.client?.name"
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
                :client-id="localJobData.client?.id || ''"
                :client-name="localJobData.client?.name || ''"
                :initial-contact-id="null"
                v-model="contactDisplayValue"
                @update:selected-contact="handleContactSelected"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Order Number</label>
              <input
                v-model="orderNumberComputed"
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
                @blur="handleBlurFlush"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="time_materials">Time & Materials</option>
                <option value="fixed_price">Fixed Price</option>
              </select>
            </div>

            <div class="flex-grow">
              <RichTextEditor
                v-model="notesComputed"
                label="Internal Notes"
                placeholder="Add internal notes about this job..."
                :required="false"
                @blur="handleBlurFlush"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Client Edit Modal -->
    <CreateClientModal
      :is-open="showEditClientModal"
      :edit-mode="true"
      :client-id="jobData?.client.id || ''"
      :client-data="currentClientData"
      @update:is-open="showEditClientModal = $event"
      @client-created="handleClientUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { schemas } from '../../api/generated/api'
import { jobService } from '../../services/job.service'
import { useJobsStore } from '../../stores/jobs'
import { createJobAutosave } from '../../composables/useJobAutosave'
import RichTextEditor from '../RichTextEditor.vue'
import ClientLookup from '../ClientLookup.vue'
import ContactSelector from '../ContactSelector.vue'
import CreateClientModal from '../CreateClientModal.vue'
import type { Client } from '../../composables/useClientLookup'
import { debugLog } from '../../utils/debug'
import { toast } from 'vue-sonner'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card'
import { api } from '../../api/client'

type JobDetailResponse = z.infer<typeof schemas.JobDetailResponse>
type ClientContact = z.infer<typeof schemas.ClientContactResult>

// Use the existing JobHeaderResponse schema from generated API
type Job = z.infer<typeof schemas.JobHeaderResponse>

const props = defineProps<{
  jobId: string
  jobNumber: string
  pricingMethodology: string
  quoted: boolean
  fullyInvoiced: boolean
}>()

const jobsStore = useJobsStore()

const jobData = ref<Job | null>(null)

// Combined onMounted hook for all initialization
onMounted(async () => {
  if (props.jobId) {
    // Load both header and basic info in parallel
    await Promise.all([
      // Load header data
      (async () => {
        try {
          const response = await api.job_rest_jobs_header_retrieve({
            params: { job_id: props.jobId },
          })
          if (response) {
            jobData.value = response
          }
        } catch (error) {
          toast.error('Failed to load job header data')
          debugLog('Failed to load job header data:', error)
        }
      })(),
      // Load basic information
      await loadBasicInfo(),
    ])
  }

  // Load job status choices
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

// Function to load basic information
async function loadBasicInfo() {
  debugLog('Loading basic information for job ID:', props.jobId)
  basicInfoLoading.value = true
  try {
    const response = await api.job_rest_jobs_basic_info_retrieve({
      params: { job_id: props.jobId },
    })
    if (response) {
      basicInfo.value = {
        description: response.description,
        delivery_date: response.delivery_date,
        order_number: response.order_number,
        notes: response.notes,
      }
    }
  } catch (error) {
    debugLog('Failed to load basic information:', error)
  } finally {
    basicInfoLoading.value = false
  }
}

const localJobData = ref<Partial<Job>>({})
const originalJobData = ref<Partial<Job>>({}) // Original data snapshot
const errorMessages = ref<string[]>([])

// Local state for basic information
const basicInfo = ref<{
  description: string | null
  delivery_date: string | null
  order_number: string | null
  notes: string | null
} | null>(null)
const basicInfoLoading = ref(false)

const isChangingClient = ref(false)
const newClientId = ref('')
const newClientName = ref('')
const selectedNewClient = ref<Client | null>(null)

const contactDisplayValue = ref('')
const showEditClientModal = ref(false)

const jobStatusChoices = ref<{ value: string; label: string }[]>([])
const isInitializing = ref(true)

// Status choices are now loaded in the combined onMounted hook above

const currentClientData = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  is_account_customer: true,
})

const resetClientChangeState = () => {
  isChangingClient.value = false
  newClientId.value = ''
  newClientName.value = ''
  selectedNewClient.value = null
}

// Computed properties for basic info fields to handle null case
const descriptionComputed = computed({
  get: () => basicInfo.value?.description || '',
  set: (value: string) => {
    if (basicInfo.value) {
      basicInfo.value.description = value || null
    }
  },
})

const deliveryDateComputed = computed({
  get: () => basicInfo.value?.delivery_date || '',
  set: (value: string) => {
    if (basicInfo.value) {
      basicInfo.value.delivery_date = value || null
    }
  },
})

const orderNumberComputed = computed({
  get: () => basicInfo.value?.order_number || '',
  set: (value: string) => {
    if (basicInfo.value) {
      basicInfo.value.order_number = value || null
    }
  },
})

const notesComputed = computed({
  get: () => basicInfo.value?.notes || '',
  set: (value: string) => {
    if (basicInfo.value) {
      basicInfo.value.notes = value || null
    }
  },
})

watch(
  () => jobData.value,
  async (newJobData) => {
    debugLog('JobSettingsTab - jobData watcher triggered. New jobData:', newJobData)
    if (!newJobData || !newJobData.job_id) {
      debugLog(
        '🚫 JobSettingsTab - Watcher: Received null/undefined/invalid jobData, initializing with defaults.',
      )
      // Initialize with default values when jobData is null
      const defaultJobData = {
        job_id: props.jobId || '',
        job_number: props.jobNumber || '',
        name: '',
        client: null,
        contact_id: undefined,
        contact_name: undefined,
        status: '',
        pricing_methodology: props.pricingMethodology || 'time_materials',
        fully_invoiced: false,
        quoted: false,
        quote_acceptance_date: undefined,
        paid: false,
        // Include basic info fields - will be updated when basicInfo loads
        description: null,
        delivery_date: null,
        order_number: null,
        notes: null,
      }

      localJobData.value = { ...defaultJobData }
      originalJobData.value = { ...defaultJobData }
      contactDisplayValue.value = ''
      isInitializing.value = false
      return
    }
    debugLog(
      '✅ JobSettingsTab - Watcher: Received valid jobData, initializing. Job ID:',
      newJobData.job_id,
    )

    isInitializing.value = true

    // Initialize local data with proper structure matching JobHeaderResponse
    const jobDataSnapshot = {
      job_id: newJobData.job_id,
      job_number: newJobData.job_number,
      name: newJobData.name,
      client: newJobData.client,
      status: newJobData.status,
      pricing_methodology: newJobData.pricing_methodology,
      fully_invoiced: newJobData.fully_invoiced,
      quoted: newJobData.quoted,
      quote_acceptance_date: newJobData.quote_acceptance_date,
      paid: newJobData.paid,
      // Basic info fields will be updated by separate watcher
      description: null,
      delivery_date: null,
      order_number: null,
      notes: null,
    }

    localJobData.value = { ...jobDataSnapshot }
    originalJobData.value = { ...jobDataSnapshot } // Keep original snapshot

    // Load contact information using the job contacts endpoint
    try {
      const contactResponse = await api.clients_jobs_contact_retrieve({
        params: { job_id: newJobData.job_id },
      })
      if (contactResponse) {
        // The response is a single contact object
        localJobData.value.contact_id = contactResponse.id
        localJobData.value.contact_name = contactResponse.name
        contactDisplayValue.value = contactResponse.name || ''
      }
    } catch (error: unknown) {
      // Handle 404 when no contact is associated with the job - simply ignore
      const axiosError = error as { response?: { status?: number } }
      if (axiosError?.response?.status === 404) {
        debugLog('No contact associated with this job - ignoring 404')
        localJobData.value.contact_id = undefined
        localJobData.value.contact_name = undefined
        contactDisplayValue.value = ''
      } else {
        debugLog('Failed to load contact information:', error)
        contactDisplayValue.value = ''
      }
    }

    debugLog('JobSettingsTab - Local job data initialized:', localJobData.value)

    await nextTick()
    isInitializing.value = false
  },
  { immediate: true, deep: true },
)

// Separate watcher for basic info to update local data when it loads
watch(
  () => basicInfo.value,
  (newBasicInfo) => {
    if (newBasicInfo && localJobData.value) {
      localJobData.value.description = newBasicInfo.description
      localJobData.value.delivery_date = newBasicInfo.delivery_date
      localJobData.value.order_number = newBasicInfo.order_number
      localJobData.value.notes = newBasicInfo.notes
      debugLog('JobSettingsTab - Basic info updated in local data:', newBasicInfo)
    }
  },
  { immediate: true, deep: true },
)

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

  localJobData.value.client = {
    id: newClientId.value,
    name: selectedNewClient.value.name,
  }

  contactDisplayValue.value = ''

  resetClientChangeState()

  // Enqueues atomic client change + cleans contact and forces flush
  autosave.queueChanges({
    client: localJobData.value.client,
  })
  void autosave.flush('client-change')
}

const editCurrentClient = async () => {
  if (!jobData.value?.client?.id) {
    debugLog('No current client to edit')
    return
  }

  try {
    // Fetch current client data from API
    const clientDetail = await api.clients_retrieve({
      params: { client_id: jobData.value.client.id },
    })

    // Update currentClientData with fetched data
    currentClientData.value = {
      name: clientDetail.name,
      email: clientDetail.email,
      phone: clientDetail.phone,
      address: clientDetail.address,
      is_account_customer: clientDetail.is_account_customer,
    }

    showEditClientModal.value = true
  } catch (error) {
    debugLog('Error fetching client data:', error)
    toast.error('Failed to load client data for editing')
  }
}

const handleClientUpdated = (updatedClient: Client) => {
  // Update local job data with new client information
  if (localJobData.value.client) {
    localJobData.value.client.name = updatedClient.name
  }

  // Queue the change for autosave
  autosave.queueChange('client', localJobData.value.client)
  void autosave.flush('client-updated')

  toast.success('Client updated successfully')
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

  autosave.queueChanges({
    contact_id: localJobData.value.contact_id ?? null,
    contact_name: localJobData.value.contact_name ?? null,
  })
  void autosave.flush('contact-change')
}

/* ------------------------------
   Autosave integration (instance, watchers, bindings, status)
------------------------------ */

const router = useRouter()

let unbindRouteGuard: () => void = () => {}

/** Instance */
const autosave = createJobAutosave({
  jobId: props.jobId || '',
  getSnapshot: () => {
    // Returns original snapshot, not current data
    const data = originalJobData.value || {}
    return {
      id: data.id,
      job_number: data.job_number,
      name: data.name,
      client: data.client,
      contact_id: data.contact_id,
      contact_name: data.contact_name,
      job_status: data.status,
      pricing_methodology: data.pricing_methodology,
      fully_invoiced: data.fully_invoiced,
      quoted: data.quoted,
      quote_acceptance_date: data.quote_acceptance_date,
      paid: data.paid,
      description: data.description,
      order_number: data.order_number,
      notes: data.notes,
      delivery_date: data.delivery_date,
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
      if (!props.jobId) {
        return { success: false, error: 'Missing job id' }
      }

      // Mounts compatible wrapper with current service
      const mergedJob = {
        ...(jobData.value as Job),
        ...(patch as Partial<Job>),
        // Include basic info fields
        description: patch.description ?? basicInfo.value?.description ?? null,
        delivery_date: patch.delivery_date ?? basicInfo.value?.delivery_date ?? null,
        order_number: patch.order_number ?? basicInfo.value?.order_number ?? null,
        notes: patch.notes ?? basicInfo.value?.notes ?? null,
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

      const result = await jobService.updateJob(props.jobId, jobDetailResponse)
      if (result.success) {
        if (result.data?.data) {
          // Atualiza store como as abas já fazem
          // Update store like tabs already do
          jobsStore.setDetailedJob(result.data.data)

          // Updates original snapshot based on saved data
          const savedJob = result.data.data.job
          originalJobData.value = {
            id: savedJob.id,
            job_number: savedJob.job_number,
            name: savedJob.name,
            client: savedJob.client,
            contact_id: savedJob.contact_id,
            contact_name: savedJob.contact_name,
            status: savedJob.job_status,
            pricing_methodology: savedJob.pricing_methodology,
            fully_invoiced: savedJob.fully_invoiced,
            quoted: savedJob.quoted,
            quote_acceptance_date: savedJob.quote_acceptance_date,
            paid: savedJob.paid,
            description: savedJob.description,
            order_number: savedJob.order_number,
            notes: savedJob.notes,
            delivery_date: savedJob.delivery_date,
          }

          // Update basic info cache with saved data
          if (basicInfo.value) {
            basicInfo.value.description = savedJob.description
            basicInfo.value.delivery_date = savedJob.delivery_date
            basicInfo.value.order_number = savedJob.order_number
            basicInfo.value.notes = savedJob.notes
          }
        }
        // Notifies success
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

/** Life-cycle bindings */
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

/** Granular watchers to avoid reactive noise */
const enqueueIfNotInitializing = (key: string, value: unknown) => {
  if (!isInitializing.value) {
    autosave.queueChange(key, value)
  }
}

watch(
  () => localJobData.value.name,
  (v) => enqueueIfNotInitializing('name', v),
)
watch(
  () => localJobData.value.description,
  (v) => enqueueIfNotInitializing('description', v),
)
watch(
  () => localJobData.value.pricing_methodology,
  (v) => enqueueIfNotInitializing('pricing_methodology', v),
)
watch(
  () => localJobData.value.client,
  (v) => enqueueIfNotInitializing('client', v),
  { deep: true },
)
watch(
  () => localJobData.value.contact_id,
  (v) => enqueueIfNotInitializing('contact_id', v),
)
watch(
  () => localJobData.value.contact_name,
  (v) => enqueueIfNotInitializing('contact_name', v),
)
watch(
  () => localJobData.value.description,
  (v) => enqueueIfNotInitializing('description', v),
)
watch(
  () => localJobData.value.order_number,
  (v) => enqueueIfNotInitializing('order_number', v),
)
watch(
  () => localJobData.value.delivery_date,
  (v) => enqueueIfNotInitializing('delivery_date', v),
)

// Watchers for basic info computed properties
watch(
  () => descriptionComputed.value,
  (v) => enqueueIfNotInitializing('description', v),
)
watch(
  () => deliveryDateComputed.value,
  (v) => enqueueIfNotInitializing('delivery_date', v),
)
watch(
  () => orderNumberComputed.value,
  (v) => enqueueIfNotInitializing('order_number', v),
)
watch(
  () => notesComputed.value,
  (v) => enqueueIfNotInitializing('notes', v),
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
</script>
