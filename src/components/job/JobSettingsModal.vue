<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && closeModal()">
    <DialogContent class="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Job Settings</DialogTitle>
        <DialogDescription> Configure the job details and settings. </DialogDescription>
      </DialogHeader>

      <!-- Grid responsivo: 1 coluna mobile, 2 colunas tablet, 3 colunas desktop -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- Coluna 1: Informações Básicas do Job -->
        <div class="space-y-4 md:col-span-1">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Job Information</h3>

          <!-- Nome -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Job Name </label>
            <input
              v-model="localJobData.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <!-- Descrição -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Description </label>
            <textarea
              v-model="localJobData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Job description..."
            ></textarea>
          </div>
        </div>

        <!-- Coluna 2: Informações de Cliente e Contato -->
        <div class="space-y-4 md:col-span-1">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Client Information</h3>

          <!-- Cliente -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Client </label>

            <!-- Client Change Section -->
            <div class="space-y-2">
              <!-- Current Client Display -->
              <div v-if="!isChangingClient" class="space-y-2">
                <!-- Client Name Input -->
                <input
                  v-model="localJobData.client_name"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  readonly
                />

                <!-- Action Buttons - Stack on mobile/tablet, inline on desktop -->
                <div class="flex flex-col md:flex-col xl:flex-row gap-2 xl:gap-2">
                  <button
                    @click="startClientChange"
                    type="button"
                    class="flex-1 xl:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-50 hover:bg-blue-100 text-blue-600"
                  >
                    Change
                  </button>
                  <button
                    @click="editCurrentClient"
                    type="button"
                    class="flex-1 xl:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm bg-green-50 hover:bg-green-100 text-green-600"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <!-- Client Selection Mode -->
              <div v-else class="space-y-2">
                <ClientLookup
                  id="clientChange"
                  label=""
                  placeholder="Search for a new client..."
                  :required="false"
                  v-model="newClientName"
                  @update:selected-id="handleNewClientSelected"
                  @update:selected-client="handleClientLookupSelected"
                />

                <div class="flex space-x-2">
                  <button
                    @click="confirmClientChange"
                    type="button"
                    class="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    :disabled="!newClientId"
                  >
                    Confirm Change
                  </button>
                  <button
                    @click="cancelClientChange"
                    type="button"
                    class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50"
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

          <!-- Contact Information -->
          <div>
            <ContactSelector
              id="contact"
              label="Contact"
              :optional="true"
              :client-id="currentClientId"
              :client-name="currentClientName"
              :initial-contact-id="safeContactId"
              v-model="contactDisplayValue"
              @update:selected-contact="handleContactSelected"
            />
          </div>

          <!-- Order Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Order Number </label>
            <input
              v-model="localJobData.order_number"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Customer order number"
            />
          </div>
        </div>

        <!-- Coluna 3: Configurações e Notas -->
        <div class="space-y-4 md:col-span-2 xl:col-span-1">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Settings & Notes</h3>

          <!-- Toggle Itemised Pricing -->
          <div>
            <label class="flex items-center">
              <input v-model="localJobData.complex_job" type="checkbox" class="mr-2" />
              <span class="text-sm font-medium text-gray-700">Itemised Pricing</span>
            </label>
          </div>

          <!-- Pricing Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Pricing Type </label>
            <select
              v-model="localJobData.pricing_methodology"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="time_materials">Time & Materials</option>
              <option value="fixed_price">Fixed Price</option>
            </select>
          </div>

          <!-- Status do Job -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2"> Status </label>
            <select
              v-model="localJobData.status"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option v-for="status in jobStatusChoices" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>

          <!-- Notes -->
          <div>
            <RichTextEditor
              v-model="jobNotesComputed"
              label="Notes"
              placeholder="Internal notes..."
              :required="false"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <button
          @click="closeModal"
          type="button"
          :disabled="isLoading"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          @click="saveSettings"
          type="button"
          :disabled="isLoading"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <span v-else>Save</span>
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import type { JobData, JobUpdateData } from '@/services/job-rest.service'
import { jobRestService } from '@/services/job-rest.service'
import { useJobsStore } from '@/stores/jobs'
import RichTextEditor from '@/components/RichTextEditor.vue'
import ClientLookup from '@/components/ClientLookup.vue'
import ContactSelector from '@/components/ContactSelector.vue'
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

// Events – only close, the store handles the rest
const emit = defineEmits<{
  close: []
}>()

// Store – single source of truth
const jobsStore = useJobsStore()

