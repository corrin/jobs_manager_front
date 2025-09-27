import { defineStore } from 'pinia'
import { ref } from 'vue'
import { schemas } from '@/api/generated/api'
import { api } from '@/api/client'
import { z } from 'zod'

type StockItem = z.infer<typeof schemas.StockItem>
type StockConsumeRequest = z.infer<typeof schemas.StockConsumeRequest>
type StockConsumeResponse = z.infer<typeof schemas.StockConsumeResponse>
type StockCreate = z.infer<typeof schemas.StockCreate>

export { StockItem }

export const useStockStore = defineStore('stock', () => {
  const items = ref<StockItem[]>([])
  const loading = ref(false)
  let inFlight: Promise<StockItem[]> | null = null

  async function fetchStock(force = false): Promise<StockItem[]> {
    // Return existing in-flight promise if one exists (unless forcing)
    if (loading.value && inFlight && !force) return inFlight

    // Early return if already have data and not forcing
    if (!force && items.value.length > 0) return items.value

    loading.value = true
    inFlight = (async () => {
      try {
        const response = await api.purchasing_rest_stock_retrieve()
        items.value = response.items || []
        return items.value
      } catch (error: unknown) {
        // Handle zodios validation error and extract the actual data
        if (
          error &&
          typeof error === 'object' &&
          'cause' in error &&
          error.cause &&
          typeof error.cause === 'object' &&
          'received' in error.cause
        ) {
          try {
            // The zodios error contains the actual response data in cause.received
            const receivedData = (error.cause as { received?: unknown }).received
            if (receivedData && typeof receivedData === 'object' && 'items' in receivedData) {
              // Parse the StockList response and extract items
              const stockList = schemas.StockList.parse(receivedData)
              items.value = stockList.items || []
              return items.value
            }
          } catch (parseError) {
            console.error('Error parsing stock data:', parseError)
          }
        }

        console.error('Error fetching stock:', error)
        items.value = []
        return items.value
      } finally {
        loading.value = false
        // Clear inFlight after microtask to avoid races with immediate subsequent checks
        queueMicrotask(() => {
          inFlight = null
        })
      }
    })()

    return inFlight
  }

  async function consumeStock(
    id: string,
    payload: { job_id: string; quantity: number },
  ): Promise<StockConsumeResponse> {
    const consumePayload: StockConsumeRequest = {
      job_id: payload.job_id,
      quantity: payload.quantity,
    }
    return await api.consumeStock(consumePayload, {
      params: { stock_id: id },
    })
  }

  async function create(payload: StockCreate) {
    const response = await api.purchasing_rest_stock_create(payload)
    return response
  }

  async function deactivate(id: string) {
    await api.purchasing_rest_stock_destroy({ params: { id } })
  }

  return { items, loading, fetchStock, consumeStock, create, deactivate }
})
