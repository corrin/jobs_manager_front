<template>
  <div>
    <label :for="id" class="block text-sm font-medium text-gray-700 mb-1">
      {{ label }}
      <span v-if="!optional" class="text-red-500">*</span>
      <span v-else class="text-gray-500 text-xs">(Optional)</span>
    </label>

    <div class="flex space-x-2">
      <div class="flex-1">
        <input
          :id="id"
          v-model="displayValue"
          type="text"
          :placeholder="placeholder"
          readonly
          class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          @click="handleOpenModal"
        />
      </div>

      <button
        type="button"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        @click="handleOpenModal"
        :disabled="!clientId"
      >
        <Users class="w-4 h-4" />
      </button>

      <button
        v-if="selectedContact"
        type="button"
        class="px-2 py-2 text-gray-400 hover:text-red-600 transition-colors"
        @click="clearSelection"
        title="Clear selection"
      >
        <X class="w-4 h-4" />
      </button>
    </div>

    <p v-if="!clientId" class="mt-1 text-xs text-gray-500">Please select a client first</p>
  </div>

  <ContactSelectionModal
    :is-open="isModalOpen"
    :client-id="clientId"
    :client-name="clientName"
    :contacts="contacts"
    :selected-contact="selectedContact"
    :is-loading="isLoading"
    :new-contact-form="newContactForm"
    @close="closeModal"
    @select-contact="selectExistingContact"
    @save-contact="handleSaveContact"
  />
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { Users, X } from 'lucide-vue-next'
import { useContactManagement } from '@/composables/useContactManagement'
import ContactSelectionModal from './ContactSelectionModal.vue'
import type { ClientContact } from '@/composables/useClientLookup'

interface Props {
  id: string
  label: string
  placeholder?: string
  optional?: boolean
  clientId: string
  clientName: string
  modelValue?: string
  initialContactId?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'No contact selected',
  optional: true,
  modelValue: '',
  initialContactId: '',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:selectedContact': [contact: ClientContact | null]
}>()

const {
  isModalOpen,
  contacts,
  selectedContact,
  isLoading,
  newContactForm,
  displayValue,
  openModal,
  closeModal,
  loadContactsOnly,
  selectExistingContact: selectFromComposable,
  saveContact,
  clearSelection: clearFromComposable,
} = useContactManagement()

const handleOpenModal = async () => {
  console.log('ContactSelector - handleOpenModal called:', {
    clientId: props.clientId,
    clientName: props.clientName,
    initialContactId: props.initialContactId,
  })

  if (!props.clientId) {
    console.warn('Cannot open contact modal without client')
    return
  }

  await openModal(props.clientId, props.clientName)
}

const selectExistingContact = (contact: ClientContact) => {
  selectFromComposable(contact)
  emitUpdates()
}

const handleSaveContact = async () => {
  const success = await saveContact()
  if (success) {
    emitUpdates()
  }
}

const clearSelection = () => {
  clearFromComposable()
  emitUpdates()
}

const emitUpdates = () => {
  emit('update:modelValue', displayValue.value)
  emit('update:selectedContact', selectedContact.value)
}

watch(selectedContact, () => {
  emitUpdates()
})

watch(
  () => props.clientId,
  (newClientId, oldClientId) => {
    if (newClientId !== oldClientId) {
      clearSelection()
    }
  },
)

watch(
  () => [props.clientId, props.initialContactId],
  async ([clientId, contactId]) => {
    if (clientId && contactId && contacts.value.length === 0) {
      await loadContactsOnly(clientId)

      const initialContact = contacts.value.find((contact) => contact.id === contactId)
      if (initialContact) {
        selectFromComposable(initialContact)
      }
    }
  },
  { immediate: true },
)
</script>