// Local state following clean code principles – only for form data
const localJobData = ref<Partial<JobData & { status?: string }>>({})
const isLoading = ref(false)
const errorMessages = ref<string[]>([])

// Client change state
const isChangingClient = ref(false)
const newClientId = ref('')
const newClientName = ref('')
const selectedNewClient = ref<Client | null>(null)

// Contact display value for ContactSelector
const contactDisplayValue = ref('')

// Statuses fetched from backend
const jobStatusChoices = ref<{ value: string; label: string }[]>([])

onMounted(async () => {
  try {
    const statusMap = await jobRestService.getStatusValues()
    jobStatusChoices.value = Object.entries(statusMap).map(([value, label]) => ({ value, label }))
  } catch {
    // Fallback: use hardcoded values if backend fails
    jobStatusChoices.value = [
      { value: 'quoting', label: 'Quoting' },
      { value: 'accepted_quote', label: 'Accepted Quote' },
      { value: 'awaiting_materials', label: 'Awaiting Materials' },
      { value: 'awaiting_staff', label: 'Awaiting Staff' },
      { value: 'awaiting_site_availability', label: 'Awaiting Site Availability' },
      { value: 'in_progress', label: 'In Progress' },
      { value: 'on_hold', label: 'On Hold' },
      { value: 'special', label: 'Special' },
      { value: 'recently_completed', label: 'Recently Completed' },
      { value: 'completed', label: 'Completed' },
      { value: 'rejected', label: 'Rejected' },
      { value: 'archived', label: 'Archived' },
    ]
  }
})

