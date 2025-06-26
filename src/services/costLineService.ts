import type { CostLine } from '@/types/costing.types'

// Exemplo de service para persistência de linhas de custo
export async function addCostLine(jobId: string, costLine: CostLine): Promise<CostLine> {
  // Aqui você faria a chamada real à API (fetch/axios). Exemplo:
  // const response = await api.post(`/jobs/${jobId}/cost-lines/`, costLine)
  // return response.data
  // Mock para exemplo:
  return new Promise((resolve) =>
    setTimeout(() => resolve({ ...costLine, id: Math.random().toString() }), 500),
  )
}
