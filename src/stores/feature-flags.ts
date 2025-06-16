import { defineStore } from 'pinia'

export const useFeatureFlags = defineStore('featureFlags', {
  state: () => ({
    useCostingApi: true
  }),

  getters: {
    isCostingApiEnabled: (state) => {
      console.log('Feature flag for costing API:', state.useCostingApi)
      return true
    }
  }
})
