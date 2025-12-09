import { api } from '@/api/client'
import axios from 'axios'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'
import { debugLog } from '@/utils/debug'

type CostLineRequest = z.infer<typeof schemas.CostLineCreateUpdateRequest>
type PatchedCostLineRequest = z.infer<typeof schemas.PatchedCostLineCreateUpdateRequest>
type CostLineResponse = z.infer<typeof schemas.CostLineCreateUpdate>
export type TimesheetEntriesResponse = z.infer<typeof schemas.ModernTimesheetEntryGetResponse>

export const getTimesheetEntries = async (
  staffId: string,
  date: string,
): Promise<TimesheetEntriesResponse> => {
  try {
    const response = await axios.get('/job/rest/timesheet/entries/', {
      params: {
        staff_id: staffId,
        date,
      },
    })
    return schemas.ModernTimesheetEntryGetResponse.parse(response.data)
  } catch (error) {
    debugLog('Error fetching timesheet entries:', error)
    throw error
  }
}

export const createCostLine = async (
  jobId: string | number,
  kind: 'estimate' | 'quote' | 'actual',
  payload: CostLineRequest,
): Promise<CostLineResponse> => {
  debugLog('?Y"? COSTLINE SERVICE DEBUG - Creating cost line:')
  debugLog('  - Job ID:', jobId)
  debugLog('  - Kind:', kind)
  debugLog('  - Payload:', payload)

  const now = new Date().toISOString()
  const body: CostLineRequest = {
    ...payload,
    kind: payload.kind ?? kind,
    ext_refs: payload.ext_refs ?? {},
    meta: payload.meta ?? {},
    accounting_date: payload.accounting_date ?? now,
  }

  const result =
    kind === 'actual'
      ? await api.job_rest_jobs_cost_sets_actual_cost_lines_create(body, {
          params: { job_id: String(jobId) },
        })
      : await api.job_rest_jobs_cost_sets_cost_lines_create(body, {
          params: { job_id: String(jobId), kind },
        })

  debugLog('?Y"? COSTLINE SERVICE DEBUG - Created cost line result:', result)
  return result
}

export const updateCostLine = async (
  id: string,
  payload: PatchedCostLineRequest,
): Promise<CostLineResponse> => {
  return await api.job_rest_cost_lines_partial_update(payload, {
    params: { cost_line_id: id },
  })
}

export const deleteCostLine = async (id: string): Promise<void> => {
  debugLog('?Ys? SERVICE: Starting DELETE request for cost line ID:', id)
  debugLog('?Y"? COSTLINE SERVICE DEBUG - Deleting cost line:', id)

  try {
    await api.job_rest_cost_lines_delete_destroy(undefined, {
      params: { cost_line_id: id },
    })
    debugLog('?o. SERVICE: DELETE request completed successfully')
    debugLog('?Y"? COSTLINE SERVICE DEBUG - Successfully deleted cost line:', id)
  } catch (error) {
    debugLog('??O SERVICE: DELETE request failed:', error)
    debugLog('?Y"? COSTLINE SERVICE DEBUG - Delete failed:', error)
    throw error
  }
}

export const costlineService = {
  createCostLine,
  updateCostLine,
  deleteCostLine,
}
