<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && closeModal()">
    <DialogContent class="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Job Settings</DialogTitle>
        <DialogDescription>
          Configure the job details and settings.
        </DialogDescription>
      </DialogHeader>

      <!-- Grid responsivo: 1 coluna mobile, 2 colunas tablet, 3 colunas desktop -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <!-- Coluna 1: Informações Básicas do Job -->
        <div class="space-y-4 md:col-span-1">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Job Information</h3>

          <!-- Nome -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Job Name
            </label>
            <input v-model="localJobData.name" type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <!-- Descrição -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea v-model="localJobData.description" rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Job description..."></textarea>
          </div>
        </div>

        <!-- Coluna 2: Informações de Cliente e Contato -->
        <div class="space-y-4 md:col-span-1">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">Client Information</h3>

          <!-- Cliente -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>

            <!-- Client Change Section -->
            <div class="space-y-2">
              <!-- Current Client Display -->
              <div v-if="!isChangingClient" class="space-y-2">
                <!-- Client Name Input -->
                <input v-model="localJobData.client_name" type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                  readonly />
                
                <!-- Action Buttons - Stack on mobile/tablet, inline on desktop -->
                <div class="flex flex-col md:flex-col xl:flex-row gap-2 xl:gap-2">
                  <button @click="startClientChange" type="button"
                    class="flex-1 xl:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-50 hover:bg-blue-100 text-blue-600">
                    Change
                  </button>
                  <button @click="editCurrentClient" type="button"
                    class="flex-1 xl:flex-none px-3 py-2 border border-gray-300 rounded-md text-sm bg-green-50 hover:bg-green-100 text-green-600">
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
                  <button @click="confirmClientChange" type="button"
                    class="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    :disabled="!newClientId">
                    Confirm Change
                  </button>
                  <button @click="cancelClientChange" type="button"
                    class="px-3 py-2 border border-gray-300 text-gray-700 rounded-md text-sm hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>

              <p class="text-xs text-gray-500">
                {{ isChangingClient ? 'Select a new client for this job' : 'Change or edit client information' }}
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
              :initial-contact-id="localJobData.contact_id"
              v-model="contactDisplayValue"
              @update:selected-contact="handleContactSelected"
            />
          </div>

          <!-- Order Number -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Order Number
            </label>
            <input v-model="localJobData.order_number" type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Customer order number" />
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
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Pricing Type
            </label>
            <select v-model="localJobData.pricing_methodology"
              class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="time_materials">Time & Materials</option>
              <option value="fixed_price">Fixed Price</option>
            </select>
          </div>

          <!-- Notes -->
          <div>
            <RichTextEditor
              v-model="localJobData.notes"
              label="Notes"
              placeholder="Internal notes..."
              :required="false"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <button @click="closeModal" type="button" :disabled="isLoading"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
          Cancel
        </button>
        <button @click="saveSettings" type="button" :disabled="isLoading"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="isLoading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
import { ref, watch, computed } from 'vue'
import type { JobData } from '@/services/jobRestService'
import { jobRestService } from '@/services/jobRestService'
import { useJobsStore } from '@/stores/jobs'
import RichTextEditor from '@/components/RichTextEditor.vue'
import ClientLookup from '@/components/ClientLookup.vue'
import ContactSelector from '@/components/ContactSelector.vue'
import type { Client, ClientContact } from '@/composables/useClientLookup'
import { toast } from 'vue-sonner'
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

// Events - apenas close, a store cuida do resto
const emit = defineEmits<{
  close: []
}>()

// Store - única fonte de verdade
const jobsStore = useJobsStore()

// Local state seguindo clean code principles - apenas para dados do form
const localJobData = ref<Partial<JobData>>({})
const isLoading = ref(false)

// Client change state
const isChangingClient = ref(false)
const newClientId = ref('')
const newClientName = ref('')
const selectedNewClient = ref<Client | null>(null)

// Contact display value for ContactSelector
const contactDisplayValue = ref('')

// Computed properties
const currentClientId = computed(() => {
  const clientId = isChangingClient.value && newClientId.value
    ? newClientId.value
    : localJobData.value.client_id || ''

  // Debug log
  console.log('JobSettingsModal - currentClientId computed:', {
    isChangingClient: isChangingClient.value,
    newClientId: newClientId.value,
    localJobDataClientId: localJobData.value.client_id,
    result: clientId
  })

  return clientId
})

const currentClientName = computed(() => {
  return isChangingClient.value && newClientName.value
    ? newClientName.value
    : localJobData.value.client_name || ''
})

// Helper functions - declared before watchers
const resetClientChangeState = () => {
  isChangingClient.value = false
  newClientId.value = ''
  newClientName.value = ''
  selectedNewClient.value = null
}

const updateContactDisplayValue = () => {
  contactDisplayValue.value = localJobData.value.contact_name || ''
}

// Watch for props changes
watch(() => props.jobData, (newJobData) => {
  console.log('JobSettingsModal - jobData changed:', newJobData)

  if (newJobData) {
    // Copy all job data
    localJobData.value = {
      ...newJobData,
      // Ensure we have client_id
      client_id: newJobData.client_id || ''
    }

    resetClientChangeState()
    updateContactDisplayValue()

    console.log('JobSettingsModal - localJobData updated:', {
      client_id: localJobData.value.client_id,
      client_name: localJobData.value.client_name,
      contact_id: localJobData.value.contact_id,
      contact_name: localJobData.value.contact_name,
      full_data: localJobData.value
    })
  }
}, { immediate: true })

// Methods seguindo SRP e early return patterns
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
  // Guard clause - verificar se novo cliente foi selecionado
  if (!newClientId.value || !selectedNewClient.value) {
    console.warn('No new client selected')
    return
  }

  // Update job data com novo cliente
  localJobData.value.client_id = newClientId.value
  localJobData.value.client_name = selectedNewClient.value.name

  // Clear contact quando client muda
  localJobData.value.contact_id = undefined
  localJobData.value.contact_name = undefined
  contactDisplayValue.value = ''

  resetClientChangeState()
}

const editCurrentClient = () => {
  // Guard clause - verificar se há cliente atual
  if (!props.jobData?.client_id) {
    console.warn('No current client to edit')
    return
  }

  // Abrir edição de cliente em nova janela
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
  // Guard clause - validação básica
  if (!props.jobData || !localJobData.value) {
    toast.error('Erro de validação', {
      description: 'Dados do job não encontrados'
    })
    return
  }

  isLoading.value = true

  try {
    // Call the job update API
    const result = await jobRestService.updateJob(props.jobData.id, localJobData.value)

    if (result.success && result.data) {
      toast.success('Job atualizado com sucesso!', {
        description: `${result.data.name} foi salvo`
      })

      // Atualizar a store - a reatividade será automática
      jobsStore.setDetailedJob(result.data)
      
      closeModal()
    } else {
      throw new Error('Failed to update job - invalid response')
    }
  } catch (error) {
    console.error('Error saving job settings:', error)

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    toast.error('Falha ao salvar job', {
      description: `Erro: ${errorMessage}. Tente novamente.`
    })
  } finally {
    isLoading.value = false
  }
}
</script>
