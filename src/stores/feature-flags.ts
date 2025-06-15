import { defineStore } from 'pinia'

export const useFeatureFlags = defineStore('featureFlags', {
  state: () => ({
    useCostingApi: import.meta.env.VITE_COSTING_API_ENABLED === 'true'
  }),

  getters: {
    isCostingApiEnabled: (state) => {
      console.log('🔍 VITE_COSTING_API_ENABLED:', import.meta.env.VITE_COSTING_API_ENABLED)
      console.log('🔍 useCostingApi state:', state.useCostingApi)
      return state.useCostingApi
    }
  }
})
