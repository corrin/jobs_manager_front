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
                v-model="localJobData.description"
                rows="4"
                @input="handleFieldInput('description', $event.target.value)"
                @blur="handleFieldBlur"
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Describe the job requirements and scope..."
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Date</label>
              <input
                v-model="localJobData.delivery_date"
                type="date"
                @input="handleFieldInput('delivery_date', $event.target.value)"
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
                :initial-contact-id="localJobData.contact_id"
                v-model="contactDisplayValue"
                @update:selected-contact="handleContactSelected"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Order Number</label>
              <input
                v-model="localJobData.order_number"
                type="text"
                @input="handleFieldInput('order_number', $event.target.value)"
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
                v-model="localJobData.notes"
                label="Internal Notes"
                placeholder="Add internal notes about this job..."
                :required="false"
                @blur="handleFieldBlur"
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

type ClientContact = z.infer<typeof schemas.JobContactUpdateRequest>

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
const jobHeader = computed(() => jobsStore.headersById[props.jobId] ?? null)

const jobData = ref<Job | null>(null)

// Combined onMounted hook for all initialization
onMounted(async () => {
  // Keep isInitializing true until full loading is done
  await Promise.all([
    // Load job data if jobId exists
    (async () => {
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
          loadBasicInfo(),
        ])
      }
    })(),

    // Load job status choices
    (async () => {
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
    })(),
  ])

  // Only set isInitializing to false after all loading is complete
  isInitializing.value = false
})

// Function to load basic information
async function loadBasicInfo() {
  basicInfoLoading.value = true
  try {
    const basicInfo = await jobsStore.loadBasicInfo(props.jobId)

    // Force update local data immediately after loading
    if (basicInfo && localJobData.value) {
      isHydratingBasicInfo.value = true

      // Only update fields that are empty or don't have user input, and server has data
      if (
        (!localJobData.value.description || !localJobData.value.description.trim()) &&
        basicInfo.description !== undefined
      ) {
        localJobData.value.description = basicInfo.description || ''
      }
      if (
        (!localJobData.value.delivery_date || !localJobData.value.delivery_date.trim()) &&
        basicInfo.delivery_date !== undefined
      ) {
        localJobData.value.delivery_date = basicInfo.delivery_date || ''
      }
      if (
        (!localJobData.value.order_number || !localJobData.value.order_number.trim()) &&
        basicInfo.order_number !== undefined
      ) {
        localJobData.value.order_number = basicInfo.order_number || ''
      }
      if (
        (!localJobData.value.notes || !localJobData.value.notes.trim()) &&
        basicInfo.notes !== undefined
      ) {
        localJobData.value.notes = basicInfo.notes || ''
      }

      // Force reactivity update
      localJobData.value = { ...localJobData.value }

      // Update original snapshot for diff
      originalJobData.value.description = localJobData.value.description ?? ''
      originalJobData.value.delivery_date = localJobData.value.delivery_date ?? ''
      originalJobData.value.order_number = localJobData.value.order_number ?? ''
      originalJobData.value.notes = localJobData.value.notes ?? ''
    }

    // Also update the detailed job in store if it exists
    const existingDetail = jobsStore.getJobById(props.jobId)
    if (basicInfo && existingDetail) {
      jobsStore.updateDetailedJob(props.jobId, {
        job: {
          ...existingDetail.job,
          description: basicInfo.description || null,
          delivery_date: basicInfo.delivery_date || null,
          order_number: basicInfo.order_number || null,
          notes: basicInfo.notes || null,
        },
      })
    }
  } catch (e) {
    debugLog('Failed to load basic job information: ', e)
  } finally {
    isHydratingBasicInfo.value = false
    basicInfoLoading.value = false
    basicInfoHydrated.value = true
  }
}

const localJobData = ref<Partial<Job>>({})
const originalJobData = ref<Partial<Job>>({}) // Original data snapshot
const errorMessages = ref<string[]>([])

// Data readiness check for autosave
const dataReady = computed(
  () =>
    !isInitializing.value &&
    !basicInfoLoading.value &&
    !!localJobData.value?.job_id &&
    basicInfoHydrated.value,
)

