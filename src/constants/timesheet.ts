/**
 * UI-specific constants for timesheet calculations.
 * This file defines the shape of timesheet entries metadata for frontend interactions.
 * NOT RELATED TO BACKEND SCHEMAS.
 */

import { z } from 'zod'
import { schemas } from '@/api/generated/api'

/**
 * Schema for timesheet entry metadata (UI-specific extension of backend schema).
 */
export const TimesheetEntryWithMetaSchema = schemas.TimesheetCostLine.extend({
  tempId: z.string().optional(),
  _isSaving: z.boolean().optional(),
  isNewRow: z.boolean().optional(),
  isModified: z.boolean().optional(),
})

export type TimesheetEntryWithMeta = z.infer<typeof TimesheetEntryWithMetaSchema>

export type TimesheetEntryJobSelectionItem = Pick<
  z.infer<typeof schemas.ModernTimesheetJob>,
  'id' | 'job_number' | 'name' | 'client_name' | 'status' | 'charge_out_rate'
>
