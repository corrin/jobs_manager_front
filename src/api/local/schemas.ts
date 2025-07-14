import { z } from 'zod'
import { schemas } from '../generated/api'

// UI-specific extension of TimesheetCostLine with client-side metadata
export const TimesheetEntryWithMetaSchema = schemas.TimesheetCostLine.extend({
  tempId: z.string().optional(),
  _isSaving: z.boolean().optional(),
  isNewRow: z.boolean().optional(),
  isModified: z.boolean().optional(),
})

export type TimesheetEntryWithMeta = z.infer<typeof TimesheetEntryWithMetaSchema>

// Quote Import Schemas - For endpoints not yet covered by generated API
// REASON: The quote import endpoints (/job/rest/jobs/:id/quote/import/preview/ and
// /job/rest/jobs/:id/quote/import/) are not included in the OpenAPI spec, so we need
// local schemas for these specific file upload endpoints that use FormData

export const ValidationIssueSchema = z.object({
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  line_number: z.number().optional(),
  column: z.string().optional(),
})

export type ValidationIssue = z.infer<typeof ValidationIssueSchema>

export const DraftLineSchema = z.object({
  kind: z.string(),
  desc: z.string(),
  quantity: z.number(),
  unit_cost: z.number(),
  total_cost: z.number(),
  category: z.string().optional(),
})

export type DraftLine = z.infer<typeof DraftLineSchema>

export const DiffPreviewSchema = z.object({
  additions_count: z.number(),
  updates_count: z.number(),
  deletions_count: z.number(),
  total_changes: z.number(),
  next_revision: z.number(),
})

export type DiffPreview = z.infer<typeof DiffPreviewSchema>

// UI-specific CostLine with number types for calculations
// REASON: The API returns quantity/unit_cost/unit_rev as strings for decimal precision,
// but UI components need number types for calculations and display
export const UICostLineSchema = z.object({
  id: z.number(),
  kind: z.enum(['time', 'material', 'adjust']),
  desc: z.string(),
  quantity: z.number(),
  unit_cost: z.number(),
  unit_rev: z.number(),
  total_cost: z.number(),
  total_rev: z.number(),
  ext_refs: z.record(z.unknown()).optional(),
  meta: z.record(z.unknown()).optional(),
})

export type UICostLine = z.infer<typeof UICostLineSchema>

// UI-specific CostSet with converted cost lines
export const UICostSetSchema = z.object({
  id: z.number(),
  kind: z.enum(['estimate', 'quote', 'actual']),
  rev: z.number(),
  created: z.string(),
  summary: z
    .object({
      cost: z.number(),
      rev: z.number(),
      hours: z.number(),
    })
    .optional(),
  cost_lines: z.array(UICostLineSchema),
})

export type UICostSet = z.infer<typeof UICostSetSchema>

export const ValidationReportSchema = z.object({
  issues: z.array(ValidationIssueSchema),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
})

export type ValidationReport = z.infer<typeof ValidationReportSchema>

export const PreviewResultSchema = z.object({
  success: z.boolean(),
  validation_report: ValidationReportSchema,
  can_proceed: z.boolean(),
  draft_lines: z.array(DraftLineSchema),
  diff_preview: DiffPreviewSchema.nullable(),
  error: z.string().optional(),
})

export type PreviewResult = z.infer<typeof PreviewResultSchema>

export const QuoteImportPreviewResponseSchema = z.object({
  job_id: z.string(),
  job_name: z.string(),
  preview: PreviewResultSchema,
})

export type QuoteImportPreviewResponse = z.infer<typeof QuoteImportPreviewResponseSchema>

export const ImportChangesSchema = z.object({
  additions: z.number(),
  updates: z.number(),
  deletions: z.number(),
})

export type ImportChanges = z.infer<typeof ImportChangesSchema>

export const ImportValidationSchema = z.object({
  warnings_count: z.number().optional(),
  has_warnings: z.boolean().optional(),
  errors_count: z.number().optional(),
  critical_count: z.number().optional(),
  can_proceed: z.boolean().optional(),
})

export type ImportValidation = z.infer<typeof ImportValidationSchema>

export const QuoteImportResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  job_id: z.string(),
  cost_set: schemas.CostSet.optional(),
  changes: ImportChangesSchema.optional(),
  validation: ImportValidationSchema.optional(),
  error: z.string().optional(),
})

