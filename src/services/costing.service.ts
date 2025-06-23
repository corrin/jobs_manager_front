import api from '@/plugins/axios'
import { CostSetSchema } from '@/schemas/costing.schemas'
import type { CostSet } from '@/types/costing.types'

export const fetchCostSet = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual' = 'estimate',
): Promise<CostSet> => {
  const response = await api.get(`/job/rest/jobs/${jobId}/cost_sets/${kind}/`)

  const validatedData = CostSetSchema.parse(response.data)

  return validatedData
}
