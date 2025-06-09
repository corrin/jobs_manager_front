<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Compact Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-4xl mx-auto px-4 py-3">
        <div class="flex items-center justify-between">
          <h1 class="text-xl font-semibold text-gray-900">Create New Job</h1>
          <div class="flex space-x-3">
            <button
              type="button"
              @click="handleSave"
              :disabled="!isFormValid || isLoading"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {{ isLoading ? 'Creating...' : 'Create Job' }}
            </button>
            <button
              type="button"
              @click="$router.push('/kanban')"
              class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Form Content -->
    <div class="max-w-4xl mx-auto px-4 py-6">
      <form @submit.prevent="handleSave" class="space-y-6">
        <!-- Essential Fields Card -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Essential Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Client Selection -->
            <div class="md:col-span-2">
              <ClientLookup
                id="client"
                label="Client"
                placeholder="Search for a client..."
                :required="true"
                v-model="formData.clientName"
                @update:selected-id="formData.clientId = $event"
                @update:selected-client="handleClientSelected"
              />
            </div>

            <!-- Job Name -->
            <div class="md:col-span-2">
              <label for="jobName" class="block text-sm font-medium text-gray-700 mb-1">
                Job Name <span class="text-red-500">*</span>
              </label>
              <input
                id="jobName"
                v-model="formData.name"
                type="text"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter job name"
              />
            </div>

            <!-- Contact Selection -->
            <div class="md:col-span-2">
              <ContactSelector
                id="contact"
                label="Contact"
                :optional="true"
                :client-id="formData.clientId"
                :client-name="formData.clientName"
                v-model="formData.contactDisplay"
                @update:selected-contact="handleContactSelected"
              />
            </div>
          </div>
        </div>

        <!-- Optional Fields Card -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Additional Information</h2>
          
          <div class="space-y-6">
            <!-- Description -->
            <div>
              <RichTextEditor
                id="description"
                label="Description (for invoice)"
                v-model="formData.description"
                placeholder="Enter job description..."
                help-text="This description will appear on the invoice"
              />
            </div>

            <!-- Order Number -->
            <div>
              <label for="orderNumber" class="block text-sm font-medium text-gray-700 mb-1">
                Order Number
              </label>
              <input
                id="orderNumber"
                v-model="formData.orderNumber"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter order number (optional)"
              />
            </div>

            <!-- Job Notes -->
            <div>
              <RichTextEditor
                id="notes"
                label="Job Notes"
                v-model="formData.notes"
                placeholder="Enter internal notes about this job..."
                help-text="Internal notes - not shown on invoice"
              />
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3">
          <button
            type="button"
            @click="$router.push('/kanban')"
            class="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!isFormValid || isLoading"
            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ isLoading ? 'Creating Job...' : 'Create Job' }}
          </button>
        </div>
      </form>

      <!-- Error Message -->
      <div v-if="errorMessage" class="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <XCircle class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Error creating job</h3>
            <div class="mt-2 text-sm text-red-700">
              {{ errorMessage }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { XCircle } from 'lucide-vue-next'
import ClientLookup from '@/components/ClientLookup.vue'
import ContactSelector from '@/components/ContactSelector.vue'
import RichTextEditor from '@/components/RichTextEditor.vue'
import { jobRestService } from '@/services/jobRestService'
import type { Client, ClientContact } from '@/composables/useClientLookup'

const router = useRouter()

// Form data seguindo princípios de clean code
const formData = ref({
  name: '',
  clientId: '',
  clientName: '',
  description: '',
  orderNumber: '',
  notes: '',
  contactDisplay: '',
  contactId: ''
})

// State management
const isLoading = ref(false)
const errorMessage = ref('')
const selectedClient = ref<Client | null>(null)
const selectedContact = ref<ClientContact | null>(null)

// Computed para validação seguindo early return pattern
const isFormValid = computed(() => {
  // Guard clauses para validação
  if (!formData.value.name.trim()) return false
  if (!formData.value.clientId) return false
  
  return true
})

// Handle client selection seguindo SRP
const handleClientSelected = (client: Client | null) => {
  selectedClient.value = client
  
  // Clear contact when client changes
  if (selectedContact.value) {
    selectedContact.value = null
    formData.value.contactDisplay = ''
    formData.value.contactId = ''
  }
}

// Handle contact selection
const handleContactSelected = (contact: ClientContact | null) => {
  selectedContact.value = contact
  
  if (contact) {
    formData.value.contactId = contact.id
  } else {
    formData.value.contactId = ''
  }
}

// Save job seguindo early return e delegação para service layer
const handleSave = async () => {
  // Guard clause - validação
  if (!isFormValid.value) {
    errorMessage.value = 'Please fill in all required fields'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    // Prepare data for API seguindo clean code
    const jobData = {
      name: formData.value.name.trim(),
      client_id: formData.value.clientId,
      description: formData.value.description || '',
      order_number: formData.value.orderNumber || '',
      notes: formData.value.notes || '',
      contact_id: formData.value.contactId || undefined
    }

    const result = await jobRestService.createJob(jobData)

    // Guard clause para erro
    if (!result.success) {
      throw new Error(result.error || 'Failed to create job')
    }

    // Success - redirecionar para Job View
    if (result.job_id) {
      router.push({
        name: 'job-view',
        params: { id: result.job_id }
      })
    } else {
      // Fallback para kanban se não temos job_id
      router.push('/kanban')
    }

  } catch (error) {
    console.error('Error creating job:', error)
    errorMessage.value = error instanceof Error ? error.message : 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}
</script>