export type QuoteImportResponse = z.infer<typeof QuoteImportResponseSchema>

export const QuoteStatusResponseSchema = z.object({
  job_id: z.string(),
  job_name: z.string(),
  has_quote: z.boolean(),
  quote: schemas.CostSet.optional(),
  revision: z.number().optional(),
})

export type QuoteStatusResponse = z.infer<typeof QuoteStatusResponseSchema>

// Job with Financial Data - Fixes DRF Spectacular schema generation issue
// The generated Job schema defines latest_estimate, latest_actual, quote, invoice as z.object({})
// but the actual API returns structured data via SerializerMethodField in JobSerializer
// This schema defines the correct structure that the API actually returns
export const JobWithFinancialDataSchema = schemas.Job.extend({
  latest_estimate: z
    .object({
      summary: z
        .object({
          rev: z.number(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  latest_actual: z
    .object({
      summary: z
        .object({
          rev: z.number(),
        })
        .optional(),
      cost_lines: z
        .array(
          z.object({
            kind: z.string(),
            total_rev: z.number(),
          }),
        )
        .optional(),
    })
    .nullable()
    .optional(),
  quote: z
    .object({
      total_excl_tax: z.number(),
      online_url: z.string().optional(),
    })
    .nullable()
    .optional(),
  invoice: z
    .object({
      total_excl_tax: z.number(),
      online_url: z.string().optional(),
    })
    .nullable()
    .optional(),
})

export type JobWithFinancialData = z.infer<typeof JobWithFinancialDataSchema>

// Xero Sync Response for custom Xero endpoints that aren't in the generated API
export const XeroSyncResponseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
  xero_id: z.string().optional(),
  online_url: z.string().url().optional(),
  error_type: z.string().optional(),
  details: z.string().optional(),
})

export type XeroSyncResponse = z.infer<typeof XeroSyncResponseSchema>

/**
 * JobDetailResponseWithFinancialData - Local schema for JobDetailResponse with financial data
 *
 * REASON: DRF Spectacular cannot properly type complex JSONField structures in JobDetailResponse.
 * The generated JobDetailResponse.data (Job type) has latest_quote, quote, invoice as generic {} objects
 * due to SerializerMethodField and JSONField limitations in OpenAPI generation.
 *
 * This extends the generated JobDetailResponse to use JobWithFinancialData for proper typing
 * of financial fields (latest_quote.cost_lines, quote.total_excl_tax, etc.) in JobQuoteTab.vue.
 *
 * SIMILAR ISSUE: Same DRF Spectacular limitation as JobWithFinancialData, but for the
 * JobDetailResponse wrapper structure used by /job/rest/jobs/:id/ endpoint.
 */
export const JobDetailResponseWithFinancialDataSchema = schemas.JobDetailResponse.extend({
  data: JobWithFinancialDataSchema,
})

export type JobDetailResponseWithFinancialData = z.infer<
  typeof JobDetailResponseWithFinancialDataSchema
>

// Server-Sent Event type for Xero sync progress (UI-specific SSE events)
export const XeroSseEventSchema = z.object({
  datetime: z.string(),
  message: z.string(),
  severity: z.enum(['info', 'warning', 'error']).optional(),
  entity: z.string().nullable().optional(),
  progress: z.number().nullable().optional(),
  records_updated: z.number().nullable().optional(),
  status: z.string().nullable().optional(),
  overall_progress: z.number().optional(),
  entity_progress: z.number().optional(),
  sync_status: z.enum(['success', 'error', 'running']).optional(),
  error_messages: z.array(z.string()).optional(),
  missing_fields: z.array(z.string()).optional(),
})

export type XeroSseEvent = z.infer<typeof XeroSseEventSchema>

// UI-specific type for vue-advanced-chat component
// REASON: The vue-advanced-chat component requires a specific message format
// that differs from the API's JobQuoteChat structure
export const VueChatMessageSchema = z.object({
  _id: z.string(),
  content: z.string(),
  senderId: z.string(),
  username: z.string(),
  timestamp: z.string(),
  system: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
})

export type VueChatMessage = z.infer<typeof VueChatMessageSchema>
