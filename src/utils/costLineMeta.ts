import { schemas } from '@/api/generated/api'
import { z } from 'zod'

type CostSet = z.infer<typeof schemas.CostSet>
type Job = z.infer<typeof schemas.Job>

function getCostSetHours(costSet?: CostSet | null): number {
  if (!costSet) return 0

  const summaryHours = costSet.summary?.hours
  if (typeof summaryHours === 'number' && Number.isFinite(summaryHours)) {
    return summaryHours
  }

  return costSet.cost_lines.reduce((sum, line) => sum + (line.quantity || 0), 0)
}

export function getJobEstimatedHours(job: Job): number {
  if (!job) return 0

  const methodology = job.pricing_methodology ?? 'time_materials'
  const estimateHours = getCostSetHours(job.latest_estimate ?? null)
  const quoteHours = getCostSetHours(job.latest_quote ?? null)

  if (methodology === 'fixed_price') {
    if (quoteHours > 0) return quoteHours
    if (estimateHours > 0) return estimateHours
    return quoteHours
  }

  if (estimateHours > 0) return estimateHours
  if (quoteHours > 0) return quoteHours
  return estimateHours
}

export function getJobActualHours(job: Job): number {
  if (!job) return 0
  return getCostSetHours(job.latest_actual ?? null)
}

export function getCostSetHoursSafe(costSet?: CostSet | null): number {
  return getCostSetHours(costSet)
}
