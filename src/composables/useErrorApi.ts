import axios from 'axios'
import { ref } from 'vue'

export interface ErrorRecord {
  id: string
  timestamp: string
  message: string
  entity?: string
  severity?: string
  stack?: string
}

interface DateRange {
  start: string | null
  end: string | null
}

export function useErrorApi() {
  const error = ref<string | null>(null)

  async function fetchErrors(
    type: 'xero' | 'system',
    page: number,
    search: string,
    range: DateRange,
  ): Promise<{ results: ErrorRecord[]; totalCount: number }> {
    error.value = null
    try {
      const params: Record<string, unknown> = { page, search }
      if (range.start) params.start = range.start
      if (range.end) params.end = range.end
      const base = import.meta.env.VITE_API_BASE_URL || ''
      const res = await axios.get(`${base}/xero-errors/`, { params })
      return {
        results: res.data.results,
        totalCount: res.data.count,
      }
    } catch (e: unknown) {
      if (e instanceof Error) error.value = e.message
      else error.value = 'Failed to fetch errors.'
      return { results: [], totalCount: 0 }
    }
  }

  return { fetchErrors, error }
}
