import axios from 'axios'
import { ref } from 'vue'

export interface ErrorRecord {
  id: string
  created: string
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
  ): Promise<{ results: ErrorRecord[]; total: number }> {
    error.value = null
    try {
      const params: Record<string, unknown> = { page, search }
      if (range.start) params.start = range.start
      if (range.end) params.end = range.end
      const res = await axios.get(`/api/errors/${type}/`, { params })
      return res.data
    } catch (e: unknown) {
      if (e instanceof Error) error.value = e.message
      else error.value = 'Failed to fetch errors.'
      return { results: [], total: 0 }
    }
  }

  return { fetchErrors, error }
}
