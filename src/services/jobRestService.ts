/**
 * Job REST Service
 * 
 * Service layer para operações REST de Jobs no frontend Vue.js
 * Segue princípios de clean code e SRP
 */

import api from '@/services/api'
import type { AxiosResponse } from 'axios'

// Types para Job
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
  status?: string
  [key: string]: any
}

export interface JobPricingData {
  time_entries: any[]
  material_entries: any[]
  adjustment_entries: any[]
}

export interface JobData {
  id: string
  name: string
  job_number: number
  client_id: string
  client_name: string
  description?: string
  order_number?: string
  notes?: string
  contact_id?: string
  contact_name?: string
  status: string
  complex_job: boolean
  pricing_methodology: string
  created_at: string
  updated_at: string
  // Workflow fields
  delivery_date?: string
  quote_acceptance_date?: string
  quoted?: boolean
  invoiced?: boolean
  paid?: boolean
}

export interface JobEvent {
  id: string
  timestamp: string
  event_type: string
  description: string
  staff: string
}

export interface CompanyDefaults {
  materials_markup: number
  time_markup: number
  charge_out_rate: number
  wage_rate: number
}

export interface JobDetailResponse {
  success: boolean
  data: {
    job: JobData
    latest_pricings: {
      estimate_pricing?: JobPricingData
      quote_pricing?: JobPricingData
      reality_pricing?: JobPricingData
    }
    events: JobEvent[]
    company_defaults: CompanyDefaults
  }
}

export interface JobEvent {
  id: string
  timestamp: string
  event_type: string
  description: string
  staff: string
}

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
      const response: AxiosResponse<JobDetailResponse> = await api.get(`/job/rest/jobs/${jobId}/`)
      return this.handleResponse(response)
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * Atualiza um Job (autosave)
   */
  async updateJob(jobId: string, data: JobUpdateData): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.put(`/job/rest/jobs/${jobId}/`, data)
      return this.handleResponse(response)
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
   * Alterna metodologia de pricing
   */
  async togglePricingMethodology(jobId: string, methodology: string): Promise<ApiResponse> {
    try {
      const response: AxiosResponse<ApiResponse> = await api.post('/job/rest/jobs/toggle-pricing-methodology/', {
        job_id: jobId,
        pricing_methodology: methodology
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
