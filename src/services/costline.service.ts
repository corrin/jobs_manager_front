import { api } from '@/api/generated/api'
import type { CostLineCreateUpdate, ModernTimesheetEntryGetResponse } from '@/api/generated/api'
import { debugLog } from '@/utils/debug'

// Local types for create/update payloads (simplified interfaces for UI)
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

// Use generated response type for timesheet entries
export type TimesheetEntriesResponse = ModernTimesheetEntryGetResponse

export const getTimesheetEntries = async (
  staffId: string,
  date: string,
): Promise<TimesheetEntriesResponse> => {
  return await api.job_rest_timesheet_entries_list({
    params: { query: { staff_id: staffId, date } },
  })
}

export const createCostLine = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual',
  payload: CostLineCreatePayload,
): Promise<CostLineCreateUpdate> => {
  if (kind === 'actual') {
    return await api.job_rest_jobs_cost_sets_actual_cost_lines_create({
      params: { path: { job_id: String(jobId) } },
      body: payload as CostLineCreateUpdate,
    })
  } else {
    return await api.job_rest_jobs_cost_sets_cost_lines_create({
      params: { path: { job_id: String(jobId), kind } },
      body: payload as CostLineCreateUpdate,
    })
  }
}

export const updateCostLine = async (
  id: number,
  payload: CostLineUpdatePayload,
): Promise<CostLineCreateUpdate> => {
  return await api.job_rest_cost_lines_partial_update({
    params: { path: { cost_line_id: String(id) } },
    body: payload as CostLineCreateUpdate,
  })
}

export const deleteCostLine = async (id: number): Promise<void> => {
  debugLog('🚀 SERVICE: Starting DELETE request for cost line ID:', id)

  try {
    await api.job_rest_cost_lines_delete_destroy({
      params: { path: { cost_line_id: String(id) } },
    })
    debugLog('✅ SERVICE: DELETE request completed successfully')
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
