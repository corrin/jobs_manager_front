import api from './api'

/**
 * Represents the structure of an AI Provider object,
 * matching the Django model on the backend.
 */
export interface AIProvider {
  id: number
  name: string
  provider_type: 'Claude' | 'Gemini' | 'Mistral'
  model_name: string
  api_key?: string // Optional, especially for updates
  default: boolean
}

/**
 * Service class for interacting with the AI Provider API endpoints.
 * Handles all CRUD operations and setting the default provider.
 */
export class AIProviderService {
  private static instance: AIProviderService

  // Singleton pattern to ensure only one instance of the service is used.
  public static getInstance(): AIProviderService {
    if (!AIProviderService.instance) {
      AIProviderService.instance = new AIProviderService()
    }
    return AIProviderService.instance
  }

  private constructor() {}

  /**
   * Fetches all AI providers from the backend.
   * @returns A promise that resolves to an array of AIProvider objects.
   */
  async getProviders(): Promise<AIProvider[]> {
    try {
      const response = await api.get<{ data: AIProvider[] }>('/api/workflow/ai-providers/')
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch AI providers:', error)
      throw error
    }
  }

  /**
   * Creates a new AI provider.
   * @param providerData - The data for the new provider.
   * @returns A promise that resolves to the newly created AIProvider object.
   */
  async createProvider(providerData: Omit<AIProvider, 'id'>): Promise<AIProvider> {
    try {
      const response = await api.post<{ data: AIProvider }>(
        '/api/workflow/ai-providers/',
        providerData,
      )
      return response.data.data
    } catch (error) {
      console.error('Failed to create AI provider:', error)
      throw error
    }
  }

  /**
   * Updates an existing AI provider.
   * @param id - The ID of the provider to update.
   * @param providerData - The data to update. Can be a partial object.
   * @returns A promise that resolves to the updated AIProvider object.
   */
  async updateProvider(id: number, providerData: Partial<AIProvider>): Promise<AIProvider> {
    try {
      const response = await api.patch<{ data: AIProvider }>(
        `/api/workflow/ai-providers/${id}/`,
        providerData,
      )
      return response.data.data
    } catch (error) {
      console.error(`Failed to update AI provider ${id}:`, error)
      throw error
    }
  }

  /**
   * Deletes an AI provider.
   * @param id - The ID of the provider to delete.
   */
  async deleteProvider(id: number): Promise<void> {
    try {
      await api.delete(`/api/workflow/ai-providers/${id}/`)
    } catch (error) {
      console.error(`Failed to delete AI provider ${id}:`, error)
      throw error
    }
  }

  /**
   * Sets a specific provider as the default for its company.
   * @param id - The ID of the provider to set as default.
   * @returns A promise that resolves to the updated AIProvider object.
   */
  async setDefaultProvider(id: number): Promise<AIProvider> {
    try {
      // This endpoint name assumes a custom action in the Django viewset.
      const response = await api.post<{ data: AIProvider }>(
        `/api/workflow/ai-providers/${id}/set_default/`,
      )
      return response.data.data
    } catch (error) {
      console.error(`Failed to set default AI provider ${id}:`, error)
      throw error
    }
  }
}

// Export a singleton instance of the service
export const aiProviderService = AIProviderService.getInstance()
