import api from '@/services/api'

export interface ValidationIssue {
  severity: 'error' | 'warning'
  message: string
  line_number?: number
  column?: string
}

export interface DraftLine {
  supplier: string
  ref: string
  description: string
  quantity: number
  unit_cost: number
  total_cost: number
  category?: string
}

export interface DiffPreview {
  additions_count: number
  updates_count: number
  deletions_count: number
  total_changes: number
  next_revision: number
}

export interface ValidationReport {
  issues: ValidationIssue[]
  warnings: string[]
  errors: string[]
}

export interface PreviewResult {
  success: boolean
  validation_report: ValidationReport
  can_proceed: boolean
  draft_lines: DraftLine[]
  diff_preview: DiffPreview | null
  error?: string
}

export interface QuoteImportPreviewResponse {
  job_id: string
  job_name: string
  preview: PreviewResult
}

export interface CostSet {
  id: number
  kind: 'quote'
  rev: number
  created: string
  summary: {
    cost: number
    rev: number
    hours: number
  }
  cost_lines: any[]
}

export interface ImportChanges {
  additions: number
  updates: number
  deletions: number
}

export interface ImportValidation {
  warnings_count?: number
  has_warnings?: boolean
  errors_count?: number
  critical_count?: number
  can_proceed?: boolean
}

export interface QuoteImportResponse {
  success: boolean
  message?: string
  job_id: string
  cost_set?: CostSet
  changes?: ImportChanges
  validation?: ImportValidation
  error?: string
}

export interface QuoteStatusResponse {
  job_id: string
  job_name: string
  has_quote: boolean
  quote?: CostSet
  revision?: number
}

export class QuoteImportService {
  async previewQuoteImport(jobId: string, file: File): Promise<QuoteImportPreviewResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await api.post(
      `/job/rest/jobs/${jobId}/quote/import/preview/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    return response.data
  }

  async importQuote(
    jobId: string,
    file: File,
    skipValidation: boolean = false
  ): Promise<QuoteImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (skipValidation) {
      formData.append('skip_validation', 'true')
    }

    const response = await api.post(
      `/job/rest/jobs/${jobId}/quote/import/`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )

    return response.data
  }

  async getQuoteStatus(jobId: string): Promise<QuoteStatusResponse> {
    const response = await api.get(`/job/rest/jobs/${jobId}/quote/status/`)
    return response.data
  }
}

// Export singleton instance
export const quoteImportService = new QuoteImportService()
