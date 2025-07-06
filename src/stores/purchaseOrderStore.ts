import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'

export interface PurchaseOrder {
  id: string
  po_number: string
  status: string
  supplier: string
}

export const usePurchaseOrderStore = defineStore('purchaseOrders', () => {
  const orders = ref<PurchaseOrder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchOrders() {
    loading.value = true
    error.value = null
    const url = '/purchasing/rest/purchase-orders/'

    try {
      const res = await api.get(url)
      orders.value = Array.isArray(res.data) ? res.data : []
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to fetch purchase orders')
      error.value = errorMessage
      console.error('Error fetching purchase orders:', err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  async function createOrder(data: unknown) {
    error.value = null

    try {
      const res = await api.post('/purchasing/rest/purchase-orders/', data)
      return res.data
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to create purchase order')
      error.value = errorMessage
      console.error('Error creating purchase order:', err)
      throw new Error(errorMessage)
    }
  }

  async function fetchOne(id: string) {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    error.value = null

    try {
      const res = await api.get(`/purchasing/rest/purchase-orders/${id}/`)
      return res.data
    } catch (err) {
      const errorMessage = handleApiError(err, `Failed to fetch purchase order ${id}`)
      error.value = errorMessage
      console.error(`Error fetching purchase order ${id}:`, err)
      throw new Error(errorMessage)
    }
  }

  async function patch(id: string, data: unknown) {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    error.value = null

    try {
      const res = await api.patch(`/purchasing/rest/purchase-orders/${id}/`, data)
      return res.data
    } catch (err) {
      const errorMessage = handleApiError(err, `Failed to update purchase order ${id}`)
      error.value = errorMessage
      console.error(`Error updating purchase order ${id}:`, err)
      throw new Error(errorMessage)
    }
  }

  async function fetchPurchaseOrderPdf(id: string): Promise<Blob> {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    try {
      const res = await api.get(`/purchasing/api/purchase-orders/${id}/pdf/`, {
        responseType: 'blob',
      })
      return res.data
    } catch (err) {
      const errorMessage = handleApiError(err, `Failed to fetch PDF for purchase order ${id}`)
      console.error(`Error fetching PDF for purchase order ${id}:`, err)
      throw new Error(errorMessage)
    }
  }

  async function emailPurchaseOrder(id: string) {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    try {
      const res = await api.post(`/purchasing/api/purchase-orders/${id}/email/`)
      return res.data
    } catch (err) {
      const errorMessage = handleApiError(err, `Failed to email purchase order ${id}`)
      console.error(`Error emailing purchase order ${id}:`, err)
      throw new Error(errorMessage)
    }
  }

  async function deleteOrder(id: string) {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    error.value = null

    try {
      await api.delete(`/purchasing/rest/purchase-orders/${id}/`)
      // Remove from local state
      orders.value = orders.value.filter((order) => order.id !== id)
    } catch (err) {
      const errorMessage = handleApiError(err, `Failed to delete purchase order ${id}`)
      error.value = errorMessage
      console.error(`Error deleting purchase order ${id}:`, err)
      throw new Error(errorMessage)
    }
  }

  // Centralised error handling function
  function handleApiError(err: unknown, defaultMessage: string): string {
    if (!err) return defaultMessage

    // Handle Axios errors
    if (typeof err === 'object' && 'response' in err) {
      const axiosError = err as {
        response?: { status?: number; data?: { error?: string; message?: string } }
      }

      if (axiosError.response?.status === 404) {
        return 'Resource not found'
      }

      if (axiosError.response?.status === 403) {
        return 'Access denied'
      }

      if (axiosError.response?.data?.error) {
        return axiosError.response.data.error
      }

      if (axiosError.response?.data?.message) {
        return axiosError.response.data.message
      }
    }

    // Handle generic errors
    if (err instanceof Error) {
      return err.message
    }

    return defaultMessage
  }

  return {
    orders,
    loading,
    error,
    fetchOrders,
    createOrder,
    fetchOne,
    patch,
    fetchPurchaseOrderPdf,
    emailPurchaseOrder,
    deleteOrder,
  }
})
