/**
 * Contact Management Composable
 *
 * Seguindo princípios de SRP - responsabilidade única para gerenciamento de contatos.
 * Baseado no contact_management.js existente, adaptado para Vue.js.
 */

import { ref, computed } from 'vue'
import api from '@/plugins/axios'
import type { ClientContact } from '@/composables/useClientLookup'

export interface NewContactData {
  name: string
  position?: string
  email?: string
  phone?: string
  notes?: string
  is_primary: boolean
}

export function useContactManagement() {
  // State management seguindo clean code principles
  const isModalOpen = ref(false)
  const contacts = ref<ClientContact[]>([])
  const selectedContact = ref<ClientContact | null>(null)
  const isLoading = ref(false)
  const currentClientId = ref<string>('')
  const currentClientName = ref<string>('')

  // New contact form data
  const newContactForm = ref<NewContactData>({
    name: '',
    position: '',
    email: '',
    phone: '',
    notes: '',
    is_primary: false,
  })

  // Computed properties
  const hasContacts = computed(() => contacts.value.length > 0)

  const displayValue = computed(() => {
    if (!selectedContact.value) return ''

    const contact = selectedContact.value
    const parts = [contact.name]

    if (contact.phone) parts.push(contact.phone)
    if (contact.email) parts.push(contact.email)

    return parts.join(' - ')
  })

  // Open modal using an early return pattern
  const openModal = async (clientId: string, clientName: string) => {
    // Guard clause - check if the client ID is valid
    if (!clientId) {
      console.warn('Cannot open contact modal without client ID')
      return
    }

    currentClientId.value = clientId
    currentClientName.value = clientName
    isModalOpen.value = true

    // Reset form
    resetNewContactForm()

    // Load contacts
    await loadContacts(clientId)
  }

  // Close modal
  const closeModal = () => {
    isModalOpen.value = false
    resetNewContactForm()
  }

  // Load contacts for a specific client
  const loadContacts = async (clientId: string) => {
    // Guard clause
    if (!clientId) {
      contacts.value = []
      return
    }

    isLoading.value = true
    try {
      const response = await api.get(`/clients/rest/${clientId}/contacts/`)

      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        contacts.value = response.data.results
      } else {
        contacts.value = []
      }
    } catch (error) {
      console.error('Error loading contacts:', error)
      contacts.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Load contacts without opening modal
  const loadContactsOnly = async (clientId: string) => {
    await loadContacts(clientId)
  }

  // Select existing contact
  const selectExistingContact = (contact: ClientContact) => {
    selectedContact.value = contact
    closeModal()
  }

  // Create new contact using early return
  const createNewContact = async (): Promise<boolean> => {
    // Guard clauses - validation
    if (!currentClientId.value) {
      console.error('Cannot create contact without client ID')
      return false
    }

    if (!newContactForm.value.name.trim()) {
      console.error('Contact name is required')
      return false
    }

    isLoading.value = true

    try {
      const contactData = {
        client_id: currentClientId.value,
        name: newContactForm.value.name.trim(),
        position: newContactForm.value.position?.trim() || '',
        email: newContactForm.value.email?.trim() || '',
        phone: newContactForm.value.phone?.trim() || '',
        notes: newContactForm.value.notes?.trim() || '',
        is_primary: newContactForm.value.is_primary,
      }

      const response = await api.post('/clients/rest/contacts/', contactData)
      // Guard clause for an invalid response
      if (!response.data || !response.data.contact) {
        throw new Error('Invalid response from server')
      }

      const newContact: ClientContact = response.data.contact

      // Update selected contact
      selectedContact.value = newContact

      // Reload contacts list
      await loadContacts(currentClientId.value)

      closeModal()
      return true
    } catch (error) {
      console.error('Error creating contact:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  // Reset form following clean code
  const resetNewContactForm = () => {
    newContactForm.value = {
      name: '',
      position: '',
      email: '',
      phone: '',
      notes: '',
      is_primary: false,
    }
  }

  // Save contact (create new or select existing)
  const saveContact = async (): Promise<boolean> => {
    // Switch-case to decide action based on state
    const hasNewContactData = newContactForm.value.name.trim().length > 0

    switch (true) {
      case hasNewContactData:
        return await createNewContact()

      case selectedContact.value !== null:
        closeModal()
        return true

      default:
        console.warn('Please select an existing contact or create a new one')
        return false
    }
  }

  // Clear selection
  const clearSelection = () => {
    selectedContact.value = null
  }

  // Update contacts list (for external use)
  const updateContactsList = (newContacts: ClientContact[]) => {
    contacts.value = newContacts
  }

  // Find primary contact
  const findPrimaryContact = (): ClientContact | null => {
    // Early return if there are no contacts
    if (contacts.value.length === 0) {
      return null
    }

    return contacts.value.find((contact) => contact.is_primary) || null
  }

  return {
    // State
    isModalOpen,
    contacts,
    selectedContact,
    isLoading,
    currentClientName,
    newContactForm,

    // Computed
    hasContacts,
    displayValue,

    // Methods
    openModal,
    closeModal,
    loadContacts,
    loadContactsOnly,
    selectExistingContact,
    createNewContact,
    saveContact,
    clearSelection,
    updateContactsList,
    findPrimaryContact,
    resetNewContactForm,
  }
}
