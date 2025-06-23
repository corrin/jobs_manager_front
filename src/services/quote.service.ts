import api from './api'
import type { QuoteSheet } from '../schemas/job.schemas'
import type { CostLine } from '@/types/costing.types'
import type { Job } from '@/types/index'

export interface QuotePreview {
  draft_lines: Array<{
    kind: string
    desc: string
    quantity: number
    unit_cost: number
    total_cost: number
    category?: string
  }>
  diff_preview: {
    additions_count: number
    updates_count: number
    deletions_count: number
    total_changes: number
    next_revision: number
    current_revision?: number
    net_cost_change?: number
    net_revenue_change?: number
  }
  can_proceed: boolean
  success: boolean
  validation_report?: {
    warnings: string[]
    errors: string[]
  } | null
}

export interface QuoteApplyResult {
  success: boolean
  message: string
  cost_set?: CostLine[]
  draft_lines?: Array<{
    kind: string
    desc: string
    quantity: number
    unit_cost: number
    total_cost: number
  }>
  error?: string
}

class QuoteService {
  async linkQuote(jobId: string, templateUrl?: string): Promise<QuoteSheet> {
    const payload = templateUrl ? { template_url: templateUrl } : {}

    const response = await api.post(`/job/rest/jobs/${jobId}/quote/link/`, payload, {
      timeout: 30000,
    })
    return response.data
  }

  async previewQuote(jobId: string): Promise<QuotePreview> {
    const response = await api.post(`/job/rest/jobs/${jobId}/quote/preview/`)
    return response.data
  }

  async applyQuote(jobId: string): Promise<QuoteApplyResult> {
    const response = await api.post(`/job/rest/jobs/${jobId}/quote/apply/`)
    return response.data
  }

  hasLinkedSheet(job: Job): boolean {
    return !!job?.quote_sheet?.sheet_url
  }

  getSheetUrl(job: Job): string | null {
    return job?.quote_sheet?.sheet_url || null
  }
}

export const quoteService = new QuoteService()
export default quoteService
