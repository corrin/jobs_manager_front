import { z } from 'zod'

// Schema para JobPricing baseado na estrutura real do backend
export const JobPricingSchema = z.object({
  id: z.string(),
  pricing_stage: z.enum(['estimate', 'quote', 'reality']),
  revision_number: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  time_entries: z.array(z.object({
    id: z.string(),
    description: z.string(),
    items: z.number(),
    minutes_per_item: z.string().transform(val => parseFloat(val)), // Converte string para number
    wage_rate: z.string().transform(val => parseFloat(val)), // Converte string para number  
    charge_out_rate: z.string().transform(val => parseFloat(val)), // Converte string para number
    total_minutes: z.number(),
    revenue: z.number(),
    cost: z.number(),
    staff_id: z.string().nullable(),
    timesheet_date: z.string().nullable(),
    staff_name: z.string().nullable()
  })).default([]),
  material_entries: z.array(z.object({
    id: z.string(),
    item_code: z.string().optional(),
    description: z.string(),
    quantity: z.string().transform(val => parseFloat(val)), // Converte string para number
    unit_cost: z.string().transform(val => parseFloat(val)), // Converte string para number
    unit_revenue: z.string().transform(val => parseFloat(val)), // Converte string para number
    revenue: z.number(),
    cost: z.number(),
    comments: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string()
  })).default([]),
  adjustment_entries: z.array(z.object({
    id: z.string(),
    description: z.string(),
    cost_adjustment: z.string().transform(val => parseFloat(val)), // Converte string para number
    price_adjustment: z.string().transform(val => parseFloat(val)), // Converte string para number
    revenue: z.number(),
    cost: z.number(),
    comments: z.string().optional(),
    created_at: z.string(),
    updated_at: z.string()
  })).default([])
})

// Schema para CompanyDefaults
export const CompanyDefaultsSchema = z.object({
  materials_markup: z.number(),
  time_markup: z.number(),
  charge_out_rate: z.number(),
  wage_rate: z.number()
})

// Schema para JobEvent
export const JobEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  event_type: z.string(),
  description: z.string(),
  staff: z.string().nullable()
})

// Schema para Job completo (usado no JobView) - corrigindo estrutura real
export const JobDetailSchema = z.object({
  id: z.string(),
  name: z.string(),
  job_number: z.number(),
  client_id: z.string(),
  client_name: z.string(),
  description: z.string().nullable().optional(),
  order_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  contact_id: z.string().nullable().optional(),
  contact_name: z.string().nullable().optional(),
  job_status: z.string(),
  complex_job: z.boolean().optional(), // Campo opcional que vem do backend
  pricing_methodology: z.enum(['fixed_price', 'time_materials']),
  created_at: z.string(),
  updated_at: z.string(),
  delivery_date: z.string().nullable().optional(),
  quote_acceptance_date: z.string().nullable().optional(),
  quoted: z.boolean().optional(),
  invoiced: z.boolean().optional(),
  paid: z.boolean().optional(),
  charge_out_rate: z.string().optional(),
  // Pricing data - estrutura real do backend
  latest_estimate_pricing: JobPricingSchema.optional(),
  latest_quote_pricing: JobPricingSchema.optional(),
  latest_reality_pricing: JobPricingSchema.optional(),
  // Estrutura enriquecida que vem do frontend (composables)
  latest_pricings: z.object({
    estimate: JobPricingSchema.nullable().optional(),
    quote: JobPricingSchema.nullable().optional(),
    reality: JobPricingSchema.nullable().optional()
  }).optional(),
  // Company defaults adicionados no frontend
  company_defaults: z.object({
    materials_markup: z.number(),
    time_markup: z.number(),
    charge_out_rate: z.number(),
    wage_rate: z.number()
  }).nullable().optional(),
  // Events
  events: z.array(JobEventSchema).optional()
})

// Schema para resposta de API simples (apenas notificação de sucesso)
export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional()
})

// Schema para resposta com job atualizado - baseado em JobRestService.get_job_for_edit
export const JobUpdateResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    job: JobDetailSchema,
    latest_pricings: z.object({
      estimate: JobPricingSchema.nullable().optional(),
      quote: JobPricingSchema.nullable().optional(),
      reality: JobPricingSchema.nullable().optional()
    }).optional(),
    events: z.array(JobEventSchema).optional(),
    company_defaults: z.object({
      materials_markup: z.number(),
      time_markup: z.number(),
      charge_out_rate: z.number(),
      wage_rate: z.number()
    }).optional()
  }),
  message: z.string().optional()
})

// Schemas para criação de entradas - baseados na estrutura real do backend
export const TimeEntryCreateSchema = z.object({
  job_pricing_id: z.string(),
  description: z.string(),
  items: z.number().positive().default(1),
  minutes_per_item: z.number().positive(), // Minutos por item
  wage_rate: z.number().nonnegative().optional(),
  charge_out_rate: z.number().nonnegative().optional(),
  staff_id: z.string().optional()
})

export const MaterialEntryCreateSchema = z.object({
  job_pricing_id: z.string(),
  description: z.string(),
  quantity: z.number().positive(),
  unit_cost: z.number().nonnegative(),
  unit_revenue: z.number().nonnegative(),
  item_code: z.string().optional(),
  comments: z.string().optional()
})

export const AdjustmentEntryCreateSchema = z.object({
  job_pricing_id: z.string(),
  description: z.string(),
  cost_adjustment: z.number(),
  price_adjustment: z.number(),
  comments: z.string().optional()
})

// Tipos inferidos dos schemas
export type JobPricing = z.infer<typeof JobPricingSchema>
export type CompanyDefaults = z.infer<typeof CompanyDefaultsSchema>
export type JobDetail = z.infer<typeof JobDetailSchema>
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>
export type JobUpdateResponse = z.infer<typeof JobUpdateResponseSchema>
export type TimeEntryCreate = z.infer<typeof TimeEntryCreateSchema>
export type MaterialEntryCreate = z.infer<typeof MaterialEntryCreateSchema>
export type AdjustmentEntryCreate = z.infer<typeof AdjustmentEntryCreateSchema>
export type JobEvent = z.infer<typeof JobEventSchema>
