import { defineStore } from 'pinia'
import { ref } from 'vue'
import { CompanyDefaultsService, type CompanyDefaults } from '@/services/company-defaults.service'

export const useCompanyDefaultsStore = defineStore('companyDefaults', () => {
  const companyDefaults = ref<CompanyDefaults | null>(null)
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function loadCompanyDefaults() {
    isLoading.value = true
    error.value = null
    try {
      companyDefaults.value = await CompanyDefaultsService.getDefaults()
      isLoaded.value = true
    } catch (e) {
      error.value = (e as Error)?.message || 'Failed to load company defaults'
    } finally {
      isLoading.value = false
    }
  }

  return {
    companyDefaults,
    isLoaded,
    isLoading,
    error,
    loadCompanyDefaults,
  }
})
