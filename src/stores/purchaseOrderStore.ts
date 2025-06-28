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

  async function fetchOrders() {
    loading.value = true
    try {
      const res = await api.get('/purchasing/rest/purchase-orders/')
      orders.value = Array.isArray(res.data) ? res.data : []
    } finally {
      loading.value = false
    }
  }

  async function createOrder(data: unknown) {
    const res = await api.post('/purchasing/rest/purchase-orders/', data)
    return res.data
  }

  async function fetchOne(id: string) {
    const res = await api.get(`/purchasing/rest/purchase-orders/${id}/`)
    return res.data
  }

  async function patch(id: string, data: unknown) {
    const res = await api.patch(`/purchasing/rest/purchase-orders/${id}/`, data)
    return res.data
  }

  return { orders, loading, fetchOrders, createOrder, fetchOne, patch }
})
