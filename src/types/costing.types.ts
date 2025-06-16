// Interfaces para costing - tipos utilitários para utilização interna
// Baseado na estrutura real do backend
export interface CostLine {
  id: number // ID é number, não string
  kind: 'time' | 'material' | 'adjust'
  desc: string
  quantity: string // Quantity vem como string do backend
  unit_cost: string // Unit_cost vem como string do backend
  unit_rev: string // Unit_rev vem como string do backend
  total_cost: number
  total_rev: number
  ext_refs?: Record<string, any>
  meta: Record<string, any>
}

export interface CostSet {
  id: number // ID é number, não string
  kind: 'estimate' | 'quote' | 'actual'
  rev: number
  summary: {
    cost: number
    rev: number
    hours: number
  }
  created: string // Data de criação
  cost_lines: CostLine[]
}
