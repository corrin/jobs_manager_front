/**
 * Client Lookup Composable
 * 
 * Seguindo os princípios de SRP - responsabilidade única para busca e seleção de clientes.
 * Baseado no client_lookup.js existente, mas adaptado para Vue.js.
 */

import { ref, computed } from 'vue'
import api from '@/services/api'

export interface Client {
  id: string
  name: string
  xero_contact_id?: string
  email?: string
  phone?: string
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
  // State management seguindo princípios de clean code
  const searchQuery = ref('')
  const suggestions = ref<Client[]>([])
  const isLoading = ref(false)
  const showSuggestions = ref(false)
  const selectedClient = ref<Client | null>(null)
  const contacts = ref<ClientContact[]>([])

  // Computed properties para lógica derivada
  const hasValidXeroId = computed(() => {
    return selectedClient.value?.xero_contact_id != null && selectedClient.value.xero_contact_id !== ''
  })

  const displayValue = computed(() => {
    return selectedClient.value?.name || searchQuery.value
  })

  // Client search com debounce e early return
  const searchClients = async (query: string) => {
    // Guard clause - early return para queries muito curtas
    if (query.length < 3) {
      suggestions.value = []
      showSuggestions.value = false
      return
    }

    isLoading.value = true
      try {
      const response = await api.get(`/clients/rest/search/?q=${encodeURIComponent(query)}`)
      
      // Guard clause para response inválido
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

  // Select client e load contacts
  const selectClient = async (client: Client) => {
    selectedClient.value = client
    searchQuery.value = client.name
    showSuggestions.value = false
    
    // Clear previous contacts
    contacts.value = []
    
    // Load contacts for selected client
    await loadClientContacts(client.id)
  }
  // Load contacts para o client selecionado
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

  // Get primary contact seguindo early return
  const getPrimaryContact = (): ClientContact | null => {
    // Early return se não há contacts
    if (contacts.value.length === 0) {
      return null
    }

    // Find primary contact
    const primaryContact = contacts.value.find(contact => contact.is_primary)
    
    // Return primary or first contact
    return primaryContact || contacts.value[0]
  }

  // Clear all data
  const clearSelection = () => {
    selectedClient.value = null
    searchQuery.value = ''
    suggestions.value = []
    showSuggestions.value = false
    contacts.value = []
  }

  // Handle input change
  const handleInputChange = (value: string) => {
    searchQuery.value = value
    
    // Clear selection se o valor mudou
    if (selectedClient.value && selectedClient.value.name !== value) {
      selectedClient.value = null
      contacts.value = []
    }
    
    // Search se há valor suficiente
    if (value.length >= 3) {
      searchClients(value)
    } else {
      suggestions.value = []
      showSuggestions.value = false
    }
  }

  // Create new client (opens popup similar to original)
  const createNewClient = (clientName: string) => {
    const currentClientName = clientName.trim()
    const newWindow = window.open(
      `/clients/add/?name=${encodeURIComponent(currentClientName)}`,
      '_blank',
      'width=800,height=600'
    )
    
    // Guard clause se popup foi bloqueado
    if (!newWindow) {
      console.error('Popup blocked. Please allow popups for this site.')
      return
    }

    // Listen for client creation message
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'CLIENT_SELECTED') {
        selectClient({
          id: event.data.clientId,
          name: event.data.clientName,
          xero_contact_id: event.data.clientXeroId
        })
        
        // Cleanup listener
        window.removeEventListener('message', handleMessage)
      }
    }
    
    window.addEventListener('message', handleMessage)
  }

  // Hide suggestions
  const hideSuggestions = () => {
    showSuggestions.value = false
  }

  return {
    // State
    searchQuery,
    suggestions,
    isLoading,
    showSuggestions,
    selectedClient,
    contacts,
    
    // Computed
    hasValidXeroId,
    displayValue,
    
    // Methods
    searchClients,
    selectClient,
    loadClientContacts,
    getPrimaryContact,
    clearSelection,
    handleInputChange,
    createNewClient,
    hideSuggestions
  }
}