// Computed properties
const currentClientId = computed(() => {
  const clientId =
    isChangingClient.value && newClientId.value
      ? newClientId.value
      : localJobData.value.client_id || ''

  // Debug log
  console.log('JobSettingsModal - currentClientId computed:', {
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
    : localJobData.value.client_name || ''
})

// Computed para contact_id nullable
const safeContactId = computed(() => {
  return localJobData.value.contact_id || undefined
})

// Computed para notes nullable
const jobNotesComputed = computed({
  get: () => localJobData.value.notes || '',
  set: (value: string) => {
    localJobData.value.notes = value || null
  },
})

// Helper functions – declared before watchers
const resetClientChangeState = () => {
  isChangingClient.value = false
  newClientId.value = ''
  newClientName.value = ''
  selectedNewClient.value = null
}

// Watch for props changes
watch(
  () => props.jobData,
  (newJobData) => {
    console.log('JobSettingsModal - jobData watcher triggered. New jobData:', newJobData)
    if (!newJobData) {
      console.log(
        '🚫 JobSettingsModal - Watcher: Received null/undefined jobData, skipping initialization.',
      )
      // Considere limpar localJobData ou definir um estado padrão se necessário
      // localJobData.value = {}; // Ou um estado inicial padrão
      return
    }
    console.log(
      '✅ JobSettingsModal - Watcher: Received valid jobData, initializing. ID:',
      newJobData.id,
    )
    // Certifique-se de que client_id seja tratado, mesmo que seja null/undefined inicialmente
    localJobData.value = {
      ...newJobData,
      client_id:
        newJobData.client_id === undefined || newJobData.client_id === null
          ? ''
          : newJobData.client_id,
    }
  },
  { immediate: true, deep: true },
)

/**
 * Sanitiza dados do job para compatibilidade com JobUpdateData
 * Converte valores null para undefined conforme esperado pela API
 */
const sanitizeJobData = (data: Record<string, unknown>): JobUpdateData => {
  // Guard clause – early return if no data
  if (!data) return {}

  // Converter null para undefined para campos específicos
  const sanitized: Record<string, unknown> = { ...data }

  // Lista de campos que podem ser null mas devem ser undefined na API
  const nullableFields = ['description', 'notes', 'contact_id', 'contact_name', 'order_number']

  nullableFields.forEach((field) => {
    if (sanitized[field] === null) {
      sanitized[field] = undefined
    }
  })

  // Garante que pricing_methodology sempre seja enviado corretamente
  if (
    !sanitized.pricing_methodology ||
    (sanitized.pricing_methodology !== 'fixed_price' &&
      sanitized.pricing_methodology !== 'time_materials')
  ) {
    // fallback para o valor padrão do backend se não estiver correto
    sanitized.pricing_methodology = 'time_materials'
  }

  return sanitized
}

// Methods following SRP and early return patterns
const closeModal = () => {
  emit('close')
}

// Client change methods
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
  // Guard clause – check if new client was selected
  if (!newClientId.value || !selectedNewClient.value) {
    console.warn('No new client selected')
    return
  }

  // Update job data with new client
  localJobData.value.client_id = newClientId.value
  localJobData.value.client_name = selectedNewClient.value.name

  // Clear contact when client changes
  localJobData.value.contact_id = undefined
  localJobData.value.contact_name = undefined
  contactDisplayValue.value = ''

  resetClientChangeState()
}

const editCurrentClient = () => {
  // Guard clause – check if there is a current client
  if (!props.jobData?.client_id) {
    console.warn('No current client to edit')
    return
  }

  // Open client edit in new window
  const url = `/clients/${props.jobData.client_id}/edit`
  window.open(url, '_blank')
}

// Contact methods
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
    console.error(
      'JobSettingsModal - saveSettings - Error: props.jobData or props.jobData.id is missing.',
    )
    errorMessages.value = ['Job data is missing, cannot save.']
    return
  }
  isLoading.value = true
  errorMessages.value = []
  try {
    // Sanitizar dados antes de enviar para a API
    const sanitizedData = sanitizeJobData(localJobData.value)

    // Usar JSON.parse(JSON.stringify(...)) para log é uma boa forma de ver o valor real sem referências
    console.log(
      `JobSettingsModal - saveSettings - Updating job ID: ${props.jobData.id} with data:`,
      JSON.parse(JSON.stringify(sanitizedData)),
    )
    const result = await jobRestService.updateJob(props.jobData.id, sanitizedData)
    // Log do resultado completo da API
    console.log(
      'JobSettingsModal - saveSettings - API call result:',
      JSON.parse(JSON.stringify(result)),
    )

    if (result.success) {
      // Log específico de result.data
      console.log(
        'JobSettingsModal - saveSettings - API call successful. result.data:',
        JSON.parse(JSON.stringify(result.data)),
      )
      if (result.data !== null && result.data !== undefined) {
        // Checagem mais explícita
        handleSuccessfulSettingsUpdate(result.data)
      } else {
        console.warn(
          'JobSettingsModal - saveSettings - API call successful but result.data is null or undefined. Calling handleFallbackSettingsUpdate.',
        )
        // Se handleFallbackSettingsUpdate existir e for relevante:
        // handleFallbackSettingsUpdate();
        // Se não, isso pode ser um erro ou um caso não esperado.
        errorMessages.value.push(
          'Update seemed successful, but no data was returned from the server.',
        )
        // Considere não fechar o modal ou tomar outra ação.
      }
    } else {
      console.error('JobSettingsModal - saveSettings - API call failed:', result.message)
      errorMessages.value.push(result.message || 'Failed to update job settings.')
    }
  } catch (e: unknown) {
    console.error('JobSettingsModal - saveSettings - Unexpected error during save:', e)
    const errorMessage =
      e instanceof Error ? e.message : 'An unexpected error occurred while saving.'
    errorMessages.value.push(errorMessage)
  } finally {
    isLoading.value = false
  }
}

const handleSuccessfulSettingsUpdate = (apiData: unknown) => {
  console.log(
    'JobSettingsModal - handleSuccessfulSettingsUpdate - Entry. Raw apiData:',
    JSON.parse(JSON.stringify(apiData)),
  )
  console.log(
    `JobSettingsModal - handleSuccessfulSettingsUpdate - Type of apiData: ${typeof apiData}, IsArray: ${Array.isArray(apiData)}`,
  )

  // Guard clause: Check if apiData is null or undefined
  if (apiData === null || apiData === undefined) {
    console.error(
      'JobSettingsModal - handleSuccessfulSettingsUpdate - Error: apiData is null or undefined at entry.',
    )
    return
  }

  const jobDataToStore = extractJobDataFromApiResponse(apiData)

  // Guard clause: Check if we successfully extracted job data
  if (!jobDataToStore) {
    console.error(
      'JobSettingsModal - handleSuccessfulSettingsUpdate - Error: Could not extract valid job data from API response.',
    )
    return
  }

  // Update the job store with the new data
  updateJobInStore(jobDataToStore)
}

