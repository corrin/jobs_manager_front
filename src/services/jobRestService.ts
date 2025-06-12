/**
 * Job REST Service
 *
 * Service layer para operações REST de Jobs no frontend Vue.js
 * Segue princípios de clean code e SRP
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
  type JobEvent
} from '@/schemas/jobSchemas'

// Legacy types mantidos para compatibilidade (serão removidos gradualmente)
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

// Usar schemas para novos tipos
export type JobData = JobDetail
export type TimeEntryCreateData = TimeEntryCreate
export type MaterialEntryCreateData = MaterialEntryCreate
export type AdjustmentEntryCreateData = AdjustmentEntryCreate
export type JobDetailResponse = JobUpdateResponse
export type { JobEvent }

// Legacy interfaces ainda em uso
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

export class JobRestService {
  private static instance: JobRestService

  static getInstance(): JobRestService {
    if (!JobRestService.instance) {
      JobRestService.instance = new JobRestService()
    }
    return JobRestService.instance
  }

  /**
   * Cria um novo Job
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
   * Busca dados completos de um Job para edição
   */
  async getJobForEdit(jobId: string): Promise<JobDetailResponse> {
    try {
      const response: AxiosResponse = await api.get(`/job/rest/jobs/${jobId}/`)

      // Validar resposta com schema
      const validatedData = JobUpdateResponseSchema.parse(response.data)
      return validatedData
    } catch (error: any) {
      // Se erro de validação, usar estrutura legacy
      if (error.name === 'ZodError') {
        console.warn('⚠️ Response validation failed, using legacy structure:', error.errors)
        const response: AxiosResponse = await api.get(`/job/rest/jobs/${jobId}/`)
        return this.handleResponse(response)
      }
      throw this.handleError(error)
    }
  }

  /**
   * Atualiza um Job (autosave)
   */
  async updateJob(jobId: string, data: JobUpdateData): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<JobData> = await api.put(`/job/rest/jobs/${jobId}/`, data)

      // Não atualizar a store automaticamente - deixar que os componentes façam isso
      // para evitar loops de atualização e manter controle sobre quando atualizar

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
   * Deleta um Job
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
   * Alterna modo complexo do Job
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
   * Adiciona um evento ao Job
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
   * Cria uma nova entrada de tempo (TimeEntry)
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
   * Cria uma nova entrada de material (MaterialEntry)
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
   * Cria uma nova entrada de ajuste (AdjustmentEntry)
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
   * Busca configurações padrão da empresa
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
   * Busca valores de status disponíveis
   */
  async getStatusValues(): Promise<Record<string, string>> {
    try {
      const response: AxiosResponse<Record<string, string>> = await api.get('/job/api/fetch_status_values/')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  async fetchWorkshopPdf(jobId: string): Promise<Blob> {
    const response = await api.get(
      `/job/rest/jobs/${jobId}/workshop-pdf/`,
      { responseType: 'blob' }
    )

    return this.handleResponse<Blob>(response);
  }

  async attachWorkshopPdf(jobId: string, pdfBlob: Blob): Promise<ApiResponse> {
    const file = new File(
      [pdfBlob],
      `workshop_${jobId}.pdf`,
      { type: 'application/pdf' }
    )

    const formData = new FormData()
    formData.append('job_number', jobId)
    formData.append('files', file)

    const response = await api.post('job/api/job-files', formData)
    return this.handleResponse<ApiResponse>(response);
  }

  /**
   * Tratamento padronizado de respostas da API
   */
  private handleResponse<T>(response: AxiosResponse<T>): T {
    // Guard clause - verificar resposta HTML (redirecionamento para login)
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      throw new Error('Authentication required - redirected to login page')
    }

    // Guard clause - verificar status HTTP
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.data
  }

  /**
   * Tratamento padronizado de erros
   */
  private handleError(error: any): never {
    // Guard clause - erro de rede
    if (!error.response) {
      throw new Error('Network error - please check your connection')
    }

    // Switch-case para diferentes tipos de erro HTTP
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
