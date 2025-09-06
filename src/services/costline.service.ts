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
  // 🔍 DEBUG: Log cost line creation
  console.log('🔍 COSTLINE SERVICE DEBUG - Creating cost line:')
  console.log('  - Job ID:', jobId)
  console.log('  - Kind:', kind)
  console.log('  - Payload:', payload)

  let result: CostLineCreateUpdate

  if (kind === 'actual') {
    result = await api.job_rest_jobs_cost_sets_actual_cost_lines_create(payload, {
      params: { job_id: String(jobId) },
    })
  } else {
    result = await api.job_rest_jobs_cost_sets_cost_lines_create(payload, {
      params: { job_id: String(jobId), kind },
    })
  }

  console.log('🔍 COSTLINE SERVICE DEBUG - Created cost line result:', result)
  return result
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
  console.log('🔍 COSTLINE SERVICE DEBUG - Deleting cost line:', id)

  try {
    await api.job_rest_cost_lines_delete_destroy(undefined, {
      params: { cost_line_id: id },
    })
    debugLog('✅ SERVICE: DELETE request completed successfully')
    console.log('🔍 COSTLINE SERVICE DEBUG - Successfully deleted cost line:', id)
  } catch (error) {
    debugLog('❌ SERVICE: DELETE request failed:', error)
    console.error('🔍 COSTLINE SERVICE DEBUG - Delete failed:', error)
    throw error
  }
}

export const costlineService = {
  createCostLine,
  updateCostLine,
  deleteCostLine,
}
