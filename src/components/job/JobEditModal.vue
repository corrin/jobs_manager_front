<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && $emit('close')">
    <DialogContent class="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Edit Job</DialogTitle>
        <DialogDescription> Edit job details, client information, and contact </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- Job Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Job Name -->
          <div class="md:col-span-2">
            <label for="jobName" class="block text-sm font-medium text-gray-700 mb-1">
              Job Name <span class="text-red-500">*</span>
            </label>
            <input
              id="jobName"
              v-model="localJobData.name"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter job name"
            />
          </div>

          <!-- Order Number -->
          <div>
            <label for="orderNumber" class="block text-sm font-medium text-gray-700 mb-1">
              Order Number
            </label>
            <input
              id="orderNumber"
              v-model="localJobData.order_number"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Customer order number"
            />
          </div>

          <!-- Status -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              v-model="localJobData.job_status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="quoting">Quoting</option>
              <option value="accepted_quote">Accepted Quote</option>
              <option value="awaiting_materials">Awaiting Materials</option>
              <option value="in_progress">In Progress</option>
              <option value="on_hold">On Hold</option>
              <option value="special">Special</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <!-- Client Section -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Client Information</h3>

          <div class="space-y-4">
            <!-- Client Selection -->
            <div>
              <ClientLookup
                id="client"
                label="Client"
                placeholder="Search for a client..."
                :required="true"
                v-model="clientDisplayName"
                @update:selected-id="handleClientChange"
                @update:selected-client="handleClientSelected"
              />

              <!-- Current Client Info -->
              <div
                v-if="localJobData.client_name && !isClientChanged"
                class="mt-2 p-3 bg-blue-50 rounded border border-blue-200"
              >
                <div class="text-sm font-medium text-blue-900">
                  Current: {{ localJobData.client_name }}
                </div>
                <div class="text-xs text-blue-700 mt-1">
                  To change client, search and select a new one above
                </div>
              </div>
            </div>

            <!-- Contact Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Contact</label>

              <div class="space-y-2">
                <!-- Current Contact Display -->
                <div class="flex space-x-2">
                  <input
                    v-model="contactDisplayName"
                    type="text"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                    readonly
                    placeholder="No contact selected"
                  />

                  <button
                    @click="handleOpenContactModal"
                    type="button"
                    class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-50 hover:bg-blue-100 text-blue-600"
                    :disabled="!currentClientId"
                  >
                    {{ localJobData.contact_name ? 'Change' : 'Select' }}
                  </button>

                  <button
                    v-if="localJobData.contact_name"
                    @click="clearContact"
                    type="button"
                    class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-red-50 hover:bg-red-100 text-red-600"
                  >
                    Clear
                  </button>
                </div>

                <p class="text-xs text-gray-500">
                  {{
                    currentClientId
                      ? 'Select or manage contacts for this client'
                      : 'Please select a client first'
                  }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Job Description -->
        <div class="border-t pt-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Job Details</h3>

          <div class="space-y-4">
            <!-- Description -->
            <div>
              <RichTextEditor
                id="description"
                label="Description (for invoice)"
                v-model="jobDescription"
                placeholder="Enter job description..."
                help-text="This description will appear on the invoice"
              />
            </div>

            <!-- Job Notes -->
            <div>
              <RichTextEditor
                id="notes"
                label="Job Notes"
                v-model="jobNotes"
                placeholder="Enter internal notes about this job..."
                help-text="Internal notes - not shown on invoice"
              />
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <button
          type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="$emit('close')"
        >
          Cancel
        </button>

        <button
          type="button"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handleSave"
          :disabled="isLoading || !isFormValid"
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

  <!-- Contact Selection Modal -->
  <ContactSelectionModal
    :is-open="showContactModal"
    :client-id="currentClientId"
    :client-name="currentClientName"
    :contacts="contacts"
    :selected-contact="selectedContact"
    :is-loading="isContactLoading"
    :new-contact-form="newContactForm"
    @close="handleCloseContactModal"
    @select-contact="handleContactSelected"
    @save-contact="handleSaveContact"
  />
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import ClientLookup from '@/components/ClientLookup.vue'
import ContactSelectionModal from '@/components/ContactSelectionModal.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { useContactManagement } from '@/composables/useContactManagement'
import { jobRestService, type JobData } from '@/services/job-rest.service'
import type { Client, ClientContact } from '@/composables/useClientLookup'
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
  'job-updated': [job: JobData]
}>()

