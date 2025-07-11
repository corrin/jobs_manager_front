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