// Use store for basic information
const basicInfo = computed(() => {
  return jobsStore.getBasicInfoById(props.jobId)
})
const basicInfoLoading = ref(false)

const isChangingClient = ref(false)
const newClientId = ref('')
const newClientName = ref('')
const selectedNewClient = ref<Client | null>(null)

const contactDisplayValue = ref('')
const showEditClientModal = ref(false)

const jobStatusChoices = ref<{ value: string; label: string }[]>([])
const isInitializing = ref(true)
const isSyncingFromStore = ref(false)

// Readiness flags for preventing premature saves
const basicInfoHydrated = ref(false)
const isHydratingBasicInfo = ref(false)

// Notification debouncing
const lastNotificationTime = ref(0)
const NOTIFICATION_DEBOUNCE_MS = 3000 // 3 seconds minimum between notifications

// Typing state tracking to prevent interruption
const isUserTyping = ref(false)
const typingTimeout = ref<NodeJS.Timeout | null>(null)
const TYPING_TIMEOUT_MS = 1000 // Consider user stopped typing after 1 second

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

// Handle field input changes
const handleFieldInput = (field: string, value: string) => {
  if (!localJobData.value) return

  const newValue = value || ''

  // Mark user as actively typing
  isUserTyping.value = true

  // Clear existing timeout
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

  // Set timeout to mark typing as stopped
  typingTimeout.value = setTimeout(() => {
    isUserTyping.value = false
  }, TYPING_TIMEOUT_MS)

  // Type-safe field assignment
  if (field === 'description') {
    localJobData.value.description = newValue
  } else if (field === 'delivery_date') {
    localJobData.value.delivery_date = newValue
  } else if (field === 'order_number') {
    localJobData.value.order_number = newValue
  } else if (field === 'notes') {
    localJobData.value.notes = newValue
  }

  // Update store for persistence
  if (props.jobId) {
    jobsStore.updateBasicInfo(props.jobId, { [field]: newValue })
  }

  // Queue autosave change
  if (!isInitializing.value) {
    autosave.queueChange(field, newValue)
  }
}

watch(
  () => jobData.value,
  async (newJobData) => {
    if (!newJobData || !newJobData.job_id) {
      // Initialize with default values when jobData is null
      const defaultJobData = {
        job_id: props.jobId || '',
        job_number: props.jobNumber ? Number(props.jobNumber) : 0,
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
        rejected_flag: false,
        // Include basic info fields - will be updated when basicInfo loads
        description: '',
        delivery_date: '',
        order_number: '',
        notes: '',
      }

      localJobData.value = { ...defaultJobData }
      originalJobData.value = { ...defaultJobData }
      contactDisplayValue.value = ''
      return
    }
    // Received valid jobData, initializing

    isInitializing.value = true

    // Initialize local data with proper structure matching JobHeaderResponse
    const jobDataSnapshot = {
      job_id: newJobData.job_id,
      job_number: Number(newJobData.job_number),
      name: newJobData.name,
      client: newJobData.client,
      status: newJobData.status,
      pricing_methodology: newJobData.pricing_methodology,
      fully_invoiced: newJobData.fully_invoiced,
      quoted: newJobData.quoted,
      quote_acceptance_date: newJobData.quote_acceptance_date,
      paid: newJobData.paid,
    }

    // Preserve existing basic info fields when updating with header data
    localJobData.value = {
      ...jobDataSnapshot,
      description: localJobData.value?.description ?? '',
      delivery_date: localJobData.value?.delivery_date ?? '',
      order_number: localJobData.value?.order_number ?? '',
      notes: localJobData.value?.notes ?? '',
    }

    // Keep original snapshot with current state
    originalJobData.value = { ...localJobData.value }

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

    await nextTick()
  },
  { immediate: true, deep: true },
)

