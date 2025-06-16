import api from './api'

export interface CompanyDefaults {
  materials_markup: number
  time_markup: number
  charge_out_rate: number
  wage_rate: number
}

let cachedDefaults: CompanyDefaults | null = null

export const CompanyDefaultsService = {
  /**
   * Get company defaults with caching
   */  async getDefaults(): Promise<CompanyDefaults> {
    if (cachedDefaults) {
      return cachedDefaults
    }    try {
      console.log('🔄 Loading company defaults from API...')
      const response = await api.get<CompanyDefaults>('/job/api/company_defaults/')
      cachedDefaults = response.data
      
      console.log('✅ Company defaults loaded successfully:', cachedDefaults)
      
      // Make available globally for legacy components
      ;(window as any).companyDefaults = cachedDefaults
      
      return cachedDefaults
    } catch (error: any) {
      console.warn('⚠️ Failed to load company defaults from API:', {
        status: error.response?.status,
        message: error.message,
        url: error.config?.url
      })
      
      // Return fallback values
      const fallback: CompanyDefaults = {
        materials_markup: 0.2,
        time_markup: 0.3,
        charge_out_rate: 105.0,
        wage_rate: 32.0
      }
      
      console.log('📋 Using fallback company defaults:', fallback)
      
      ;(window as any).companyDefaults = fallback
      cachedDefaults = fallback
      return fallback
    }
  },

  /**
   * Clear cache (useful for testing or when defaults change)
   */
  clearCache(): void {
    cachedDefaults = null
    ;(window as any).companyDefaults = null
  },

  /**
   * Get cached defaults synchronously (returns null if not loaded)
   */
  getCached(): CompanyDefaults | null {
    return cachedDefaults
  }
}
