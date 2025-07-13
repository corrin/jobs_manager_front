import { z } from 'zod'
import { TimesheetCostLineSchema } from '@/api/generated/api'

// UI-specific extension of TimesheetCostLine with client-side metadata
export const TimesheetEntryWithMetaSchema = TimesheetCostLineSchema.extend({
  tempId: z.string().optional(),
  _isSaving: z.boolean().optional(),
  isNewRow: z.boolean().optional(),
  isModified: z.boolean().optional(),
})

export type TimesheetEntryWithMeta = z.infer<typeof TimesheetEntryWithMetaSchema>

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
