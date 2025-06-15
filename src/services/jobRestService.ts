/**
 * Job REST Service
 *
 * Service layer for REST operations on Jobs in the Vue.js frontend
 * Follows clean code and SRP principles
 */

import api from '@/services/api'
import type { AxiosResponse } from 'axios'
import {
  JobDetailSchema,
  JobUpdateResponseSchema,
  TimeEntryCreateSchema,
  MaterialEntryCreateSchema,
  AdjustmentEntryCreateSchema,
  JobEventSchema,
  type JobDetail,
  type JobUpdateResponse,
  type TimeEntryCreate,
  type MaterialEntryCreate,
  type AdjustmentEntryCreate,
  type JobEvent,
  type FileListResponse,
  FileListResponseSchema,
  type JobFile
} from '@/schemas/jobSchemas'

// Legacy types kept for compatibility (will be removed gradually)
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
  [key: string]: any
}

// Use schemas for new types
export type JobData = JobDetail
export type TimeEntryCreateData = TimeEntryCreate
export type MaterialEntryCreateData = MaterialEntryCreate
export type AdjustmentEntryCreateData = AdjustmentEntryCreate
export type JobDetailResponse = JobUpdateResponse
export type { JobEvent }

// Legacy interfaces still in use
export interface CompanyDefaults {
  materials_markup: number
  time_markup: number
  charge_out_rate: number
  wage_rate: number
}

export interface ApiResponse<T = any> {
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

  /**
   * Creates a new Job
   */
  async createJob(data: JobCreateData): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post('/job/rest/jobs/', data)
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Fetch full Job data for editing
   */
  async getJobForEdit(jobId: string): Promise<JobDetailResponse> {
    try {
      const response: AxiosResponse = await api.get(`/job/rest/jobs/${jobId}/`)

      // Validate response with schema
      const validatedData = JobUpdateResponseSchema.parse(response.data)
      return validatedData
    } catch (error: any) {
      // If validation fails, use legacy structure
      if (error.name === 'ZodError') {
        console.warn('⚠️ Response validation failed, using legacy structure:', error.errors)
        const response: AxiosResponse = await api.get(`/job/rest/jobs/${jobId}/`)
        return this.handleResponse(response)
      }
      throw this.handleError(error)
    }
  }

  /**
   * Updates a Job (autosave)
   */
  async updateJob(jobId: string, data: JobUpdateData): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<JobData> = await api.put(`/job/rest/jobs/${jobId}/`, data)

      // Do not update the store automatically - let components handle this
      // to avoid update loops and maintain control over when to refresh

      return {
        success: true,
        data: response.data,
        message: 'Job updated successfully'
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Deletes a Job
   */
  async deleteJob(jobId: string): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.delete(`/job/rest/jobs/${jobId}/`)
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Toggle the Job's complex mode
   */
  async toggleComplexJob(jobId: string, complexJob: boolean): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post('/job/rest/jobs/toggle-complex/', {
        job_id: jobId,
        complex_job: complexJob
      })
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Adds an event to the Job
   */
  async addJobEvent(jobId: string, description: string): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post(`/job/rest/jobs/${jobId}/events/`, {
        description
      })
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Creates a new time entry
   */
  async createTimeEntry(jobId: string, timeEntryData: TimeEntryCreateData): Promise<JobDetailResponse> {
    try {
      const response: AxiosResponse<JobDetailResponse> = await api.post(`/job/rest/jobs/${jobId}/time-entries/`, timeEntryData)
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Creates a new material entry
   */
  async createMaterialEntry(jobId: string, materialEntryData: MaterialEntryCreateData): Promise<JobDetailResponse> {
    try {
      const response: AxiosResponse<JobDetailResponse> = await api.post(`/job/rest/jobs/${jobId}/material-entries/`, materialEntryData)
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Creates a new adjustment entry
   */
  async createAdjustmentEntry(jobId: string, adjustmentEntryData: AdjustmentEntryCreateData): Promise<JobDetailResponse> {
    try {
      const response: AxiosResponse<JobDetailResponse> = await api.post(`/job/rest/jobs/${jobId}/adjustment-entries/`, adjustmentEntryData)
      return this.handleResponse(response)
    } catch (error) {
      return this.handleError(error)
    }
  }

  /**
   * Fetch company default settings
   */
  async getCompanyDefaults(): Promise<CompanyDefaults> {
    try {
      const response: AxiosResponse<CompanyDefaults> = await api.get('/job/api/company_defaults/')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Fetch available status values
   */
  async getStatusValues(): Promise<Record<string, string>> {
    try {
      const response: AxiosResponse<Record<string, string>> = await api.get('/job/api/fetch_status_values/')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Workshop PDF and file handling
   */
  async fetchWorkshopPdf(jobId: string): Promise<Blob> {
    const response = await api.get(
      `/job/rest/jobs/${jobId}/workshop-pdf/`,
      { responseType: 'blob' }
    )

    return this.handleResponse<Blob>(response);
  }

  async attachWorkshopPdf(jobNumber: number, pdfBlob: Blob): Promise<ApiResponse> {
    const file = new File(
      [pdfBlob],
      `workshop_job_${jobNumber}.pdf`,
      { type: 'application/pdf' }
    )

    const formData = new FormData()
    formData.append('job_number', jobNumber.toString())
    formData.append('files', file)

    const response = await api.post(
      '/job/rest/jobs/files/upload/',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    )
    return this.handleResponse<ApiResponse>(response);
  }

  async listJobFiles(jobNumber: string): Promise<FileListResponse> {
    const response = await api.get<FileListResponse>(
      `/job/rest/jobs/files/${jobNumber}/`
    )

    return FileListResponseSchema.parse(response.data)
  }

  async deleteJobFile(fileId: string): Promise<ApiResponse> {
    const response = await api.delete<ApiResponse>(
      `/job/rest/jobs/files/${fileId}/`
    )

    return this.handleResponse<ApiResponse>(response)
  }

  async uploadJobFile(jobNumber: number, files: File[], onProgress?: (percent: number) => void): Promise<JobFile[]> {
    const form = new FormData()
    form.append('job_number', jobNumber.toString())
    files.forEach(f => {form.append('files', f) })

    const response: AxiosResponse<UploadFilesResponse> = await api.post(
      '/job/rest/jobs/files/upload/',
      form,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: ev => {
          if (!onProgress || !ev.total) return
          onProgress(Math.round((ev.loaded * 100) / ev.total))
        }
      }
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
    const response = await api.put<ApiResponse>(
      '/job/rest/jobs/files/',
      params
    )

    return this.handleResponse(response)
  }

  /**
   * Standardised API response handling
   */
  private handleResponse<T>(response: AxiosResponse<T>): T {
    // Guard clause - check for HTML response (redirect to login)
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      throw new Error('Authentication required - redirected to login page')
    }

    // Guard clause - check HTTP status
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.data
  }

  /**
   * Standardised error handling
   */
  private handleError(error: any): never {
    // Guard clause - network error
    if (!error.response) {
      throw new Error('Network error - please check your connection')
    }

    // Switch-case for different HTTP error types
    const status = error.response.status
    const errorData = error.response.data

    switch (status) {
      case 400:
        throw new Error(errorData.error || 'Invalid request data')
      case 401:
        throw new Error('Authentication required')
      case 403:
        throw new Error(errorData.error || 'Permission denied')
      case 404:
        throw new Error('Resource not found')
      case 500:
        throw new Error('Internal server error')
      default:
        throw new Error(errorData.error || `HTTP ${status}: ${error.response.statusText}`)
    }
  }
}

// Export singleton instance
export const jobRestService = JobRestService.getInstance()
