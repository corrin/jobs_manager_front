import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'

export interface StockItem {
  id: string
  description: string
  quantity: number
  unit_cost: number
  metal_type?: string
  alloy?: string
  specifics?: string
  location?: string
  dimensions?: string
  source?: string
  is_active?: boolean
}

export const useStockStore = defineStore('stock', () => {
  const items = ref<StockItem[]>([])
  const loading = ref(false)

  async function fetchStock() {
    loading.value = true
    try {
      const res = await api.get('/purchasing/rest/stock/')
      items.value = Array.isArray(res.data) ? res.data : []
    } finally {
      loading.value = false
    }
  }

  async function consumeStock(id: string, payload: { job_id: string; quantity: number }) {
    await api.post(`/purchasing/rest/stock/${id}/consume/`, payload)
  }

  async function create(payload: Partial<StockItem>) {
    const res = await api.post('/purchasing/rest/stock/', payload)
    return res.data
  }

  async function deactivate(id: string) {
    await api.delete(`/purchasing/rest/stock/${id}/`)
  }

  return { items, loading, fetchStock, consumeStock, create, deactivate }
})
