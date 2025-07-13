import api from '../plugins/axios'
import { schemas } from '../api/generated/api'
import { z } from 'zod'

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
export interface ValidationIssue {
  severity: 'error' | 'warning'
  message: string
  line_number?: number
  column?: string
}

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
export interface DraftLine {
  supplier: string
  ref: string
  description: string
  quantity: number
  unit_cost: number
  total_cost: number
  category?: string
}

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
export interface DiffPreview {
  additions_count: number
  updates_count: number
  deletions_count: number
  total_changes: number
  next_revision: number
}

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
export interface ValidationReport {
  issues: ValidationIssue[]
  warnings: string[]
  errors: string[]
}

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
export interface PreviewResult {
  success: boolean
  validation_report: ValidationReport
  can_proceed: boolean
  draft_lines: DraftLine[]
  diff_preview: DiffPreview | null
  error?: string
}

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
export interface QuoteImportPreviewResponse {
  job_id: string
  job_name: string
  preview: PreviewResult
}

// Use generated type instead of deprecated interface
type CostSet = z.infer<typeof schemas.CostSet>

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
export interface ImportChanges {
  additions: number
  updates: number
  deletions: number
}

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
export interface ImportValidation {
  warnings_count?: number
  has_warnings?: boolean
  errors_count?: number
  critical_count?: number
  can_proceed?: boolean
}

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
export interface QuoteImportResponse {
  success: boolean
  message?: string
  job_id: string
  cost_set?: CostSet
  changes?: ImportChanges
  validation?: ImportValidation
  error?: string
}

/**
 * @deprecated Use generated types from src/api/generated instead
 * This interface will be removed after migration to openapi-zod-client generated types
 */
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

    const response = await api.post(`/job/rest/jobs/${jobId}/quote/import/preview/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  async importQuote(
    jobId: string,
    file: File,
    skipValidation: boolean = false,
  ): Promise<QuoteImportResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (skipValidation) {
      formData.append('skip_validation', 'true')
    }

    const response = await api.post(`/job/rest/jobs/${jobId}/quote/import/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return response.data
  }

  async getQuoteStatus(jobId: string): Promise<QuoteStatusResponse> {
    const response = await api.get(`/job/rest/jobs/${jobId}/quote/status/`)
    return response.data
  }
}

export const quoteImportService = new QuoteImportService()