// Local state
const localJobData = ref<Partial<JobData>>({})
const isLoading = ref(false)
const isClientChanged = ref(false)
const selectedClient = ref<Client | null>(null)

// Contact management
const {
  isModalOpen: showContactModal,
  contacts,
  selectedContact,
  isLoading: isContactLoading,
  newContactForm,
  openModal: openContactModal,
  closeModal: closeContactModal,
  selectExistingContact,
  saveContact,
} = useContactManagement()

// Computed properties
const currentClientId = computed(() => {
  return isClientChanged.value && selectedClient.value
    ? selectedClient.value.id
    : localJobData.value.client_id || ''
})

const currentClientName = computed(() => {
  return isClientChanged.value && selectedClient.value
    ? selectedClient.value.name
    : localJobData.value.client_name || ''
})

const clientDisplayName = computed({
  get: () => currentClientName.value,
  set: () => {
    // This will be handled by ClientLookup component
  },
})

const contactDisplayName = computed(() => {
  if (localJobData.value.contact_name) {
    return localJobData.value.contact_name
  }
  return ''
})

// Computeds para campos nullable para compatibilidade com RichTextEditor
const jobDescription = computed({
  get: () => localJobData.value.description || '',
  set: (value: string) => {
    localJobData.value.description = value || null
  },
})

const jobNotes = computed({
  get: () => localJobData.value.notes || '',
  set: (value: string) => {
    localJobData.value.notes = value || null
  },
})

// Form validation following SRP
const isFormValid = computed(() => {
  // Guard clause - early return if no data
  if (!localJobData.value) return false

  // Validate required fields
  const hasName = Boolean(localJobData.value.name?.trim())
  const hasClient = Boolean(localJobData.value.client_id)

  return hasName && hasClient
})

// Watch for props changes
watch(
  () => props.jobData,
  (newJobData) => {
    if (newJobData) {
      localJobData.value = { ...newJobData }
      isClientChanged.value = false
      selectedClient.value = null
    }
  },
  { immediate: true },
)

// Methods following clean code principles
const handleClientChange = (clientId: string) => {
  if (clientId !== localJobData.value.client_id) {
    isClientChanged.value = true
    localJobData.value.client_id = clientId

    // Clear contact when client changes
    clearContact()
  }
}

const handleClientSelected = (client: Client | null) => {
  selectedClient.value = client

  if (client) {
    localJobData.value.client_name = client.name
  }
}

const handleOpenContactModal = async () => {
  // Guard clause - check if client is selected
  if (!currentClientId.value) {
    console.warn('Cannot open contact modal without client')
    return
  }

  await openContactModal(currentClientId.value, currentClientName.value)
}

const handleCloseContactModal = () => {
  closeContactModal()
}

const handleContactSelected = (contact: ClientContact) => {
  localJobData.value.contact_id = contact.id
  localJobData.value.contact_name = contact.name
  selectExistingContact(contact)
}

const handleSaveContact = async () => {
  const success = await saveContact()

  if (success && selectedContact.value) {
    localJobData.value.contact_id = selectedContact.value.id
    localJobData.value.contact_name = selectedContact.value.name
  }
}

const clearContact = () => {
  localJobData.value.contact_id = undefined
  localJobData.value.contact_name = undefined
}

