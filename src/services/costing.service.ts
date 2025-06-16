import api from './api'
import { CostSetSchema } from '@/schemas/costing.schemas'
import type { CostSet } from '@/types/costing.types'

/**
 * Fetch cost set data for a specific job and kind
 */
export const fetchCostSet = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual' = 'estimate'
): Promise<CostSet> => {
  const response = await api.get(`/job/rest/jobs/${jobId}/cost_sets/${kind}/`)

  // Validar dados recebidos com schema Zod
  const validatedData = CostSetSchema.parse(response.data)

  return validatedData
}
