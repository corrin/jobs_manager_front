import { api } from '@/api/client'
import axios from 'axios'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'

type QuoteSpreadsheet = z.infer<typeof schemas.QuoteSpreadsheet>
type PreviewQuoteResponse = z.infer<typeof schemas.PreviewQuoteResponse>
type ApplyQuoteResponse = z.infer<typeof schemas.ApplyQuoteResponse>
type Job = z.infer<typeof schemas.Job>
type LinkQuoteSheetRequest = z.infer<typeof schemas.LinkQuoteSheetRequest>
type QuoteImportStatusResponse = z.infer<typeof schemas.QuoteImportStatusResponse>
type JobDetailResponse = z.infer<typeof schemas.JobDetailResponse>
// QuoteImportPreviewResponse -> PreviewQuoteResponse (new quote sync system)
// QuoteImportResponse -> ApplyQuoteResponse (new quote sync system)

class QuoteService {
  async linkQuote(jobId: string, templateUrl?: string): Promise<QuoteSpreadsheet | null> {
    const payload: LinkQuoteSheetRequest = templateUrl ? { template_url: templateUrl } : {}

    await api.job_rest_jobs_quote_link_create(payload, { params: { id: jobId } })

    const jobResponse: JobDetailResponse = await api.getFullJob({ job_id: jobId })
    return jobResponse.data?.job?.quote_sheet ?? null
  }

  async previewQuote(jobId: string): Promise<PreviewQuoteResponse> {
    return api.job_rest_jobs_quote_preview_create({}, { params: { id: jobId } })
  }

  async applyQuote(jobId: string): Promise<ApplyQuoteResponse> {
    return api.job_rest_jobs_quote_apply_create({ success: true }, { params: { id: jobId } })
  }

  hasLinkedSheet(job: Job): boolean {
    return !!job?.quote_sheet?.sheet_url
  }

  getSheetUrl(job: Job): string | null {
    return job?.quote_sheet?.sheet_url || null
  }

  // File upload endpoints (not available in Zodios API yet)
  async previewQuoteImport(jobId: string, file: File): Promise<PreviewQuoteResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axios.post(`/job/rest/jobs/${jobId}/quote/import/preview/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return schemas.PreviewQuoteResponse.parse(response.data)
  }

  async importQuote(
    jobId: string,
    file: File,
    skipValidation: boolean = false,
  ): Promise<ApplyQuoteResponse> {
    const formData = new FormData()
    formData.append('file', file)
    if (skipValidation) {
      formData.append('skip_validation', 'true')
    }

    const response = await axios.post(`/job/rest/jobs/${jobId}/quote/import/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    return schemas.ApplyQuoteResponse.parse(response.data)
  }

  async getQuoteStatus(jobId: string): Promise<QuoteImportStatusResponse> {
    return await api.job_rest_jobs_quote_status_retrieve({ params: { job_id: jobId } })
  }
}

export const quoteService = new QuoteService()
