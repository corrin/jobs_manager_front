import api from '../plugins/axios'
import {
  QuoteImportPreviewResponse,
  QuoteImportResponse,
  QuoteStatusResponse,
} from '../api/local/schemas'

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
