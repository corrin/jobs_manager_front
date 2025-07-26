/**
 * Delivery Receipt Utilities
 *
 * Frontend utilities for handling delivery receipt data transformation and UI types.
 * These are frontend responsibilities - data transformation and UI presentation.
 */

import { schemas } from '@/api/generated/api'
import type { z } from 'zod'

// Generated API types
type DeliveryReceiptLine = z.infer<typeof schemas.DeliveryReceiptLine>
type DeliveryReceiptRequest = z.infer<typeof schemas.DeliveryReceiptRequest>

// Frontend UI types for delivery receipt management
export interface DeliveryAllocationUI {
  id?: string
  job_id: string
  job_name: string
  quantity: number
  unit_cost: number
  retail_rate: number
  notes?: string
}

/**
 * Transform frontend UI allocations data to backend API format
 */
export function transformDeliveryReceiptForAPI(
  purchaseOrderId: string,
  uiAllocations: Record<string, DeliveryAllocationUI[]>,
  defaultRetailRate: number,
): DeliveryReceiptRequest {
  const apiAllocations: Record<string, DeliveryReceiptLine> = {}

  for (const [lineId, allocations] of Object.entries(uiAllocations)) {
    if (allocations.length > 0) {
      apiAllocations[lineId] = {
        allocations: allocations.map((allocation) => ({
          job_id: allocation.job_id,
          quantity: allocation.quantity,
          unit_cost: allocation.unit_cost,
          retail_rate: allocation.retail_rate || defaultRetailRate,
          notes: allocation.notes || '',
        })),
      }
    }
  }

  return {
    purchase_order_id: purchaseOrderId,
    allocations: apiAllocations,
  }
}

/**
 * Initialize empty allocations structure for UI
 */
export function initializeEmptyAllocations(
  lineIds: string[],
): Record<string, DeliveryAllocationUI[]> {
  const allocations: Record<string, DeliveryAllocationUI[]> = {}
  lineIds.forEach((lineId) => {
    allocations[lineId] = []
  })
  return allocations
}
