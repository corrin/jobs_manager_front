import { defineStore } from 'pinia'

export const useFeatureFlags = defineStore('featureFlags', {
  state: () => ({
    // Sempre ativado para novos jobs - sistema CostSet é o padrão agora
    useCostingApi: true  
  }),

  getters: {
    isCostingApiEnabled: (state) => {
      console.log('🔍 CostingAPI sempre habilitado para novos jobs')
      return true  // Sempre retorna true
    }
  }
})
