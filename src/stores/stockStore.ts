import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api, schemas } from '@/api/generated/api'
import { z } from 'zod'

type StockItem = z.infer<typeof schemas.StockList>
type StockConsumeRequest = z.infer<typeof schemas.StockConsumeRequest>
type StockCreate = z.infer<typeof schemas.StockCreate>

export { StockItem }

export const useStockStore = defineStore('stock', () => {
  const items = ref<StockItem[]>([])
  const loading = ref(false)

  async function fetchStock() {
    loading.value = true
    try {
      const response = await api.purchasing_rest_stock_list()
      items.value = Array.isArray(response) ? response : []
    } finally {
      loading.value = false
    }
  }

  async function consumeStock(id: string, payload: { job_id: string; quantity: number }) {
    const consumePayload: StockConsumeRequest = {
      job_id: payload.job_id,
      quantity: payload.quantity,
    }
    await api.purchasing_rest_stock_consume_create({ id, body: consumePayload })
  }

  async function create(payload: StockCreate) {
    const response = await api.purchasing_rest_stock_create({ body: payload })
    return response
  }

  async function deactivate(id: string) {
    await api.purchasing_rest_stock_destroy({ id })
  }

  return { items, loading, fetchStock, consumeStock, create, deactivate }
})