// Helper function to extract job data from API response
const extractJobDataFromApiResponse = (apiData: unknown): Record<string, unknown> | null => {
  // Guard clause: Must be an object
  if (typeof apiData !== 'object' || apiData === null) {
    return null
  }

  const data = apiData as Record<string, unknown>

  // Path 1: apiData.job exists (e.g., { job: { id: ..., ... } })
  if (isValidJobObject(data.job)) {
    console.log(
      'JobSettingsModal - extractJobDataFromApiResponse - Path 1: Extracted from apiData.job',
    )
    return data.job as Record<string, unknown>
  }

  // Path 2: apiData.id exists (e.g., { id: ..., ... })
  if (hasValidId(data)) {
    console.log('JobSettingsModal - extractJobDataFromApiResponse - Path 2: Direct apiData object')
    return data
  }

  // Path 3: apiData.data.job exists (e.g., { data: { job: { id: ..., ... } } })
  if (isValidJobObject((data.data as Record<string, unknown>)?.job)) {
    console.log(
      'JobSettingsModal - extractJobDataFromApiResponse - Path 3: Extracted from apiData.data.job',
    )
    return (data.data as Record<string, unknown>).job as Record<string, unknown>
  }

  // Path 4: apiData is an array with valid job objects
  if (Array.isArray(apiData) && apiData.length > 0 && hasValidId(apiData[0])) {
    console.log('JobSettingsModal - extractJobDataFromApiResponse - Path 4: Array with job objects')
    return apiData[0] as Record<string, unknown>
  }

  return null
}

// Helper function to check if an object is a valid job object
const isValidJobObject = (obj: unknown): boolean => {
  return typeof obj === 'object' && obj !== null && hasValidId(obj)
}

// Helper function to check if an object has a valid ID
const hasValidId = (obj: unknown): boolean => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    (typeof (obj as Record<string, unknown>).id === 'string' ||
      typeof (obj as Record<string, unknown>).id === 'number')
  )
}

