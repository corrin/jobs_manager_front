import api from '@/plugins/axios'
import { CostLineSchema } from '@/schemas/costing.schemas'
import type { CostLine } from '@/types/costing.types'
import { debugLog } from '@/utils/debug'

export interface CostLineCreatePayload {
  kind: 'time' | 'material' | 'adjust'
  desc: string
  quantity: string
  unit_cost: string
  unit_rev: string
  ext_refs?: Record<string, unknown>
  meta?: Record<string, unknown>
}

export interface CostLineUpdatePayload {
  desc?: string
  quantity?: string
  unit_cost?: string
  unit_rev?: string
  ext_refs?: Record<string, unknown>
  meta?: Record<string, unknown>
}

export interface TimesheetCostLine extends CostLine {
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

export const getTimesheetEntries = async (
  staffId: string,
  date: string,
): Promise<TimesheetEntriesResponse> => {
  const response = await api.get('/job/rest/timesheet/entries/', {
    params: { staff_id: staffId, date },
  })

  return response.data
}

export const createCostLine = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual',
  payload: CostLineCreatePayload,
): Promise<CostLine> => {
  const response = await api.post(`/job/rest/jobs/${jobId}/cost_sets/${kind}/cost_lines/`, payload)

  const validatedData = CostLineSchema.parse(response.data)
  return validatedData
}

export const updateCostLine = async (
  id: number,
  payload: CostLineUpdatePayload,
): Promise<CostLine> => {
  const response = await api.patch(`/job/rest/cost_lines/${id}/`, payload)

  const validatedData = CostLineSchema.parse(response.data)
  return validatedData
}

export const deleteCostLine = async (id: number): Promise<void> => {
  debugLog('🚀 SERVICE: Starting DELETE request for cost line ID:', id)
  debugLog('🌐 DELETE URL:', `/job/rest/cost_lines/${id}/delete/`)

  try {
    const response = await api.delete(`/job/rest/cost_lines/${id}/delete/`)
    debugLog('✅ SERVICE: DELETE request completed successfully:', response.status, response.data)
    return response.data
  } catch (error) {
    debugLog('❌ SERVICE: DELETE request failed:', error)
    throw error
  }
}

export const costlineService = {
  createCostLine,
  updateCostLine,
  deleteCostLine,
}
