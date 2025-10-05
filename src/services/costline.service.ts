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
    debugLog('Error fetching timesheet entries:', error)
    throw error
  }
}

export const createCostLine = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual',
  payload: CostLineCreateUpdate,
): Promise<CostLineCreateUpdate> => {
  debugLog('🔍 COSTLINE SERVICE DEBUG - Creating cost line:')
  debugLog('  - Job ID:', jobId)
  debugLog('  - Kind:', kind)
  debugLog('  - Payload:', payload)

  // Ensure required fields expected by schema are present
  const now = new Date().toISOString()
  const p = payload as Partial<CostLineCreateUpdate>
  const body: CostLineCreateUpdate = {
    ...payload,
    created_at: p.created_at ?? now,
    updated_at: p.updated_at ?? now,
    ext_refs: p.ext_refs ?? {},
    meta: p.meta ?? {},
  }

  let result: CostLineCreateUpdate

  if (kind === 'actual') {
    result = await api.job_rest_jobs_cost_sets_actual_cost_lines_create(body, {
      params: { job_id: String(jobId) },
    })
  } else {
    result = await api.job_rest_jobs_cost_sets_cost_lines_create(body, {
      params: { job_id: String(jobId), kind },
    })
  }

  debugLog('🔍 COSTLINE SERVICE DEBUG - Created cost line result:', result)
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
  debugLog('🔍 COSTLINE SERVICE DEBUG - Deleting cost line:', id)

  try {
    await api.job_rest_cost_lines_delete_destroy(undefined, {
      params: { cost_line_id: id },
    })
    debugLog('✅ SERVICE: DELETE request completed successfully')
    debugLog('🔍 COSTLINE SERVICE DEBUG - Successfully deleted cost line:', id)
  } catch (error) {
    debugLog('❌ SERVICE: DELETE request failed:', error)
    debugLog('🔍 COSTLINE SERVICE DEBUG - Delete failed:', error)
    throw error
  }
}

export const costlineService = {
  createCostLine,
  updateCostLine,
  deleteCostLine,
}
