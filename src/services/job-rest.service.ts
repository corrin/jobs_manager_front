import { api } from '@/api/generated/api'
import axios from 'axios'
import type {
  JobCreateRequest,
  JobDetailResponse,
  CompanyDefaults,
  JobFileUploadSuccessResponse,
  JobFile,
  WorkshopPDFResponse,
  FetchStatusValuesResponse,
} from '@/api/generated/api'

export class JobRestService {
  private static instance: JobRestService

  static getInstance(): JobRestService {
    if (!JobRestService.instance) {
      JobRestService.instance = new JobRestService()
    }
    return JobRestService.instance
  }

  async createJob(data: JobCreateRequest): Promise<JobDetailResponse> {
    try {
      return await api.job_rest_jobs_create({ body: data })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getJobForEdit(jobId: string): Promise<JobDetailResponse> {
    try {
      return await api.job_rest_jobs_retrieve({ job_id: jobId })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async updateJob(jobId: string, data: Partial<JobCreateRequest>): Promise<JobDetailResponse> {
    try {
      return await api.job_rest_jobs_partial_update({
        job_id: jobId,
        body: data,
      })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async deleteJob(jobId: string): Promise<void> {
    try {
      await api.job_rest_jobs_destroy({ job_id: jobId })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async toggleComplexJob(jobId: string, complexJob: boolean): Promise<{ success: boolean }> {
    try {
      // Endpoint not in OpenAPI schema - using axios directly
      const response = await axios.post('/job/rest/jobs/toggle-complex/', {
        job_id: jobId,
        complex_job: complexJob,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async addJobEvent(jobId: string, description: string): Promise<void> {
    try {
      await api.job_rest_jobs_events_create({
        id: jobId,
        body: { description },
      })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getCompanyDefaults(): Promise<CompanyDefaults> {
    try {
      return await api.api_company_defaults_retrieve()
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getStatusValues(): Promise<FetchStatusValuesResponse> {
    try {
      return await api.job_api_jobs_status_values_retrieve()
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async fetchWorkshopPdf(jobId: string): Promise<WorkshopPDFResponse> {
    try {
      return await api.job_rest_jobs_workshop_pdf_retrieve({ id: jobId })
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async attachWorkshopPdf(jobNumber: number, pdfBlob: Blob): Promise<JobFileUploadSuccessResponse> {
    const file = new File([pdfBlob], `workshop_job_${jobNumber}.pdf`, { type: 'application/pdf' })

    const formData = new FormData()
    formData.append('job_number', jobNumber.toString())
    formData.append('files', file)

    // File upload endpoint not in OpenAPI schema - using axios directly
    const response = await axios.post('/job/rest/jobs/files/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  }

  async listJobFiles(jobNumber: string): Promise<JobFile[]> {
    // File listing endpoint not in OpenAPI schema - using axios directly
    const response = await axios.get(`/job/rest/jobs/files/${jobNumber}/`)
    return response.data.files || []
  }

  async deleteJobFile(fileId: string): Promise<void> {
    // File deletion endpoint not in OpenAPI schema - using axios directly
    await axios.delete(`/job/rest/jobs/files/${fileId}/`)
  }

  async uploadJobFile(
    jobNumber: number,
    files: File[],
    onProgress?: (percent: number) => void,
  ): Promise<JobFile[]> {
    const form = new FormData()
    form.append('job_number', jobNumber.toString())
    files.forEach((f) => {
      form.append('files', f)
    })

    // File upload endpoint not in OpenAPI schema - using axios directly
    const response = await axios.post('/job/rest/jobs/files/upload/', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (ev) => {
        if (!onProgress || !ev.total) return
        onProgress(Math.round((ev.loaded * 100) / ev.total))
      },
    })

    return response.data.uploaded || []
  }

  async updateJobFile(params: {
    job_number: string
    file_path?: string
    file_id?: string
    filename: string
    print_on_jobsheet: boolean
  }): Promise<void> {
    // File update endpoint not in OpenAPI schema - using axios directly
    await axios.put('/job/rest/jobs/files/', params)
  }

  private handleError(error: unknown): never {
    if (error instanceof Error && 'response' in error) {
      const axiosError = error as {
        response?: { status: number; data: { error: string }; statusText: string }
      }
      if (!axiosError.response) {
        throw new Error('Network error - please check your connection')
      }

      const { status, data, statusText } = axiosError.response
      const errorMessage = data?.error

      switch (status) {
        case 400:
          throw new Error(errorMessage || 'Invalid request data')
        case 401:
          throw new Error('Authentication required')
        case 403:
          throw new Error(errorMessage || 'Permission denied')
        case 404:
          throw new Error('Resource not found')
        case 500:
          throw new Error('Internal server error')
        default:
          throw new Error(errorMessage || `HTTP ${status}: ${statusText}`)
      }
    }

    if (error instanceof Error) {
      throw new Error(error.message)
    }

    throw new Error('An unknown error occurred')
  }
}

export const jobRestService = JobRestService.getInstance()
