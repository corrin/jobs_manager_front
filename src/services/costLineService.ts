import type { CostLine } from '@/types/costing.types'

export async function addCostLine(jobId: string, costLine: CostLine): Promise<CostLine> {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ ...costLine, id: Math.random().toString() }), 500),
  )
}
