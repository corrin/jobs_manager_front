<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && closeModal()">
    <DialogContent class="sm:max-w-6xl">
      <DialogHeader>
        <DialogTitle>Job Settings</DialogTitle>
        <DialogDescription>
          Configure the job details and settings.
        </DialogDescription>
      </DialogHeader>

      <!-- Grid com duas colunas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Coluna 1: Informações do Job -->
        <div class="space-y-4">
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

          <!-- Notes -->
          <div>
            <RichTextEditor
              v-model="localJobData.notes"
              label="Notes"
              placeholder="Internal notes..."
              :required="false"
            />
          </div>

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
        </div>

        <!-- Coluna 2: Informações Externas -->
        <div class="space-y-4">
          <h3 class="text-lg font-medium text-gray-900 border-b pb-2">External Information</h3>
          
          <!-- Cliente -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <div class="flex space-x-2">
              <input v-model="localJobData.client_name" type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                readonly />
              <button @click="editClient" type="button"
                class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-green-50 hover:bg-green-100 text-green-600">
                Edit
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">Client cannot be changed, but you can edit client details</p>
          </div>

          <!-- Contact Information -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Contact
            </label>
            <div class="flex space-x-2">
              <input v-model="contactDisplayName" type="text"
                class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                readonly
                placeholder="No contact selected" />
              <button @click="showContactModal = true" type="button"
                class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-blue-50 hover:bg-blue-100 text-blue-600">
                Select
              </button>
              <button @click="createNewContact" type="button"
                class="px-3 py-2 border border-gray-300 rounded-md text-sm bg-green-50 hover:bg-green-100 text-green-600">
                New
              </button>
            </div>
            <p class="text-xs text-gray-500 mt-1">Select existing contact or create a new one</p>
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

  <!-- Contact Selection Modal -->
  <ContactSelectionModal
    v-if="showContactModal && props.jobData?.client_id"
    :client-id="props.jobData.client_id"
    :is-open="showContactModal"
    @close="showContactModal = false"
    @contact-selected="handleContactSelected"
  />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { JobData } from '@/services/jobRestService'
import { jobRestService } from '@/services/jobRestService'
import RichTextEditor from '@/components/RichTextEditor.vue'
import ContactSelectionModal from '@/components/ContactSelectionModal.vue'
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
const showContactModal = ref(false)
const isLoading = ref(false)

// Computed display name for contact
const contactDisplayName = computed(() => {
  if (localJobData.value.contact_name) {
    return localJobData.value.contact_name
  }
  return ''
})

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

const handleContactSelected = (contact: any) => {
  localJobData.value.contact_id = contact.id
  localJobData.value.contact_name = contact.name
  showContactModal.value = false
}

const editClient = () => {
  // TODO: Implementar edição de cliente
  // Por enquanto, abrir uma nova janela para editar o cliente
  if (props.jobData?.client_id) {
    const url = `/clients/${props.jobData.client_id}/edit`
    window.open(url, '_blank')
  }
}

const createNewContact = () => {
  // TODO: Implementar criação de novo contato
  // Por enquanto, abrir modal de seleção em modo de criação
  showContactModal.value = true
}

const saveSettings = async () => {
  if (!props.jobData || !localJobData.value) return

  try {
    isLoading.value = true

    // Call the job update API
    const result = await jobRestService.updateJob(props.jobData.id, localJobData.value)

    if (result.success && result.data) {
      emit('job-updated', result.data)
      closeModal()
    } else {
      throw new Error('Failed to update job')
    }
  } catch (error) {
    console.error('Error saving job settings:', error)
    alert('Failed to save job settings. Please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>
