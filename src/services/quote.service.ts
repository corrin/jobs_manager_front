import { api } from '@/api/generated/api'
import type {
  QuoteSpreadsheet,
  PreviewQuoteResponse,
  ApplyQuoteResponse,
  Job,
  LinkQuoteSheetRequest,
} from '@/api/generated/api'

class QuoteService {
  async linkQuote(jobId: string, templateUrl?: string): Promise<QuoteSpreadsheet> {
    const payload: LinkQuoteSheetRequest = templateUrl ? { template_url: templateUrl } : {}

    await api.job_rest_jobs_quote_link_create({
      id: jobId,
      body: payload,
    })

    // The endpoint only returns { template_url }, but we need to return QuoteSpreadsheet
    // Let's fetch the updated job to get the complete quote_sheet
    const jobResponse = await api.job_rest_jobs_retrieve({ job_id: jobId })
    return jobResponse.quote_sheet
  }

  async previewQuote(jobId: string): Promise<PreviewQuoteResponse> {
    return await api.job_rest_jobs_quote_preview_create({
      id: jobId,
      body: {},
    })
  }

  async applyQuote(jobId: string): Promise<ApplyQuoteResponse> {
    return await api.job_rest_jobs_quote_apply_create({
      id: jobId,
      body: {},
    })
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