const handleSave = async () => {
  // Guard clause - validation
  if (!isFormValid.value || !props.jobData) {
    return
  }

  isLoading.value = true

  try {
    // Prepare update data
    const updateData = {
      name: localJobData.value.name?.trim(),
      client_id: currentClientId.value,
      contact_id: localJobData.value.contact_id || undefined,
      order_number: localJobData.value.order_number || '',
      job_status: localJobData.value.job_status,
      description: localJobData.value.description || '',
      notes: localJobData.value.notes || '',
    }

    const result = await jobRestService.updateJob(props.jobData.id, updateData)

    if (
      result.success &&
      result.data &&
      typeof result.data === 'object' &&
      'id' in result.data &&
      'job_number' in result.data
    ) {
      // Cast seguro para JobData, preenchendo campos obrigatórios
      const safeJobData: JobData = {
        id: String((result.data as { id: unknown }).id ?? ''),
        name: (result.data as { name?: string }).name ?? '',
        job_number: Number((result.data as { job_number: unknown }).job_number ?? 0),
        client_id: (result.data as { client_id?: string }).client_id ?? '',
        client_name: (result.data as { client_name?: string }).client_name ?? '',
        description: (result.data as { description?: string | null }).description ?? '',
        order_number: (result.data as { order_number?: string | null }).order_number ?? '',
        notes: (result.data as { notes?: string | null }).notes ?? '',
        contact_id: (result.data as { contact_id?: string | null }).contact_id ?? '',
        contact_name: (result.data as { contact_name?: string | null }).contact_name ?? '',
        job_status: (result.data as { job_status?: string }).job_status ?? '',
        pricing_methodology:
          (result.data as { pricing_methodology?: 'fixed_price' | 'time_materials' })
            .pricing_methodology ?? 'fixed_price',
        created_at: (result.data as { created_at?: string }).created_at ?? '',
        updated_at: (result.data as { updated_at?: string }).updated_at ?? '',
        // Campos opcionais preenchidos se existirem
        complex_job: (result.data as { complex_job?: boolean }).complex_job,
        delivery_date: (result.data as { delivery_date?: string | null }).delivery_date,
        quote_acceptance_date: (result.data as { quote_acceptance_date?: string | null })
          .quote_acceptance_date,
        quoted: (result.data as { quoted?: boolean }).quoted,
        invoiced: (result.data as { invoiced?: boolean }).invoiced,
        paid: (result.data as { paid?: boolean }).paid,
        charge_out_rate: (result.data as { charge_out_rate?: string }).charge_out_rate,
        latest_estimate_pricing: (
          result.data as { latest_estimate_pricing?: import('@/schemas/job.schemas').JobPricing }
        ).latest_estimate_pricing,
        latest_quote_pricing: (
          result.data as { latest_quote_pricing?: import('@/schemas/job.schemas').JobPricing }
        ).latest_quote_pricing,
        latest_reality_pricing: (
          result.data as { latest_reality_pricing?: import('@/schemas/job.schemas').JobPricing }
        ).latest_reality_pricing,
        latest_estimate: (
          result.data as { latest_estimate?: import('@/schemas/costing.schemas').CostSet }
        ).latest_estimate,
        latest_quote: (
          result.data as { latest_quote?: import('@/schemas/costing.schemas').CostSet }
        ).latest_quote,
        latest_actual: (
          result.data as { latest_actual?: import('@/schemas/costing.schemas').CostSet }
        ).latest_actual,
        quote_sheet: (result.data as { quote_sheet?: import('@/schemas/job.schemas').QuoteSheet })
          .quote_sheet,
        latest_pricings: (
          result.data as {
            latest_pricings?: Record<string, import('@/schemas/job.schemas').JobPricing>
          }
        ).latest_pricings,
        company_defaults: (
          result.data as { company_defaults?: import('@/schemas/job.schemas').CompanyDefaults }
        ).company_defaults,
        events: (result.data as { events?: import('@/schemas/job.schemas').JobEvent[] }).events,
      }
      emit('job-updated', safeJobData)
      emit('close')
    } else {
      throw new Error('Failed to update job')
    }
  } catch (error) {
    console.error('Error saving job:', error)
    alert('Failed to save job. Please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>
