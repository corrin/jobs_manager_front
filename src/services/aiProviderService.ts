import api from './api'
import { debugLog } from '@/utils/debug'

/**

 * @deprecated Use generated types from src/api/generated instead

 * This interface will be removed after migration to openapi-zod-client generated types

 */

export interface AIProvider {
  id: number
  name: string
  provider_type: 'Claude' | 'Gemini' | 'Mistral'
  model_name: string
  api_key?: string
  default: boolean
}

export class AIProviderService {
  private static instance: AIProviderService

  public static getInstance(): AIProviderService {
    if (!AIProviderService.instance) {
      AIProviderService.instance = new AIProviderService()
    }
    return AIProviderService.instance
  }

  private constructor() {}

  async getProviders(): Promise<AIProvider[]> {
    try {
      const response = await api.get<{ data: AIProvider[] }>('/api/workflow/ai-providers/')
      return response.data.data
    } catch (error) {
      debugLog('Failed to fetch AI providers:', error)
      throw error
    }
  }

  async createProvider(providerData: Omit<AIProvider, 'id'>): Promise<AIProvider> {
    try {
      const response = await api.post<{ data: AIProvider }>(
        '/api/workflow/ai-providers/',
        providerData,
      )
      return response.data.data
    } catch (error) {
      debugLog('Failed to create AI provider:', error)
      throw error
    }
  }

  async updateProvider(id: number, providerData: Partial<AIProvider>): Promise<AIProvider> {
    try {
      const response = await api.patch<{ data: AIProvider }>(
        `/api/workflow/ai-providers/${id}/`,
        providerData,
      )
      return response.data.data
    } catch (error) {
      debugLog(`Failed to update AI provider ${id}:`, error)
      throw error
    }
  }

  async deleteProvider(id: number): Promise<void> {
    try {
      await api.delete(`/api/workflow/ai-providers/${id}/`)
    } catch (error) {
      debugLog(`Failed to delete AI provider ${id}:`, error)
      throw error
    }
  }

  async setDefaultProvider(id: number): Promise<AIProvider> {
    try {
      const response = await api.post<{ data: AIProvider }>(
        `/api/workflow/ai-providers/${id}/set_default/`,
      )
      return response.data.data
    } catch (error) {
      debugLog(`Failed to set default AI provider ${id}:`, error)
      throw error
    }
  }
}

export const aiProviderService = AIProviderService.getInstance()
