import { api } from '@/api/client'
import type {
  CostLineCreateUpdate,
  PatchedCostLineCreateUpdate,
  ModernTimesheetEntryGetResponse,
} from '@/api/generated/api'
import { debugLog } from '@/utils/debug'

// Use generated response type for timesheet entries
export type TimesheetEntriesResponse = ModernTimesheetEntryGetResponse

export const getTimesheetEntries = async (
  staffId: string,
  date: string,
): Promise<TimesheetEntriesResponse> => {
  try {
    return await api.job_rest_timesheet_entries_retrieve({
      queries: {
        staff_id: staffId,
        date: date,
      },
    })
  } catch (error) {
    console.error('Error fetching timesheet entries:', error)
    throw error
  }
}

export const createCostLine = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual',
  payload: CostLineCreateUpdate,
): Promise<CostLineCreateUpdate> => {
  if (kind === 'actual') {
    return await api.job_rest_jobs_cost_sets_actual_cost_lines_create(payload, {
      params: { job_id: String(jobId) },
    })
  } else {
    return await api.job_rest_jobs_cost_sets_cost_lines_create(payload, {
      params: { job_id: String(jobId), kind },
    })
  }
}

export const updateCostLine = async (
  id: string,
  payload: PatchedCostLineCreateUpdate,
): Promise<CostLineCreateUpdate> => {
  return await api.job_rest_cost_lines_partial_update(payload, {
    params: { cost_line_id: id },
  })
}

export const deleteCostLine = async (id: string): Promise<void> => {
  debugLog('🚀 SERVICE: Starting DELETE request for cost line ID:', id)

  try {
    await api.job_rest_cost_lines_delete_destroy(undefined, {
      params: { cost_line_id: id },
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
