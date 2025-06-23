import { z } from 'zod'

export const CostLineSchema = z.object({
  id: z.number(),
  kind: z.enum(['time', 'material', 'adjust']),
  desc: z.string(),
  quantity: z.string(),
  unit_cost: z.string(),
  unit_rev: z.string(),
  total_cost: z.number(),
  total_rev: z.number(),
  ext_refs: z.record(z.any()).optional(),
  meta: z.record(z.any()),
})

export const CostSetSchema = z.object({
  id: z.number(),
  kind: z.enum(['estimate', 'quote', 'actual']),
  rev: z.number(),
  summary: z.object({
    cost: z.number(),
    rev: z.number(),
    hours: z.number(),
  }),
  created: z.string(),
  cost_lines: z.array(CostLineSchema),
})

export type CostLine = z.infer<typeof CostLineSchema>
export type CostSet = z.infer<typeof CostSetSchema>
