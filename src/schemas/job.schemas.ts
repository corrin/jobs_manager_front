import { z } from 'zod'
import { CostSetSchema } from './costing.schemas'

export const QuoteSheetSchema = z.object({
  id: z.string(),
  sheet_id: z.string(),
  sheet_url: z.string(),
  tab: z.string(),
  job_id: z.string(),
  job_number: z.string(),
  job_name: z.string(),
})

export const CompanyDefaultsSchema = z.object({
  materials_markup: z.number(),
  time_markup: z.number(),
  charge_out_rate: z.number(),
  wage_rate: z.number(),
})

export const JobEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  event_type: z.string(),
  description: z.string(),
  staff: z.string().nullable(),
})

export const InvoiceSchema = z.object({
  id: z.string(),
  xero_id: z.string(),
  number: z.string(),
  status: z.string(),
  date: z.string(),
  due_date: z.string().nullable(),
  total_excl_tax: z.number(),
  total_incl_tax: z.number(),
  amount_due: z.number(),
  online_url: z.string().nullable().optional(),
})

export const QuoteSchema = z.object({
  id: z.string(),
  xero_id: z.string(),
  status: z.string(),
  date: z.string(),
  total_excl_tax: z.number(),
  total_incl_tax: z.number(),
  online_url: z.string().nullable().optional(),
})

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
  complex_job: z.boolean().optional(),
  pricing_methodology: z.enum(['fixed_price', 'time_materials']),
  created_at: z.string(),
  updated_at: z.string(),
  delivery_date: z.string().nullable().optional(),
  quote_acceptance_date: z.string().nullable().optional(),
  quoted: z.boolean().optional(),
  invoiced: z.boolean().optional(),
  paid: z.boolean().optional(),
  charge_out_rate: z.string().optional(),

  // LEGACY PRICING FIELDS REMOVED - Use CostSet/CostLine instead
  // latest_estimate_pricing, latest_quote_pricing, latest_reality_pricing removed

  latest_estimate: CostSetSchema.nullable().optional(),
  latest_quote: CostSetSchema.nullable().optional(),
  latest_actual: CostSetSchema.nullable().optional(),

  quote_sheet: QuoteSheetSchema.nullable().optional(),

  // LEGACY PRICING FIELD REMOVED - Use CostSet/CostLine instead
  // latest_pricings removed

  company_defaults: z
    .object({
      materials_markup: z.number(),
      time_markup: z.number(),
      charge_out_rate: z.number(),
      wage_rate: z.number(),
    })
    .nullable()
    .optional(),
  events: z.array(JobEventSchema).optional(),
  invoice: InvoiceSchema.nullable().optional(),
  quote: QuoteSchema.nullable().optional(),
})

export const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
})

export const JobUpdateResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    job: JobDetailSchema,
    // LEGACY PRICING FIELDS REMOVED - Use CostSet/CostLine instead
    // latest_pricings removed
    events: z.array(JobEventSchema).optional(),
    company_defaults: z
      .object({
        materials_markup: z.number(),
        time_markup: z.number(),
        charge_out_rate: z.number(),
        wage_rate: z.number(),
      })
      .optional(),
  }),
  message: z.string().optional(),
})

// LEGACY CREATE SCHEMAS REMOVED - Use CostLine endpoints instead
// TimeEntryCreateSchema, MaterialEntryCreateSchema, AdjustmentEntryCreateSchema removed

export const JobFileSchema = z.object({
  id: z.string(),
  filename: z.string(),
  size: z.number().nullable(),
  mime_type: z.string().nullable(),
  uploaded_at: z.string(),
  print_on_jobsheet: z.boolean(),
  download_url: z.string().url(),
  thumbnail_url: z.string().url().nullable(),
  status: z.enum(['active', 'deleted']),
})

export const FileListResponseSchema = z
  .array(JobFileSchema)
  .describe('List of files associated with a job')

export const UploadFilesResponseSchema = z
  .object({
    status: z.string(),
    uploaded: z.array(JobFileSchema),
    message: z.string().optional(),
    errors: z.array(z.string()).optional(),
  })
  .describe('Response from file upload endpoint')

export type QuoteSheet = z.infer<typeof QuoteSheetSchema>
// LEGACY TYPES REMOVED - Use CostSet/CostLine types instead
// JobPricing, TimeEntryCreate, MaterialEntryCreate, AdjustmentEntryCreate removed
export type CompanyDefaults = z.infer<typeof CompanyDefaultsSchema>
export type JobDetail = z.infer<typeof JobDetailSchema>
export type ApiSuccessResponse = z.infer<typeof ApiSuccessResponseSchema>
export type JobUpdateResponse = z.infer<typeof JobUpdateResponseSchema>
// LEGACY CREATE TYPES REMOVED - Use CostLine endpoints instead
// TimeEntryCreate, MaterialEntryCreate, AdjustmentEntryCreate removed
export type JobEvent = z.infer<typeof JobEventSchema>
export type FileListResponse = z.infer<typeof FileListResponseSchema>
export type JobFile = z.infer<typeof JobFileSchema>
