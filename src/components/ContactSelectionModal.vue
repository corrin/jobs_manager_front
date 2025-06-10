<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && $emit('close')">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Select Contact</DialogTitle>
        <DialogDescription>
          Client: <span class="font-medium">{{ clientName || 'No client selected' }}</span>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
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
              <div v-for="contact in contacts" :key="contact.id"
                class="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                :class="{ 'ring-2 ring-blue-500 bg-blue-50': selectedContact?.id === contact.id }"
                @click="selectContact(contact)">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <div class="flex items-center space-x-2">
                      <span class="font-medium text-gray-900">{{ contact.name }}</span>
                      <span v-if="contact.is_primary"
                        class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
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
                    @click.stop="selectContact(contact)">
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
                <input v-model="newContactForm.name" type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Contact name" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input v-model="newContactForm.position" type="text"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Job title/position" />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input v-model="newContactForm.phone" type="tel"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Phone number" />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input v-model="newContactForm.email" type="email"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email address" />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea v-model="newContactForm.notes" rows="2"
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes"></textarea>
              </div>

              <div class="sm:col-span-2">
                <label class="flex items-center">
                  <input v-model="newContactForm.is_primary" type="checkbox"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span class="ml-2 text-sm text-gray-700">Set as primary contact</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <button type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          @click="$emit('close')">
          Cancel
        </button>
        <button type="button"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="$emit('save-contact')" :disabled="isLoading">
          {{ isLoading ? 'Saving...' : 'Save' }}
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Users } from 'lucide-vue-next'
import type { ClientContact } from '@/composables/useClientLookup'
import type { NewContactData } from '@/composables/useContactManagement'
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
