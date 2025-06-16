import { z } from 'zod'

// Schema para CostLine baseado na estrutura real do backend
export const CostLineSchema = z.object({
  id: z.number(), // ID é number, não string
  kind: z.enum(['time', 'material', 'adjust']),
  desc: z.string(),
  quantity: z.string(), // Quantity vem como string do backend
  unit_cost: z.string(), // Unit_cost vem como string do backend
  unit_rev: z.string(), // Unit_rev vem como string do backend
  total_cost: z.number(),
  total_rev: z.number(),
  ext_refs: z.record(z.any()).optional(),
  meta: z.record(z.any())
})

// Schema para CostSet baseado na estrutura real do backend
export const CostSetSchema = z.object({
  id: z.number(), // ID é number, não string
  kind: z.enum(['estimate', 'quote', 'actual']),
  rev: z.number(),
  summary: z.object({
    cost: z.number(),
    rev: z.number(),
    hours: z.number()
  }),
  created: z.string(), // Data de criação
  cost_lines: z.array(CostLineSchema)
})

// Tipos derivados dos schemas para uso interno
export type CostLine = z.infer<typeof CostLineSchema>
export type CostSet = z.infer<typeof CostSetSchema>