// Helper function to update job in store
const updateJobInStore = (apiData: unknown) => {
  let jobDataToStore: Partial<JobData> | undefined = undefined

  if (typeof apiData === 'object' && apiData !== null) {
    const keys = Object.keys(apiData)
    console.log(
      `JobSettingsModal - handleSuccessfulSettingsUpdate - apiData is object. Keys: ${keys.join(', ')}`,
    )

    // Path 1: apiData.job e apiData.job.id existem (ex: { job: { id: ..., ... } })
    if (
      apiData !== null &&
      typeof apiData === 'object' &&
      'job' in apiData &&
      typeof (apiData as Record<string, unknown> & { job?: Record<string, unknown> }).job ===
        'object' &&
      (apiData as Record<string, unknown> & { job?: Record<string, unknown> }).job !== null &&
      'id' in (apiData as Record<string, unknown> & { job?: Record<string, unknown> }).job!
    ) {
      console.log(
        'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 1: Extracted from apiData.job',
      )
      jobDataToStore = { ...(apiData as { job: object }).job }
      // Path 2: apiData.id existe (ex: { id: ..., ... })
    } else if ('id' in (apiData as Record<string, unknown>)) {
      console.log(
        'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 2: Extracted from apiData (root)',
      )
      jobDataToStore = { ...(apiData as object) }
      // Path 3: apiData.data e apiData.data.id existem (ex: { data: { id: ..., ... } })
    } else if (
      'data' in (apiData as Record<string, unknown>) &&
      typeof (apiData as Record<string, unknown> & { data?: Record<string, unknown> }).data ===
        'object' &&
      (apiData as Record<string, unknown> & { data?: Record<string, unknown> }).data !== null &&
      'id' in (apiData as Record<string, unknown> & { data?: Record<string, unknown> }).data!
    ) {
      console.log(
        'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 3: Extracted from apiData.data',
      )
      jobDataToStore = { ...(apiData as { data: object }).data }
      // Path 4: apiData.data.job e apiData.data.job.id existem (ex: { data: { job: { id: ..., ... } } })
    } else if (
      'data' in (apiData as Record<string, unknown>) &&
      typeof (apiData as Record<string, unknown> & { data?: { job?: Record<string, unknown> } })
        .data === 'object' &&
      (apiData as Record<string, unknown> & { data?: { job?: Record<string, unknown> } }).data !==
        null &&
      'job' in
        (apiData as Record<string, unknown> & { data?: { job?: Record<string, unknown> } }).data! &&
      (() => {
        const dataObj = (
          apiData as Record<string, unknown> & { data?: { job?: Record<string, unknown> } }
        ).data
        if (!dataObj || typeof dataObj !== 'object') return false
        const jobObj = (dataObj as { job?: Record<string, unknown> }).job
        return (
          jobObj !== undefined && jobObj !== null && typeof jobObj === 'object' && 'id' in jobObj
        )
      })()
    ) {
      console.log(
        'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 4: Extracted from apiData.data.job',
      )
      jobDataToStore = { ...(apiData as { data: { job: object } }).data.job }
    } else {
      console.warn(
        `JobSettingsModal - handleSuccessfulSettingsUpdate - Could not extract job data using standard object paths. apiData (stringified): ${JSON.stringify(apiData, null, 2)}`,
      )
    }
    // Path 5: apiData é um array, e o primeiro elemento tem um id
  } else if (
    Array.isArray(apiData) &&
    apiData.length > 0 &&
    apiData[0] &&
    typeof apiData[0] === 'object' &&
    apiData[0].id
  ) {
    console.log(
      'JobSettingsModal - handleSuccessfulSettingsUpdate - Path 5: apiData is an array, using first element.',
    )
    jobDataToStore = { ...apiData[0] }
  } else {
    // Se apiData não for um objeto ou array tratável, registre.
    console.warn(
      `JobSettingsModal - handleSuccessfulSettingsUpdate - apiData is not a processable object or array. Value: ${String(apiData)}`,
    )
  }

  // Verificação final e crucial para jobDataToStore e jobDataToStore.id
  if (!jobDataToStore || !jobDataToStore.id) {
    console.error(
      `JobSettingsModal - handleSuccessfulSettingsUpdate - FINAL ERROR: Could not derive valid jobDataToStore with an ID. jobDataToStore (stringified): ${JSON.stringify(jobDataToStore, null, 2)}. Original apiData (stringified): ${JSON.stringify(apiData, null, 2)}`,
    )
    errorMessages.value.push(
      'Failed to process server response. Job data might not be updated correctly. Check console.',
    )
    // Lançar o erro impede que o modal feche e que o estado da loja seja atualizado incorretamente.
    throw new Error(
      'Failed to process server response. Job data might not be updated correctly. Check console for details.',
    )
  } else {
    console.log(
      'JobSettingsModal - handleSuccessfulSettingsUpdate - Successfully derived jobDataToStore:',
      JSON.parse(JSON.stringify(jobDataToStore)),
    )

    // Enriquecer client_id se estiver faltando em jobDataToStore mas presente em props.jobData
    // Isso é importante se o backend não retornar todos os campos que o frontend espera manter.
    if (
      props.jobData &&
      props.jobData.client_id &&
      (jobDataToStore.client_id === undefined ||
        jobDataToStore.client_id === null ||
        jobDataToStore.client_id === '')
    ) {
      // Apenas atualize se props.jobData.client_id tiver um valor significativo
      if (props.jobData.client_id !== '') {
        console.log(
          `JobSettingsModal - Enriching client_id from props.jobData (${props.jobData.client_id}) as it was missing or empty in jobDataToStore.`,
        )
        jobDataToStore.client_id = props.jobData.client_id
      }
    } else if (
      jobDataToStore.client_id === undefined ||
      jobDataToStore.client_id === null ||
      jobDataToStore.client_id === ''
    ) {
      // Se props.jobData.client_id também não estiver disponível ou for vazio, registre um aviso.
      // O valor padrão de '' já pode ter sido definido pelo watcher ou pela inicialização.
      console.warn(
        'JobSettingsModal - jobDataToStore is missing client_id or it is empty, and props.jobData.client_id is also unavailable or empty for enrichment.',
      )
    }

    // Garantir que client_id seja uma string, mesmo que vazia, se for esperado no tipo JobData
    if (jobDataToStore.client_id === undefined || jobDataToStore.client_id === null) {
      jobDataToStore.client_id = ''
    }

    // Garantir que id seja string (nunca undefined)
    if (!jobDataToStore.id) {
      jobDataToStore.id = ''
    } else {
      jobDataToStore.id = String(jobDataToStore.id)
    }
    jobsStore.setDetailedJob(jobDataToStore as JobData)
    console.log(
      `JobSettingsModal - Called jobsStore.setDetailedJob with job ID: ${jobDataToStore.id}`,
    )
    // Store manages the data, no need to emit event
    closeModal()
    console.log(
      'JobSettingsModal - Settings saved, store updated, event emitted, and modal closed.',
    )
  }
}

// Ajustar tipagem de setDetailedJob para aceitar Partial apenas onde permitido
// Isso garante que apenas as propriedades permitidas sejam atualizadas parcialmente
defineExpose({ jobStatusChoices })
</script>
