import api from '@/plugins/axios'
import { CostLineSchema } from '@/schemas/costing.schemas'
import type { CostLine } from '@/types/costing.types'

/**
 * CostLine Service
 *
 * Service layer for CostLine CRUD operations following SRP principles
 * Handles API communication and data validation for timesheet CostLine management
 */

export interface CostLineCreatePayload {
  kind: 'time' | 'material' | 'adjust'
  desc: string
  quantity: string
  unit_cost: string
  unit_rev: string
  ext_refs?: Record<string, any>
  meta?: Record<string, any>
}

export interface CostLineUpdatePayload {
  desc?: string
  quantity?: string
  unit_cost?: string
  unit_rev?: string
  ext_refs?: Record<string, any>
  meta?: Record<string, any>
}

export interface TimesheetCostLine extends CostLine {
  // Additional fields returned by TimesheetCostLineSerializer
  job_id: string
  job_number: string
  job_name: string
  client_name: string
  charge_out_rate: number
}

export interface TimesheetEntriesResponse {
  cost_lines: TimesheetCostLine[]
  staff: {
    id: string
    name: string
    firstName: string
    lastName: string
  }
  date: string
  summary: {
    total_hours: number
    billable_hours: number
    non_billable_hours: number
    total_cost: number
    total_revenue: number
    entry_count: number
  }
}

/**
 * Get timesheet entries for a specific staff member and date
 */
export const getTimesheetEntries = async (
  staffId: string,
  date: string
): Promise<TimesheetEntriesResponse> => {
  const response = await api.get('/job/rest/timesheet/entries/', {
    params: { staff_id: staffId, date }
  })

  return response.data
}

/**
 * Create a new cost line
 */
export const createCostLine = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual',
  payload: CostLineCreatePayload
): Promise<CostLine> => {
  const response = await api.post(
    `/job/rest/jobs/${jobId}/cost_sets/${kind}/cost_lines/`,
    payload
  )

  // Validate the response data with Zod schema
  const validatedData = CostLineSchema.parse(response.data)
  return validatedData
}

/**
 * Update an existing cost line
 */
export const updateCostLine = async (
  id: number,
  payload: CostLineUpdatePayload
): Promise<CostLine> => {
  const response = await api.patch(`/job/rest/cost_lines/${id}/`, payload)

  // Validate the response data with Zod schema
  const validatedData = CostLineSchema.parse(response.data)
  return validatedData
}

/**
 * Delete a cost line
 */
export const deleteCostLine = async (id: number): Promise<void> => {
  await api.delete(`/job/rest/cost_lines/${id}/delete/`)
}

// Export service object for consistent usage
export const costlineService = {
  createCostLine,
  updateCostLine,
  deleteCostLine
}
