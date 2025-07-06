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

export interface Stock {
  id: string
  description: string
  metal_type?: string
  alloy?: string
  location: string
  quantity_available: number
  unit_cost: number
}

export interface ExistingAllocation {
  type: 'job' | 'stock'
  job_id: string
  job_name: string
  quantity: number
  retail_rate: number
  allocation_date: string | null
  description: string
  stock_location?: string
}

export interface ExistingAllocationsResponse {
  po_id: string
  allocations: Record<string, ExistingAllocation[]>
}