// Separate watcher for basic info to update local data when it loads
watch(
  () => basicInfo.value,
  (newBasicInfo) => {
    if (newBasicInfo && localJobData.value && !isHydratingBasicInfo.value) {
      // Don't update text fields if user is actively typing
      if (isUserTyping.value) {
        return
      }

      // Always update from server data if we have it, but preserve user input if they started typing
      const hasUserInput =
        (localJobData.value.description && localJobData.value.description.trim()) ||
        (localJobData.value.delivery_date && localJobData.value.delivery_date.trim()) ||
        (localJobData.value.order_number && localJobData.value.order_number.trim()) ||
        (localJobData.value.notes && localJobData.value.notes.trim())

      if (!hasUserInput) {
        // No user input yet, safe to update from server
        if (newBasicInfo.description !== undefined) {
          localJobData.value.description = newBasicInfo.description || ''
        }
        if (newBasicInfo.delivery_date !== undefined) {
          localJobData.value.delivery_date = newBasicInfo.delivery_date || ''
        }
        if (newBasicInfo.order_number !== undefined) {
          localJobData.value.order_number = newBasicInfo.order_number || ''
        }
        if (newBasicInfo.notes !== undefined) {
          localJobData.value.notes = newBasicInfo.notes || ''
        }
      } else {
        // User has input, only update fields that are still empty and server has data
        if (
          !localJobData.value.description &&
          newBasicInfo.description !== undefined &&
          newBasicInfo.description
        ) {
          localJobData.value.description = newBasicInfo.description
        }
        if (
          !localJobData.value.delivery_date &&
          newBasicInfo.delivery_date !== undefined &&
          newBasicInfo.delivery_date
        ) {
          localJobData.value.delivery_date = newBasicInfo.delivery_date
        }
        if (
          !localJobData.value.order_number &&
          newBasicInfo.order_number !== undefined &&
          newBasicInfo.order_number
        ) {
          localJobData.value.order_number = newBasicInfo.order_number
        }
        if (!localJobData.value.notes && newBasicInfo.notes !== undefined && newBasicInfo.notes) {
          localJobData.value.notes = newBasicInfo.notes
        }
      }
    }

    // Sincroniza snapshot original para o diff pós-hidratação
    if (!isHydratingBasicInfo.value) {
      originalJobData.value.description = localJobData.value?.description ?? ''
      originalJobData.value.delivery_date = localJobData.value?.delivery_date ?? ''
      originalJobData.value.order_number = localJobData.value?.order_number ?? ''
      originalJobData.value.notes = localJobData.value?.notes ?? ''
    }
  },
  { immediate: true, deep: true },
)

