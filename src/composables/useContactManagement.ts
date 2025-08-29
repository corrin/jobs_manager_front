import { ref, computed } from 'vue'
import { schemas } from '@/api/generated/api'
import { api } from '@/api/client'
import { z } from 'zod'
import type { ClientContact } from '@/composables/useClientLookup'
import { debugLog } from '@/utils/debug'

type NewContactData = z.infer<typeof schemas.ClientContactCreateRequest>

/**
 * Composable for managing client contacts
 *
 * Provides functionality for loading, creating, selecting, and managing client contacts.
 * Handles modal state, form validation, and API interactions for contact management.
 *
 * @returns Object containing reactive state and methods for contact management
 */
export function useContactManagement() {
  const isModalOpen = ref(false)
  const contacts = ref<ClientContact[]>([])
  const selectedContact = ref<ClientContact | null>(null)
  const isLoading = ref(false)
  const currentClientId = ref<string>('')
  const currentClientName = ref<string>('')

  const newContactForm = ref<NewContactData>({
    name: '',
    position: '',
    email: '',
    phone: '',
    notes: '',
    is_primary: false,
  })

  const hasContacts = computed(() => contacts.value.length > 0)

  const displayValue = {
    get() {
      if (!selectedContact.value) return ''
      const contact = selectedContact.value
      const parts = [contact.name]
      if (contact.phone) parts.push(contact.phone)
      if (contact.email) parts.push(contact.email)
      return parts.join(' - ')
    },
    set(val: string) {
      // Expecting format: "name - phone - email"
      const [name, phone, email] = val.split(' - ')
      if (selectedContact.value) {
        selectedContact.value.name = name
        selectedContact.value.phone = phone || ''
        selectedContact.value.email = email || ''
      } else {
        // If no contact is selected, create a new empty one
        selectedContact.value = {
          name: name,
          phone: phone || '',
          email: email || '',
          position: '',
          notes: '',
          is_primary: false,
        }
      }
    },
  }

  /**
   * Opens the contact selection modal for a specific client
   *
   * @param clientId - The ID of the client to load contacts for
   * @param clientName - The name of the client (for display purposes)
   */
  const openModal = async (clientId: string, clientName: string) => {
    if (!clientId) {
      debugLog('Cannot open contact modal without client ID')
      return
    }

    currentClientId.value = clientId
    currentClientName.value = clientName
    isModalOpen.value = true

    resetNewContactForm()

    await loadContacts(clientId)
  }

  /**
   * Closes the contact selection modal and resets the form
   */
  const closeModal = () => {
    isModalOpen.value = false
    resetNewContactForm()
  }

  /**
   * Loads contacts for a specific client from the API
   *
   * @param clientId - The ID of the client to load contacts for
   */
  const loadContacts = async (clientId: string) => {
    if (!clientId) {
      contacts.value = []
      return
    }

    isLoading.value = true
    try {
      const response = await api.clients_contacts_retrieve({
        params: { client_id: clientId },
      })

      if (response && response.results && Array.isArray(response.results)) {
        contacts.value = response.results
      } else {
        contacts.value = []
      }
    } catch (error) {
      debugLog('Error loading contacts:', error)
      contacts.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Loads contacts for a client without opening the modal
   *
   * @param clientId - The ID of the client to load contacts for
   */
  const loadContactsOnly = async (clientId: string) => {
    await loadContacts(clientId)
  }

  /**
   * Selects an existing contact and closes the modal
   *
   * @param contact - The contact to select
   */
  const selectExistingContact = (contact: ClientContact) => {
    selectedContact.value = contact
    closeModal()
  }

  /**
   * Creates a new contact for the current client
   *
   * Automatically sets the contact as primary if it's the first contact for the client.
   * After creation, reloads the contacts list and selects the newly created contact.
   *
   * @returns Promise<boolean> - True if contact was created successfully, false otherwise
   */
  const createNewContact = async (): Promise<boolean> => {
    if (!currentClientId.value) {
      debugLog('Cannot create contact without client ID')
      return false
    }

    if (!newContactForm.value.name.trim()) {
      debugLog('Contact name is required')
      return false
    }

    isLoading.value = true

    try {
      // If this is the first contact for the client, automatically make it primary
      const shouldBePrimary = newContactForm.value.is_primary || contacts.value.length === 0

      const contactData = {
        client_id: currentClientId.value,
        name: newContactForm.value.name.trim(),
        position: newContactForm.value.position?.trim() || '',
        email: newContactForm.value.email?.trim() || '',
        phone: newContactForm.value.phone?.trim() || '',
        notes: newContactForm.value.notes?.trim() || '',
        is_primary: shouldBePrimary,
      }

      debugLog('Creating new contact:', contactData)

      const response = await api.clients_contacts_create(contactData)

      if (!response) {
        throw new Error('Invalid response from server')
      }

      // The response should be the created contact itself
      const newContact: ClientContact = response as ClientContact

      debugLog('Contact created successfully:', newContact)

      // Reload contacts first to get the updated list
      await loadContacts(currentClientId.value)

      // Then find and select the newly created contact
      const createdContact = contacts.value.find((contact) => contact.id === newContact.id)
      if (createdContact) {
        selectedContact.value = createdContact
        debugLog('New contact selected:', createdContact)
      } else {
        selectedContact.value = newContact
        debugLog('Using response contact:', newContact)
      }

      closeModal()
      return true
    } catch (error) {
      debugLog('Error creating contact:', error)
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Resets the new contact form to its initial empty state
   */
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

  /**
   * Saves the contact based on current form state
   *
   * If new contact data is provided, creates a new contact.
   * If an existing contact is selected, closes the modal.
   *
   * @returns Promise<boolean> - True if save operation was successful, false otherwise
   */
  const saveContact = async (): Promise<boolean> => {
    const hasNewContactData = newContactForm.value.name.trim().length > 0

    switch (true) {
      case hasNewContactData:
        return await createNewContact()

      case selectedContact.value !== null:
        closeModal()
        return true

      default:
        debugLog('Please select an existing contact or create a new one')
        return false
    }
  }

  /**
   * Clears the currently selected contact
   */
  const clearSelection = () => {
    selectedContact.value = null
  }

  /**
   * Updates the contacts list with new data
   *
   * @param newContacts - Array of contacts to replace the current list
   */
  const updateContactsList = (newContacts: ClientContact[]) => {
    contacts.value = newContacts
  }

  /**
   * Finds the primary contact from the current contacts list
   *
   * @returns ClientContact | null - The primary contact if found, null otherwise
   */
  const findPrimaryContact = (): ClientContact | null => {
    if (contacts.value.length === 0) {
      return null
    }

    return contacts.value.find((contact) => contact.is_primary) || null
  }

  return {
    isModalOpen,
    contacts,
    selectedContact,
    isLoading,
    currentClientName,
    newContactForm,

    hasContacts,
    displayValue,

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
