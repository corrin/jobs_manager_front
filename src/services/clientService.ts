import api from '@/plugins/axios'

export interface Client {
  id?: number
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
}

export interface CreateClientData {
  name: string
  email?: string
  phone?: string
  address?: string
  is_account_customer?: boolean
}

export interface CreateClientResponse {
  success: boolean
  client?: {
    id: string
    name: string
    email: string
    phone: string
    address: string
    is_account_customer: boolean
    xero_contact_id: string
  }
  error?: string
  message?: string
}

export class ClientService {
  private static instance: ClientService

  static getInstance(): ClientService {
    if (!ClientService.instance) {
      ClientService.instance = new ClientService()
    }
    return ClientService.instance
  }

  async createClient(data: CreateClientData): Promise<CreateClientResponse> {
    try {
      const response = await api.post('/clients/rest/create/', data)
      return response.data
    } catch (error: unknown) {
      console.error('Error creating client:', error)

      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { error?: string } } }
        if (apiError.response?.data) {
          return {
            success: false,
            error: apiError.response.data.error || 'Failed to create client',
          }
        }
      }

      throw new Error('Failed to create client')
    }
  }

  async getAllClients(): Promise<Client[]> {
    try {
      const response = await api.get('/clients/rest/all/')

      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching clients:', error)
      throw new Error('Failed to load clients')
    }
  }

  searchClients(clientList: Client[], searchTerm: string): Client[] {
    if (!searchTerm.trim()) {
      return clientList
    }

    const term = searchTerm.toLowerCase()
    return clientList.filter(
      (client) =>
        client.name.toLowerCase().includes(term) ||
        client.email?.toLowerCase().includes(term) ||
        client.contact_person?.toLowerCase().includes(term),
    )
  }
}

export const clientService = ClientService.getInstance()
