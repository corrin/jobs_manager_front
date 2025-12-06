import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api/client'
import { debugLog } from '../utils/debug'
import { schemas } from '../api/generated/api'
import axios from 'axios'
import type { z } from 'zod'

// Type definitions
type PurchaseOrder = z.infer<typeof schemas.PurchaseOrderList>
type PurchaseOrderCreate = z.infer<typeof schemas.PurchaseOrderCreate>
type PurchaseOrderUpdate = z.infer<typeof schemas.PatchedPurchaseOrderUpdate>
type PurchaseOrderEmailResponse = z.infer<typeof schemas.PurchaseOrderEmailResponse>

export const usePurchaseOrderStore = defineStore('purchaseOrders', () => {
  const orders = ref<PurchaseOrder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  // Conflict reload timestamp per poId for UI sync
  const conflictReloadAtById = ref<Record<string, number>>({})

  async function fetchOrders() {
    loading.value = true
    error.value = null

    try {
      const response = await api.listPurchaseOrders()
      orders.value = response
    } catch (err) {
      error.value = 'Failed to fetch purchase orders'
      debugLog('Error fetching purchase orders:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createOrder(data: PurchaseOrderCreate) {
    error.value = null

    try {
      const response = await api.purchasing_rest_purchase_orders_create(data)
      return response
    } catch (err) {
      error.value = 'Failed to create purchase order'
      debugLog('Error creating purchase order:', err)
      throw err
    }
  }

  async function fetchOne(id: string) {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    error.value = null

    try {
      const response = await api.retrievePurchaseOrder({
        params: { id },
      })
      return response
    } catch (err) {
      error.value = `Failed to fetch purchase order ${id}`
      debugLog(`Error fetching purchase order ${id}:`, err)
      throw err
    }
  }

  async function patch(id: string, data: PurchaseOrderUpdate) {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    error.value = null

    try {
      const response = await api.purchasing_rest_purchase_orders_partial_update(data, {
        params: { id: id },
      })
      return response
    } catch (err) {
      error.value = `Failed to update purchase order ${id}`
      debugLog(`Error updating purchase order ${id}:`, err)
      throw err
    }
  }

  /**
   * Reloads purchase order data when a concurrency conflict occurs.
   * This fetches fresh data from the server to get the latest ETag and PO state.
   * @param poId - The purchase order ID to reload
   */
  async function reloadPoOnConflict(poId: string): Promise<void> {
    debugLog('🔄 PO Store - reloadPoOnConflict called:', { poId })

    try {
      // Fetch full PO detail (captures new ETag via interceptor)
      await fetchOne(poId)

      // Mark conflict reload timestamp so components can force local sync
      conflictReloadAtById.value = {
        ...conflictReloadAtById.value,
        [poId]: Date.now(),
      }

      debugLog('✅ PO Store - reloadPoOnConflict success:', { poId })
    } catch (error) {
      debugLog('❌ PO Store - reloadPoOnConflict error:', { poId, error })
      throw error
    }
  }

  async function fetchPurchaseOrderPdf(id: string): Promise<Blob> {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    try {
      // Use the updated endpoint
      const response = await axios.get(`/purchasing/rest/purchase-orders/${id}/pdf/`, {
        responseType: 'blob',
      })

      return response.data
    } catch (err) {
      debugLog(`Error fetching PDF for purchase order ${id}:`, err)
      throw err
    }
  }

  async function emailPurchaseOrder(id: string): Promise<PurchaseOrderEmailResponse> {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    try {
      const response = await api.getPurchaseOrderEmail(
        {}, // Empty body as required by the schema
        { params: { po_id: id } },
      )
      return response
    } catch (err) {
      debugLog(`Error emailing purchase order ${id}:`, err)
      throw err
    }
  }

  return {
    orders,
    loading,
    error,
    conflictReloadAtById,
    fetchOrders,
    createOrder,
    fetchOne,
    patch,
    fetchPurchaseOrderPdf,
    emailPurchaseOrder,
    reloadPoOnConflict,
  }
})
