import api from '@/plugins/axios'
import type { AxiosResponse } from 'axios'
import {
  JobUpdateResponseSchema,
  type JobDetail,
  type JobUpdateResponse,
  type TimeEntryCreate,
  type MaterialEntryCreate,
  type AdjustmentEntryCreate,
  type JobEvent,
  type FileListResponse,
  FileListResponseSchema,
  type JobFile,
} from '@/schemas/job.schemas'

export interface JobCreateData {
  name: string
  client_id: string
  client_name?: string
  description?: string
  order_number?: string
  notes?: string
  contact_id?: string
  contact_person?: string
}

export interface JobUpdateData {
  name?: string
  client_id?: string
  description?: string
  order_number?: string
  notes?: string
  contact_id?: string
  job_status?: string
  [key: string]: unknown
}

export type JobData = JobDetail
export type TimeEntryCreateData = TimeEntryCreate
export type MaterialEntryCreateData = MaterialEntryCreate
export type AdjustmentEntryCreateData = AdjustmentEntryCreate
export type JobDetailResponse = JobUpdateResponse
export type { JobEvent }

export interface CompanyDefaults {
  materials_markup: number
  time_markup: number
  charge_out_rate: number
  wage_rate: number
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  error?: string
  data?: T
  job_id?: string
  job_number?: number
}

export interface UploadFilesResponse {
  status: string
  uploaded: JobFile[]
  message?: string
}

export class JobRestService {
  private static instance: JobRestService

  static getInstance(): JobRestService {
    if (!JobRestService.instance) {
      JobRestService.instance = new JobRestService()
    }
    return JobRestService.instance
  }

  async createJob(data: JobCreateData): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post('/job/rest/jobs/', data)
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async getJobForEdit(jobId: string): Promise<JobDetailResponse> {
    try {
      const response: AxiosResponse = await api.get(`/job/rest/jobs/${jobId}/`)

      const validatedData = JobUpdateResponseSchema.parse(response.data)
      return validatedData
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
        const zodError = error as unknown as { errors: unknown[] }
        console.warn('⚠️ Response validation failed, using legacy structure:', zodError.errors)
        const response: AxiosResponse = await api.get(`/job/rest/jobs/${jobId}/`)
        return this.handleResponse(response)
      }
      throw this.handleError(error)
    }
  }

  async updateJob(jobId: string, data: JobUpdateData): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<JobData> = await api.put(`/job/rest/jobs/${jobId}/`, data)

      return {
        success: true,
        data: response.data,
        message: 'Job updated successfully',
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async deleteJob(jobId: string): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.delete(`/job/rest/jobs/${jobId}/`)
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async toggleComplexJob(jobId: string, complexJob: boolean): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post(
        '/job/rest/jobs/toggle-complex/',
        {
          job_id: jobId,
          complex_job: complexJob,
        },
      )
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async addJobEvent(jobId: string, description: string): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post(
        `/job/rest/jobs/${jobId}/events/`,
        {
          description,
        },
      )
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async createTimeEntry(
    jobId: string,
    timeEntryData: TimeEntryCreateData,
  ): Promise<JobDetailResponse> {
    try {
      const response: AxiosResponse<JobDetailResponse> = await api.post(
        `/job/rest/jobs/${jobId}/time-entries/`,
        timeEntryData,
      )
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async createMaterialEntry(
    jobId: string,
    materialEntryData: MaterialEntryCreateData,
  ): Promise<JobDetailResponse> {
    try {
      const response: AxiosResponse<JobDetailResponse> = await api.post(
        `/job/rest/jobs/${jobId}/material-entries/`,
        materialEntryData,
      )
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async createAdjustmentEntry(
    jobId: string,
    adjustmentEntryData: AdjustmentEntryCreateData,
  ): Promise<JobDetailResponse> {
    try {
      const response: AxiosResponse<JobDetailResponse> = await api.post(
        `/job/rest/jobs/${jobId}/adjustment-entries/`,
        adjustmentEntryData,
      )
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  async getCompanyDefaults(): Promise<CompanyDefaults> {
    try {
      const response: AxiosResponse<CompanyDefaults> = await api.get('/job/api/company_defaults/')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async getStatusValues(): Promise<Record<string, string>> {
    try {
      const response: AxiosResponse<Record<string, string>> = await api.get(
        '/job/api/fetch_status_values/',
      )
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async fetchWorkshopPdf(jobId: string): Promise<Blob> {
    const response = await api.get(`/job/rest/jobs/${jobId}/workshop-pdf/`, {
      responseType: 'blob',
    })

    return this.handleResponse<Blob>(response)
  }

  async attachWorkshopPdf(jobNumber: number, pdfBlob: Blob): Promise<ApiResponse> {
    const file = new File([pdfBlob], `workshop_job_${jobNumber}.pdf`, { type: 'application/pdf' })

    const formData = new FormData()
    formData.append('job_number', jobNumber.toString())
    formData.append('files', file)

    const response = await api.post('/job/rest/jobs/files/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return this.handleResponse<ApiResponse>(response)
  }

  async listJobFiles(jobNumber: string): Promise<FileListResponse> {
    const response = await api.get<FileListResponse>(`/job/rest/jobs/files/${jobNumber}/`)

    return FileListResponseSchema.parse(response.data)
  }

  async deleteJobFile(fileId: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(`/job/rest/jobs/files/${fileId}/`)

    return this.handleResponse<ApiResponse>(response)
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

    const response: AxiosResponse<UploadFilesResponse> = await api.post(
      '/job/rest/jobs/files/upload/',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (ev) => {
          if (!onProgress || !ev.total) return
          onProgress(Math.round((ev.loaded * 100) / ev.total))
        },
      },
    )

    const data = this.handleResponse<UploadFilesResponse>(response)
    return data.uploaded
  }

  async updateJobFile(params: {
    job_number: string
    file_path?: string
    file_id?: string
    filename: string
    print_on_jobsheet: boolean
  }): Promise<ApiResponse> {
    const response = await api.put<ApiResponse>('/job/rest/jobs/files/', params)

    return this.handleResponse(response)
  }

  private handleResponse<T>(response: AxiosResponse<T>): T {
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      throw new Error('Authentication required - redirected to login page')
    }

    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.data
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
