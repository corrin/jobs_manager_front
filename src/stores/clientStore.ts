import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/api/client'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'

// Type definitions
type ClientSearchResult = z.infer<typeof schemas.ClientSearchResult>
type ClientSearchResponse = z.infer<typeof schemas.ClientSearchResponse>
type ClientDetail = z.infer<typeof schemas.ClientDetailResponse>
type ClientContact = z.infer<typeof schemas.ClientContact>
type ClientJobsResponse = z.infer<typeof schemas.ClientJobsResponse>

// Type for client jobs - inferred from generated schema
type ClientJob = z.infer<typeof schemas.ClientJobHeader>

export const useClientStore = defineStore('clients', () => {
  // State
  const allClients = ref<ClientSearchResult[]>([])
  const searchResults = ref<ClientSearchResult[]>([])
  const detailedClients = ref<Record<string, ClientDetail>>({})
  const clientContacts = ref<Record<string, ClientContact[]>>({})
  const clientJobs = ref<Record<string, ClientJob[]>>({})
  const isLoading = ref(false)
  const isSearching = ref(false)
  const isLoadingDetail = ref(false)
  const isLoadingContacts = ref(false)
  const isLoadingJobs = ref(false)
  const lastSearchQuery = ref('')

  // Getters
  const hasSearchResults = computed(() => searchResults.value.length > 0)
  const hasClients = computed(() => allClients.value.length > 0)

  /**
   * Fetch all clients
   */
  async function fetchAllClients() {
    isLoading.value = true

    try {
      const response: ClientSearchResponse = await api.clients_search_retrieve({
        queries: { limit: 500 },
      })
      allClients.value = response.results || []
    } catch (error) {
      console.error('Failed to fetch all clients:', error)
      allClients.value = []
      throw error
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Search for clients by name
   * @param query Search query (minimum 3 characters)
   * @param limit Maximum number of results (default: 50)
   */
  async function searchClients(query: string, limit: number = 50) {
    if (query.length < 3) {
      searchResults.value = []
      lastSearchQuery.value = ''
      return
    }

    isSearching.value = true
    lastSearchQuery.value = query

    try {
      const response: ClientSearchResponse = await api.clients_search_retrieve({
        queries: { q: query, limit },
      })
      searchResults.value = response.results || []
    } catch (error) {
      console.error('Failed to search clients:', error)
      searchResults.value = []
      throw error
    } finally {
      isSearching.value = false
    }
  }

  /**
   * Fetch detailed information for a specific client
   * @param clientId UUID of the client
   */
  async function fetchClientDetail(clientId: string) {
    isLoadingDetail.value = true

    try {
      const response = await api.clients_retrieve({
        params: { client_id: clientId },
      })
      detailedClients.value[clientId] = response
      return response
    } catch (error) {
      console.error('Failed to fetch client details:', error)
      throw error
    } finally {
      isLoadingDetail.value = false
    }
  }

  /**
   * Fetch contacts for a specific client
   * @param clientId UUID of the client
   */
  async function fetchClientContacts(clientId: string) {
    isLoadingContacts.value = true

    try {
      const response = await api.clients_contacts_list()
      const filtered = (response || []).filter((contact) => contact.client === clientId)
      clientContacts.value[clientId] = filtered
      return filtered
    } catch (error) {
      console.error('Failed to fetch client contacts:', error)
      clientContacts.value[clientId] = []
      throw error
    } finally {
      isLoadingContacts.value = false
    }
  }

  /**
   * Get cached client detail or fetch if not available
   * @param clientId UUID of the client
   */
  async function getClientDetail(clientId: string): Promise<ClientDetail> {
    if (detailedClients.value[clientId]) {
      return detailedClients.value[clientId]
    }
    return await fetchClientDetail(clientId)
  }

  /**
   * Get cached client contacts or fetch if not available
   * @param clientId UUID of the client
   */
  async function getClientContacts(clientId: string): Promise<ClientContact[]> {
    if (clientContacts.value[clientId]) {
      return clientContacts.value[clientId]
    }
    return await fetchClientContacts(clientId)
  }

  /**
   * Fetch jobs for a specific client
   * @param clientId UUID of the client
   */
  async function fetchClientJobs(clientId: string) {
    isLoadingJobs.value = true

    try {
      const response: ClientJobsResponse = await api.clients_jobs_retrieve({
        params: { client_id: clientId },
      })
      clientJobs.value[clientId] = response.results || []
      return response.results || []
    } catch (error) {
      console.error('Failed to fetch client jobs:', error)
      clientJobs.value[clientId] = []
      throw error
    } finally {
      isLoadingJobs.value = false
    }
  }

  /**
   * Get cached client jobs or fetch if not available
   * @param clientId UUID of the client
   */
  async function getClientJobs(clientId: string): Promise<ClientJob[]> {
    if (clientJobs.value[clientId]) {
      return clientJobs.value[clientId]
    }
    return await fetchClientJobs(clientId)
  }

  /**
   * Clear search results
   */
  function clearSearch() {
    searchResults.value = []
    lastSearchQuery.value = ''
  }

  /**
   * Clear all cached data
   */
  function clearCache() {
    allClients.value = []
    searchResults.value = []
    detailedClients.value = {}
    clientContacts.value = {}
    clientJobs.value = {}
    lastSearchQuery.value = ''
  }

  return {
    // State
    allClients,
    searchResults,
    detailedClients,
    clientContacts,
    clientJobs,
    isLoading,
    isSearching,
    isLoadingDetail,
    isLoadingContacts,
    isLoadingJobs,
    lastSearchQuery,

    // Getters
    hasSearchResults,
    hasClients,

    // Actions
    fetchAllClients,
    searchClients,
    fetchClientDetail,
    fetchClientContacts,
    fetchClientJobs,
    getClientDetail,
    getClientContacts,
    getClientJobs,
    clearSearch,
    clearCache,
  }
})