// Watcher for store header changes to sync with header edits
watch(
  () => jobHeader.value,
  (newHeader) => {
    if (newHeader && localJobData.value && !isInitializing.value) {
      // Prevent field watchers from triggering during sync
      isSyncingFromStore.value = true

      // Preserve existing basic info fields to prevent overwriting
      const preservedBasicInfo = {
        description: localJobData.value.description,
        delivery_date: localJobData.value.delivery_date,
        order_number: localJobData.value.order_number,
        notes: localJobData.value.notes,
      }

      // Update local data when header changes (e.g., from inline edits)
      // IMPORTANT: Don't update basic info fields as they're managed separately
      localJobData.value.name = newHeader.name
      localJobData.value.client = newHeader.client
      localJobData.value.status = newHeader.status
      localJobData.value.pricing_methodology = newHeader.pricing_methodology
      localJobData.value.quoted = newHeader.quoted
      localJobData.value.fully_invoiced = newHeader.fully_invoiced
      localJobData.value.paid = newHeader.paid

      // Restore preserved basic info fields
      localJobData.value.description = preservedBasicInfo.description
      localJobData.value.delivery_date = preservedBasicInfo.delivery_date
      localJobData.value.order_number = preservedBasicInfo.order_number
      localJobData.value.notes = preservedBasicInfo.notes

      // Header updated from store

      // Allow field watchers to trigger again
      nextTick(() => {
        isSyncingFromStore.value = false
      })
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

  // Send client_id and clear contact
  autosave.queueChanges({
    client_id: localJobData.value.client?.id ?? null,
    contact_id: null,
  })
  void autosave.flush('client-change')

  // Update header immediately for instant reactivity
  if (jobHeader.value) {
    jobsStore.patchHeader(jobHeader.value.job_id, {
      client: {
        id: localJobData.value.client?.id ?? '',
        name: localJobData.value.client?.name ?? '',
      },
    })
  }
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

const handleContactSelected = async (contact: ClientContact | null) => {
  if (contact) {
    localJobData.value.contact_id = contact.id
    localJobData.value.contact_name = contact.name
    contactDisplayValue.value = contact.name

    // Ensure all fields are present for Zod validation (convert undefined to null)
    const contactToSend = {
      id: contact.id,
      name: contact.name,
      email: contact.email ?? null,
      phone: contact.phone ?? null,
      position: contact.position ?? null,
      notes: contact.notes ?? null,
      is_primary: contact.is_primary,
    }

    // Save contact directly (not through header autosave)
    try {
      await api.clients_jobs_contact_update(contactToSend, {
        params: { job_id: props.jobId },
      })
      toast.success('Contact updated successfully')
    } catch (error) {
      toast.error('Failed to update contact')
      debugLog('Failed to update contact:', error)
    }
  } else {
    // Clear contact locally - no API call needed since clearing means no contact association
    localJobData.value.contact_id = undefined
    localJobData.value.contact_name = undefined
    contactDisplayValue.value = ''
  }
}

/* ------------------------------
   Autosave integration (instance, watchers, bindings, status)
------------------------------ */

const router = useRouter()

let unbindRouteGuard: () => void = () => {}

/** Instance */
const autosave = createJobAutosave({
  jobId: props.jobId || '',
  debounceMs: 2000, // Increased debounce for text fields to prevent interruption
  canSave: () => dataReady.value, // barreira de prontidão
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
      description: data.description || '',
      order_number: data.order_number || '',
      notes: data.notes || '',
      delivery_date: data.delivery_date || '',
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

      // Build payload strictly from the queued patch
      const normalise = (k: string, v: unknown) => {
        if (typeof v === 'string') {
          const t = v.trim()
          return t === '' ? null : t
        }
        return v
      }

      const partialPayload: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(patch)) {
        if (k === 'client_name' || k === 'contact_name') continue // derived, don't send
        partialPayload[k] = normalise(k, v)
      }

      if (Object.keys(partialPayload).length === 0) return { success: true }

      // Use the partial update method (similar to useJobHeaderAutosave)
      const result = await jobService.updateJobHeaderPartial(props.jobId, partialPayload)
      if (result.success) {
        // Update local snapshot ONLY for keys sent
        const apply = (base: Partial<Job>, p: Record<string, unknown>) => {
          const next = { ...base }
          if ('name' in p) next.name = p.name as string
          if ('job_status' in p) next.status = String(p.job_status)
          if ('pricing_methodology' in p) next.pricing_methodology = p.pricing_methodology as string
          if ('quoted' in p) next.quoted = !!p.quoted
          if ('fully_invoiced' in p) next.fully_invoiced = !!p.fully_invoiced
          if ('paid' in p) next.paid = !!p.paid
          if ('rejected_flag' in p) next.rejected_flag = !!p.rejected_flag
          if ('quote_acceptance_date' in p)
            next.quote_acceptance_date = (p.quote_acceptance_date as string | null) ?? undefined
          if ('client_id' in p) {
            next.client = {
              id: (p.client_id as string | null) ?? next.client?.id ?? '',
              name: next.client?.name ?? '',
            }
          }
          if ('description' in p) next.description = (p.description as string | null) ?? ''
          if ('delivery_date' in p) next.delivery_date = (p.delivery_date as string | null) ?? ''
          if ('order_number' in p) next.order_number = (p.order_number as string | null) ?? ''
          if ('notes' in p) next.notes = (p.notes as string | null) ?? ''
          return next
        }
        originalJobData.value = apply(originalJobData.value, partialPayload)
        // Update ONLY header fields in store
        const headerPatch: Partial<Job> = {}
        if ('name' in partialPayload) headerPatch.name = partialPayload.name as string
        if ('job_status' in partialPayload) headerPatch.status = String(partialPayload.job_status)
        if ('pricing_methodology' in partialPayload)
          headerPatch.pricing_methodology = partialPayload.pricing_methodology as string
        if ('quoted' in partialPayload) headerPatch.quoted = !!partialPayload.quoted
        if ('fully_invoiced' in partialPayload)
          headerPatch.fully_invoiced = !!partialPayload.fully_invoiced
        if ('paid' in partialPayload) headerPatch.paid = !!partialPayload.paid
        if ('quote_acceptance_date' in partialPayload)
          headerPatch.quote_acceptance_date =
            (partialPayload.quote_acceptance_date as string | null) ?? undefined
        if ('client_id' in partialPayload) {
          headerPatch.client = {
            id: (partialPayload.client_id as string | null) ?? '',
            name: originalJobData.value.client?.name ?? '',
          }
        }
        if (Object.keys(headerPatch).length && props.jobId) {
          jobsStore.patchHeader(props.jobId, headerPatch)
        }

        // Update basic infos in store with local values
        if (props.jobId) {
          const desc =
            typeof originalJobData.value.description === 'string'
              ? originalJobData.value.description.trim()
              : null
          const delDate =
            typeof originalJobData.value.delivery_date === 'string'
              ? originalJobData.value.delivery_date.trim()
              : null
          const ordNum =
            typeof originalJobData.value.order_number === 'string'
              ? originalJobData.value.order_number.trim()
              : null
          const notes =
            typeof originalJobData.value.notes === 'string'
              ? originalJobData.value.notes.trim()
              : null

          jobsStore.updateBasicInfo(props.jobId, {
            description: desc || null,
            delivery_date: delDate || null,
            order_number: ordNum || null,
            notes: notes || null,
          })

          // Update detailed job using explicit id (no global current job)
          const existingDetailCurrent = jobsStore.getJobById(props.jobId)
          if (existingDetailCurrent) {
            jobsStore.updateDetailedJob(props.jobId, {
              job: {
                ...existingDetailCurrent.job,
                description: desc || null,
                delivery_date: delDate || null,
                order_number: ordNum || null,
                notes: notes || null,
              },
            })
          }
        }

        // Save successful

        // Debounced success notification
        const now = Date.now()
        if (now - lastNotificationTime.value >= NOTIFICATION_DEBOUNCE_MS) {
          toast.success('Job updated successfully')
          lastNotificationTime.value = now
        }

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
    beforeEach: (to, from, next) => router.beforeEach(to, from, next),
  })
})

onUnmounted(() => {
  // Clear typing timeout to prevent memory leaks
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
  }

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
  (v) => {
    if (!isSyncingFromStore.value) {
      enqueueIfNotInitializing('name', v)
      // Sync with store for immediate reactivity
      if (jobHeader.value) {
        jobsStore.patchHeader(jobHeader.value.job_id, { name: v ?? '' })
      }
    }
  },
)
watch(
  () => localJobData.value.pricing_methodology,
  (v) => {
    if (!isSyncingFromStore.value) {
      enqueueIfNotInitializing('pricing_methodology', v)
    }
  },
)
watch(
  () => localJobData.value.client,
  (v) => {
    if (!isSyncingFromStore.value) {
      enqueueIfNotInitializing('client_id', v?.id ?? null)
    }
  },
  { deep: true },
)

// Watchers for basic info fields
watch(
  () => localJobData.value?.description,
  (v) => {
    if (!isSyncingFromStore.value && !isInitializing.value && !isHydratingBasicInfo.value) {
      enqueueIfNotInitializing('description', v)
    }
  },
)
watch(
  () => localJobData.value?.delivery_date,
  (v) => {
    if (!isSyncingFromStore.value && !isInitializing.value && !isHydratingBasicInfo.value) {
      enqueueIfNotInitializing('delivery_date', v)
    }
  },
)
watch(
  () => localJobData.value?.order_number,
  (v) => {
    if (!isSyncingFromStore.value && !isInitializing.value && !isHydratingBasicInfo.value) {
      enqueueIfNotInitializing('order_number', v)
    }
  },
)
watch(
  () => localJobData.value?.notes,
  (v) => {
    if (!isSyncingFromStore.value && !isInitializing.value && !isHydratingBasicInfo.value) {
      enqueueIfNotInitializing('notes', v)
    }
  },
)

/** UI helpers */
const handleBlurFlush = () => {
  void autosave.flush()
}

const handleFieldBlur = () => {
  // Clear typing state when field loses focus
  isUserTyping.value = false
  if (typingTimeout.value) {
    clearTimeout(typingTimeout.value)
    typingTimeout.value = null
  }
  // Trigger save
  void autosave.flush()
}

const retrySave = () => {
  void autosave.flush()
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
