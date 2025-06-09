<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 overflow-y-auto"
    @click.self="$emit('close')"
  >
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Overlay -->
      <div
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal -->
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
        <!-- Header -->
        <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-2">
                Select Contact
              </h3>
              <p class="text-sm text-gray-600 mb-4">
                Client: <span class="font-medium">{{ clientName || 'No client selected' }}</span>
              </p>

              <!-- Loading State -->
              <div v-if="isLoading" class="text-center py-8">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p class="mt-2 text-sm text-gray-500">Loading contacts...</p>
              </div>

              <!-- Content when not loading -->
              <div v-else>
                <!-- Existing Contacts List -->
                <div v-if="contacts.length > 0" class="mb-6">
                  <h4 class="text-sm font-medium text-gray-900 mb-3">Existing Contacts</h4>
                  <div class="space-y-2 max-h-40 overflow-y-auto">
                    <div
                      v-for="contact in contacts"
                      :key="contact.id"
                      class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      :class="{ 'ring-2 ring-blue-500 bg-blue-50': selectedContact?.id === contact.id }"
                      @click="selectContact(contact)"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex-1">
                          <div class="flex items-center space-x-2">
                            <span class="font-medium text-gray-900">{{ contact.name }}</span>
                            <span
                              v-if="contact.is_primary"
                              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800"
                            >
                              Primary
                            </span>
                          </div>
                          <div v-if="contact.position" class="text-sm text-gray-600">{{ contact.position }}</div>
                          <div class="text-sm text-gray-500 space-x-2">
                            <span v-if="contact.email">{{ contact.email }}</span>
                            <span v-if="contact.phone">{{ contact.phone }}</span>
                          </div>
                        </div>
                        <button
                          class="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                          @click.stop="selectContact(contact)"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- No contacts message -->
                <div v-else class="text-center py-4 text-gray-500">
                  <Users class="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No contacts found for this client</p>
                </div>

                <!-- Create New Contact Form -->
                <div class="border-t pt-4">
                  <h4 class="text-sm font-medium text-gray-900 mb-3">Create New Contact</h4>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">
                        Name <span class="text-red-500">*</span>
                      </label>
                      <input
                        v-model="newContactForm.name"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Contact name"
                      />
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input
                        v-model="newContactForm.position"
                        type="text"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Job title/position"
                      />
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        v-model="newContactForm.phone"
                        type="tel"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Phone number"
                      />
                    </div>
                    
                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        v-model="newContactForm.email"
                        type="email"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Email address"
                      />
                    </div>
                    
                    <div class="sm:col-span-2">
                      <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <textarea
                        v-model="newContactForm.notes"
                        rows="2"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Additional notes"
                      ></textarea>
                    </div>
                    
                    <div class="sm:col-span-2">
                      <label class="flex items-center">
                        <input
                          v-model="newContactForm.is_primary"
                          type="checkbox"
                          class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span class="ml-2 text-sm text-gray-700">Set as primary contact</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            @click="$emit('save-contact')"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Saving...' : 'Save' }}
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            @click="$emit('close')"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Users } from 'lucide-vue-next'
import type { ClientContact } from '@/composables/useClientLookup'
import type { NewContactData } from '@/composables/useContactManagement'

// Props
interface Props {
  isOpen: boolean
  clientId: string
  clientName: string
  contacts: ClientContact[]
  selectedContact: ClientContact | null
  isLoading: boolean
  newContactForm: NewContactData
}

defineProps<Props>()

// Events
const emit = defineEmits<{
  close: []
  'select-contact': [contact: ClientContact]
  'save-contact': []
}>()

// Methods seguindo clean code principles
const selectContact = (contact: ClientContact) => {
  emit('select-contact', contact)
}
</script>
