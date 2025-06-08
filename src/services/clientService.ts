import api from '@/services/api'

export interface Client {
  id?: number
  name: string
  email?: string
  phone?: string
  address?: string
  contact_person?: string
}

export class ClientService {
  private static instance: ClientService
  private baseUrl = '/clients/api'

  static getInstance(): ClientService {
    if (!ClientService.instance) {
      ClientService.instance = new ClientService()
    }
    return ClientService.instance
  }
  /**
   * Get all clients
   */
  async getAllClients(): Promise<Client[]> {
    try {
      const response = await api.get(`${this.baseUrl}/all/`)
      
      return Array.isArray(response.data) ? response.data : []
    } catch (error) {
      console.error('Error fetching clients:', error)
      throw new Error('Failed to load clients')
    }
  }

  /**
   * Search clients by name
   */
  searchClients(clientList: Client[], searchTerm: string): Client[] {
    if (!searchTerm.trim()) {
      return clientList
    }    const term = searchTerm.toLowerCase()
    return clientList.filter(client => 
      client.name.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.contact_person?.toLowerCase().includes(term)
    )
  }
}

export const clientService = ClientService.getInstance()
