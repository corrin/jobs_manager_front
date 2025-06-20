/**
 * Quote Service
 *
 * Handles quote spreadsheet operations including linking, refreshing, and syncing
 * with Google Sheets integration.
 */

import api from './api'
import type { QuoteSheet } from '../schemas/job.schemas'

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
  cost_set?: any
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
  /**
   * Link a job to a Google Sheets quote template
   */
  async linkQuote(jobId: string, templateUrl?: string): Promise<QuoteSheet> {
    const payload = templateUrl ? { template_url: templateUrl } : {}

    // Use longer timeout for quote linking as it involves Google Sheets operations
    const response = await api.post(`/job/rest/jobs/${jobId}/quote/link/`, payload, {
      timeout: 30000 // 30 seconds for Google Sheets operations
    })
    return response.data
  }

  /**
   * Preview quote changes from linked Google Sheet
   */
  async previewQuote(jobId: string): Promise<QuotePreview> {
    const response = await api.post(`/job/rest/jobs/${jobId}/quote/preview/`)
    return response.data
  }

  /**
   * Apply quote changes from linked Google Sheet
   */
  async applyQuote(jobId: string): Promise<QuoteApplyResult> {
    const response = await api.post(`/job/rest/jobs/${jobId}/quote/apply/`)
    return response.data
  }

  /**
   * Check if job has a linked quote sheet
   */
  hasLinkedSheet(job: any): boolean {
    return !!(job?.quote_sheet?.sheet_url)
  }

  /**
   * Get the Google Sheets URL for a job
   */
  getSheetUrl(job: any): string | null {
    return job?.quote_sheet?.sheet_url || null
  }
}

export const quoteService = new QuoteService()
export default quoteService
