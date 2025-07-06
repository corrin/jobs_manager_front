import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'
import { debugLog } from '@/utils/debug'

interface ExistingAllocation {
  quantity: number
  type: string
  job_id: string
  job_name: string
  allocation_date?: string
  description?: string
  retail_rate?: number
  stock_location?: string
}

export interface Job {
  id: string
  job_number: string
  name: string
  client_name?: string
  status?: string
  is_stock_holding?: boolean
  job_display_name?: string
}

export interface PurchaseOrderLine {
  id: string
  po_id?: string
  part_no?: string
  job_id?: string
  job_name?: string
  description: string
  quantity: number
  received_quantity: number
  unit_cost: number | null
  metal_type?: string
  alloy?: string
  specifics?: string
  location?: string
  qty_ordered?: number
  qty_received?: number
  retail_rate?: number
}

export interface PurchaseOrder {
  id: string
  po_number: string
  supplier: string
  order_date: string
  status: string
  lines: PurchaseOrderLine[]
}

export interface AllocationData {
  job_id: string
  quantity: number
  retail_rate: number
}

export interface DeliveryAllocation {
  job_id: string | null
  stock_location: string | null
  quantity: number
  retail_rate: number
}

export interface DeliveryReceipt {
  id: string
  po_number: string
  supplier: string
  order_date: string
  status: string
  allocations: Record<string, DeliveryAllocation[]>
}

export interface LineAllocation {
  total_received: number
  allocations: AllocationData[]
}

export interface DeliveryReceiptData {
  [lineId: string]: LineAllocation
}

export const useDeliveryReceiptStore = defineStore('deliveryReceipts', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stockHoldingJob = ref<Job | null>(null)
  const allocatableJobs = ref<Job[]>([])

  function getDefaultRetailRate(): number {
    const companyDefaultsStore = useCompanyDefaultsStore()
    const materialsMarkup = companyDefaultsStore.companyDefaults?.materials_markup

    if (materialsMarkup !== undefined && materialsMarkup !== null) {
      return materialsMarkup * 100
    }

    return 0
  }

  async function fetchPurchaseOrder(id: string): Promise<PurchaseOrder> {
    if (!id) {
      throw new Error('Purchase order ID is required')
    }

    loading.value = true
    error.value = null

    try {
      const res = await api.get(`/purchasing/rest/purchase-orders/${id}/`)
      return res.data
    } catch (err) {
      const errorMessage = handleApiError(err, `Failed to fetch purchase order ${id}`)
      error.value = errorMessage
      debugLog(`Error fetching purchase order ${id}:`, err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  async function fetchJobs(): Promise<{ stockHolding: Job; allocatable: Job[] }> {
    error.value = null

    try {
      const res = await api.get('/purchasing/rest/all-jobs/')
      const data = res.data

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch jobs')
      }

      const allJobs = data.jobs || []

      const stockHolding = allJobs.find(
        (job: Job & { is_stock_holding: boolean }) => job.is_stock_holding,
      )
      if (!stockHolding) {
        throw new Error('Stock holding job not found')
      }

      const allocatable = allJobs.filter(
        (job: Job & { is_stock_holding: boolean; status: string }) =>
          !job.is_stock_holding &&
          !['rejected', 'archived', 'completed', 'special'].includes(job.status),
      )

      stockHoldingJob.value = stockHolding
      allocatableJobs.value = allocatable

      return { stockHolding, allocatable }
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to fetch jobs')
      error.value = errorMessage
      debugLog('Error fetching jobs:', err)
      throw new Error(errorMessage)
    }
  }

  async function submitDeliveryReceipt(
    purchaseOrderId: string,
    receiptData: Record<
      string,
      {
        total_received: number
        allocations: { jobId: string | null; quantity: number; retailRate: number }[]
      }
    >,
  ): Promise<void> {
    if (!purchaseOrderId) {
      throw new Error('Purchase order ID is required')
    }

    if (!receiptData || Object.keys(receiptData).length === 0) {
      throw new Error('Receipt data is required')
    }

    loading.value = true
    error.value = null

    try {
      const payload = {
        purchase_order_id: purchaseOrderId,
        allocations: receiptData,
      }

      await api.post('/purchasing/rest/delivery-receipts/', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        `Failed to submit delivery receipt for PO ${purchaseOrderId}`,
      )
      error.value = errorMessage
      debugLog(`Error submitting delivery receipt for PO ${purchaseOrderId}:`, err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  async function fetchExistingAllocations(
    purchaseOrderId: string,
  ): Promise<{ po_id: string; allocations: Record<string, ExistingAllocation[]> }> {
    if (!purchaseOrderId) {
      throw new Error('Purchase order ID is required')
    }

    loading.value = true
    error.value = null

    try {
      debugLog(`🔍 Fetching existing allocations for PO: ${purchaseOrderId}`)
      const res = await api.get(`/purchasing/rest/purchase-orders/${purchaseOrderId}/allocations/`)
      debugLog('📦 Existing allocations response:', res.data)
      return res.data
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        `Failed to fetch existing allocations for PO ${purchaseOrderId}`,
      )
      error.value = errorMessage
      debugLog(`❌ Error fetching existing allocations for PO ${purchaseOrderId}:`, err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  function handleApiError(err: unknown, defaultMessage: string): string {
    if (!err) return defaultMessage

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

    if (err instanceof Error) {
      return err.message
    }

    return defaultMessage
  }

  return {
    loading,
    error,
    stockHoldingJob,
    allocatableJobs,
    fetchPurchaseOrder,
    fetchJobs,
    submitDeliveryReceipt,
    getDefaultRetailRate,
    fetchExistingAllocations,
  }
})
