import { apiClient } from '@/api/apiClient'
import type { JobSelectionItem } from '@/types/job.types'
import { debugLog } from '@/utils/debug'

export async function searchJobs(query: string): Promise<JobSelectionItem[]> {
  try {
    const response = await apiClient.get('/jobs/rest/jobs/search/', {
      params: { q: query },
    })
    return response.data
  } catch (error) {
    debugLog('Error searching jobs:', error)
    throw error
  }
}
