export interface CostLine {
  id: number
  kind: 'time' | 'material' | 'adjust'
  desc: string
  quantity: string
  unit_cost: string
  unit_rev: string
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
    [key: string]: unknown
  }
}

export interface CostSet {
  id: number
  kind: 'estimate' | 'quote' | 'actual'
  rev: number
  summary: {
    cost: number
    rev: number
    hours: number
  }
  created: string
  cost_lines: CostLine[]
}
