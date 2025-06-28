import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'

export interface StockItem {
  id: string
  description: string
  quantity: number
  unit_cost: number
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

  return { items, loading, fetchStock, consumeStock }
})
