import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/plugins/axios'

// Re-export from purchasing types for compatibility
export interface Job {
  id: string
  name: string
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

interface TransformedLineData {
  total_received: number
  job_allocation: number
  stock_allocation: number
  job_id: string | null
  retail_rate: number
}

export const useDeliveryReceiptStore = defineStore('deliveryReceipts', () => {
  const loading = ref(false)
  const error = ref<string | null>(null)
  const stockHoldingJob = ref<Job | null>(null)
  const allocatableJobs = ref<Job[]>([])

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
      console.error(`Error fetching purchase order ${id}:`, err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
    }
  }

  async function fetchJobs(): Promise<{ stockHolding: Job; allocatable: Job[] }> {
    error.value = null

    try {
      const res = await api.get('/job/api/jobs/fetch-all/')
      const data = res.data

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch jobs')
      }

      // Get both active and archived jobs to find special jobs like Worker Admin
      const allJobs = [...(data.active_jobs || []), ...(data.archived_jobs || [])]

      // Find stock holding job (Worker Admin) - it might be marked as special
      const stockHolding = allJobs.find((job: Job) => job.name === 'Worker Admin')
      if (!stockHolding) {
        throw new Error('Stock holding job (Worker Admin) not found')
      }

      // For allocatable jobs, use only active jobs and exclude the stock holding job
      const allocatable = (data.active_jobs || []).filter((job: Job) => job.id !== stockHolding.id)

      stockHoldingJob.value = stockHolding
      allocatableJobs.value = allocatable

      return { stockHolding, allocatable }
    } catch (err) {
      const errorMessage = handleApiError(err, 'Failed to fetch jobs')
      error.value = errorMessage
      console.error('Error fetching jobs:', err)
      throw new Error(errorMessage)
    }
  }

  async function submitDeliveryReceipt(
    purchaseOrderId: string,
    receiptData: DeliveryReceiptData,
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
      // Transform data to match backend format
      const transformedData: { [lineId: string]: TransformedLineData } = {}

      for (const [lineId, allocation] of Object.entries(receiptData)) {
        const lineData: TransformedLineData = {
          total_received: allocation.total_received,
          job_allocation: 0,
          stock_allocation: 0,
          job_id: null,
          retail_rate: 20, // Default retail rate
        }

        // Process allocations
        for (const alloc of allocation.allocations) {
          if (alloc.job_id === stockHoldingJob.value?.id) {
            // Stock allocation
            lineData.stock_allocation = alloc.quantity
            lineData.retail_rate = alloc.retail_rate
          } else {
            // Job allocation
            lineData.job_allocation = alloc.quantity
            lineData.job_id = alloc.job_id
            lineData.retail_rate = alloc.retail_rate
          }
        }

        transformedData[lineId] = lineData
      }

      const formData = new FormData()
      formData.append('received_quantities', JSON.stringify(transformedData))

      await api.post(`/purchasing/delivery-receipt/${purchaseOrderId}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } catch (err) {
      const errorMessage = handleApiError(
        err,
        `Failed to submit delivery receipt for PO ${purchaseOrderId}`,
      )
      error.value = errorMessage
      console.error(`Error submitting delivery receipt for PO ${purchaseOrderId}:`, err)
      throw new Error(errorMessage)
    } finally {
      loading.value = false
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
    loading,
    error,
    stockHoldingJob,
    allocatableJobs,
    fetchPurchaseOrder,
    fetchJobs,
    submitDeliveryReceipt,
  }
})
