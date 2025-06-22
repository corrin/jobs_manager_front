// Costing interfaces - utility types for internal use
// Based on actual backend structure
export interface CostLine {
  id: number // ID is number, not string
  kind: 'time' | 'material' | 'adjust'
  desc: string
  quantity: string // Quantity comes as string from backend
  unit_cost: string // Unit_cost comes as string from backend
  unit_rev: string // Unit_rev comes as string from backend
  total_cost: number
  total_rev: number
  ext_refs?: Record<string, unknown>
  meta: {
    item_number?: number
    category?: 'fabrication' | 'mainWork'
    labour_minutes?: number
    item_cost?: number | string
    total_cost?: number | string
    is_new?: boolean
    is_modified?: boolean
    [key: string]: unknown // For other meta fields
  }
}

export interface CostSet {
  id: number // ID is number, not string
  kind: 'estimate' | 'quote' | 'actual'
  rev: number
  summary: {
    cost: number
    rev: number
    hours: number
  }
  created: string // Creation date
  cost_lines: CostLine[]
}
