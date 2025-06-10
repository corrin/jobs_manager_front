<template>
  <Dialog :open="isOpen" @update:open="handleDialogChange">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add New Client</DialogTitle>
        <DialogDescription>
          Create a new client. All fields except name are optional.
        </DialogDescription>
      </DialogHeader>

      <!-- Error Display -->
      <div v-if="errorMessage" class="p-3 mb-4 bg-red-50 border border-red-200 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <XCircle class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-red-800">Error creating client</p>
            <p class="mt-1 text-sm text-red-700">{{ errorMessage }}</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Client Name -->
        <div>
          <label for="clientName" class="block text-sm font-medium text-gray-700 mb-1">
            Client Name <span class="text-red-500">*</span>
          </label>
          <input
            id="clientName"
            v-model="formData.name"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': fieldErrors.name }"
            placeholder="Enter client name"
          />
          <p v-if="fieldErrors.name" class="mt-1 text-sm text-red-600">
            {{ fieldErrors.name }}
          </p>
        </div>

        <!-- Email -->
        <div>
          <label for="clientEmail" class="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="clientEmail"
            v-model="formData.email"
            type="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': fieldErrors.email }"
            placeholder="client@example.com"
          />
          <p v-if="fieldErrors.email" class="mt-1 text-sm text-red-600">
            {{ fieldErrors.email }}
          </p>
        </div>

        <!-- Phone -->
        <div>
          <label for="clientPhone" class="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            id="clientPhone"
            v-model="formData.phone"
            type="tel"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': fieldErrors.phone }"
            placeholder="Phone number"
          />
          <p v-if="fieldErrors.phone" class="mt-1 text-sm text-red-600">
            {{ fieldErrors.phone }}
          </p>
        </div>

        <!-- Address -->
        <div>
          <label for="clientAddress" class="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            id="clientAddress"
            v-model="formData.address"
            rows="2"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :class="{ 'border-red-300': fieldErrors.address }"
            placeholder="Client address"
          />
          <p v-if="fieldErrors.address" class="mt-1 text-sm text-red-600">
            {{ fieldErrors.address }}
          </p>
        </div>

        <!-- Account Customer Checkbox -->
        <div class="flex items-center">
          <input
            id="isAccountCustomer"
            v-model="formData.is_account_customer"
            type="checkbox"
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="isAccountCustomer" class="ml-2 block text-sm text-gray-700">
            Account Customer
          </label>
        </div>

        <!-- Action Buttons -->
        <DialogFooter class="gap-2">
          <Button 
            type="button" 
            variant="outline" 
            @click="handleCancel"
            :disabled="isLoading"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            :disabled="!isFormValid || isLoading"
            class="bg-blue-600 hover:bg-blue-700"
          >
            {{ isLoading ? 'Creating...' : 'Create Client' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XCircle } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { clientService } from '@/services/clientService'
import { createClientSchema, type CreateClientData, type CreateClientResponse } from '@/schemas/clientSchemas'
import type { Client } from '@/composables/useClientLookup'

// Props seguindo princípios de clean code
interface Props {
  isOpen: boolean
  initialName?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialName: ''
})

// Events
const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'client-created': [client: Client]
}>()

// Form state seguindo Zod schema
const formData = ref<CreateClientData>({
  name: '',
  email: '',
  phone: '',
  address: '',
  is_account_customer: false
})

// State management
const isLoading = ref(false)
const errorMessage = ref('')
const fieldErrors = ref<Record<string, string>>({})

// Computed properties seguindo early return pattern
const isFormValid = computed(() => {
  // Guard clause - check required fields
  if (!formData.value.name.trim()) return false
  
  // Check for validation errors
  if (Object.keys(fieldErrors.value).length > 0) return false
  
  return true
})

// Handle dialog open/close seguindo SRP
const handleDialogChange = (open: boolean) => {
  emit('update:isOpen', open)
  
  // Reset form when closing
  if (!open) {
    resetForm()
  }
}

// Form validation seguindo Zod patterns
const validateForm = (): boolean => {
  fieldErrors.value = {}
  
  try {
    createClientSchema.parse(formData.value)
    return true
  } catch (error: any) {
    // Extract Zod validation errors
    if (error.errors) {
      error.errors.forEach((err: any) => {
        const field = err.path[0]
        fieldErrors.value[field] = err.message
      })
    }
    return false
  }
}

// Submit handler seguindo early return e delegação para service layer
const handleSubmit = async () => {
  // Guard clause - validate form
  if (!validateForm()) {
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const result: CreateClientResponse = await clientService.createClient(formData.value)

    // Guard clause para erro da API
    if (!result.success) {
      throw new Error(result.error || 'Failed to create client')
    }

    // Success - emit event e fechar modal
    if (result.client) {
      const newClient: Client = {
        id: result.client.id,
        name: result.client.name,
        email: result.client.email || '',
        phone: result.client.phone || '',
        address: result.client.address || '',
        xero_contact_id: result.client.xero_contact_id || ''
      }
      
      emit('client-created', newClient)
      emit('update:isOpen', false)
    }

  } catch (error) {
    console.error('Error creating client:', error)
    errorMessage.value = error instanceof Error ? error.message : 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

// Cancel handler seguindo SRP
const handleCancel = () => {
  emit('update:isOpen', false)
}

// Reset form seguindo clean data patterns
const resetForm = () => {
  formData.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    is_account_customer: false
  }
  errorMessage.value = ''
  fieldErrors.value = {}
}

// Watch for initialName changes
watch(() => props.initialName, (newName) => {
  if (newName && props.isOpen) {
    formData.value.name = newName
  }
})

// Watch for isOpen changes to set initial name
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.initialName) {
    formData.value.name = props.initialName
  }
})
</script>
