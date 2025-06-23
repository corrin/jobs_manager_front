import { ref, computed } from 'vue'
import api from '@/plugins/axios'

export interface Client {
  id: string
  name: string
  xero_contact_id?: string
  email?: string
  phone?: string
  address?: string
}

export interface ClientContact {
  id: string
  name: string
  email?: string
  phone?: string
  position?: string
  is_primary: boolean
}

export function useClientLookup() {
  const searchQuery = ref('')
  const suggestions = ref<Client[]>([])
  const isLoading = ref(false)
  const showSuggestions = ref(false)
  const selectedClient = ref<Client | null>(null)
  const contacts = ref<ClientContact[]>([])

  const hasValidXeroId = computed(() => {
    return (
      selectedClient.value?.xero_contact_id != null && selectedClient.value.xero_contact_id !== ''
    )
  })

  const displayValue = computed(() => {
    return selectedClient.value?.name || searchQuery.value
  })

  const searchClients = async (query: string) => {
    if (query.length < 3) {
      suggestions.value = []
      showSuggestions.value = false
      return
    }

    isLoading.value = true
    try {
      const response = await api.get(`/clients/rest/search/?q=${encodeURIComponent(query)}`)

      if (!response.data || !response.data.results || !Array.isArray(response.data.results)) {
        throw new Error('Invalid response format')
      }

      suggestions.value = response.data.results
      showSuggestions.value = true
    } catch (error) {
      console.error('Error searching clients:', error)
      suggestions.value = []
      showSuggestions.value = false
    } finally {
      isLoading.value = false
    }
  }

  const selectClient = async (client: Client) => {
    selectedClient.value = client
    searchQuery.value = client.name
    showSuggestions.value = false

    contacts.value = []

    await loadClientContacts(client.id)
  }

  const loadClientContacts = async (clientId: string) => {
    try {
      const response = await api.get(`/clients/rest/${clientId}/contacts/`)

      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        contacts.value = response.data.results
      }
    } catch (error) {
      console.error('Error loading client contacts:', error)
      contacts.value = []
    }
  }

  const getPrimaryContact = (): ClientContact | null => {
    if (contacts.value.length === 0) {
      return null
    }

    const primaryContact = contacts.value.find((contact) => contact.is_primary)

    return primaryContact || contacts.value[0]
  }

  const clearSelection = () => {
    selectedClient.value = null
    searchQuery.value = ''
    suggestions.value = []
    showSuggestions.value = false
    contacts.value = []
  }

  const handleInputChange = (value: string) => {
    searchQuery.value = value

    if (selectedClient.value && selectedClient.value.name !== value) {
      selectedClient.value = null
      contacts.value = []
    }

    if (value.length >= 3) {
      searchClients(value)
    } else {
      suggestions.value = []
      showSuggestions.value = false
    }
  }

  const createNewClient = (clientName: string) => {
    console.log('Request to create new client:', clientName.trim())

    return clientName.trim()
  }

  const hideSuggestions = () => {
    showSuggestions.value = false
  }

  return {
    searchQuery,
    suggestions,
    isLoading,
    showSuggestions,
    selectedClient,
    contacts,

    hasValidXeroId,
    displayValue,

    searchClients,
    selectClient,
    loadClientContacts,
    getPrimaryContact,
    clearSelection,
    handleInputChange,
    createNewClient,
    hideSuggestions,
  }
}
