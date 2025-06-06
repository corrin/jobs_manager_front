import api from '@/services/api'
import type { AxiosResponse } from 'axios'
import {
  JobsApiResponseSchema,
  StatusApiResponseSchema,
  ApiErrorResponseSchema,
  UpdateJobStatusRequestSchema,
  ReorderJobRequestSchema,
  AdvancedFiltersSchema
} from '@/schemas/kanban.schemas'
import type {
  Job,
  JobsApiResponse,
  StatusApiResponse,
  AdvancedFilters,
  UpdateJobStatusRequest,
  ReorderJobRequest
} from '@/schemas/kanban.schemas'

export class JobService {
  private static instance: JobService
  static getInstance(): JobService {
    if (!JobService.instance) {
      JobService.instance = new JobService()
    }
    return JobService.instance
  }

  private handleApiResponse<T>(response: AxiosResponse, schema: any): T {
    // Check if response is HTML (redirect to login page)
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      throw new Error('Authentication required - redirected to login page')
    }

    // Check if response status indicates success
    if (response.status >= 400) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    try {
      const validatedResponse = schema.parse(response.data)

      if (validatedResponse.success === false) {
        throw new Error(validatedResponse.error || 'API request failed')
      }

      return validatedResponse
    } catch (error) {
      if (error instanceof Error && error.message.includes('Expected object, received string')) {
        throw new Error('Invalid response format - possibly not authenticated')
      }
      throw error
    }
  }

  async getAllJobs(): Promise<{ activeJobs: Job[], archivedJobs: Job[], totalArchived: number }> {
    try {
      const response = await api.get('/api/jobs/fetch-all/')
      const data = this.handleApiResponse<JobsApiResponse & { active_jobs: Job[], archived_jobs: Job[], total_archived: number }>(
        response,
        JobsApiResponseSchema.extend({
          active_jobs: JobsApiResponseSchema.shape.jobs,
          archived_jobs: JobsApiResponseSchema.shape.jobs,
          total_archived: JobsApiResponseSchema.shape.total
        })
      )

      return {
        activeJobs: data.active_jobs,
        archivedJobs: data.archived_jobs,
        totalArchived: data.total_archived
      }
    } catch (error) {
      console.error('Error fetching all jobs:', error)
      throw new Error('Failed to load jobs')
    }
  }

  async getJobsByStatus(status: string, searchTerms?: string): Promise<JobsApiResponse> {
    try {
      const params = new URLSearchParams()
      if (searchTerms) {
        params.append('search', searchTerms)
      }

      const response = await api.get(
        `/api/jobs/fetch/${status}/?${params.toString()}`
      )

      return this.handleApiResponse<JobsApiResponse>(response, JobsApiResponseSchema)
    } catch (error) {
      console.error('Error fetching jobs by status:', error)
      throw new Error('Failed to load jobs by status')
    }
  }

  async getStatusChoices(): Promise<StatusApiResponse> {
    try {
      const response = await api.get('/api/jobs/status-values/')
      return this.handleApiResponse<StatusApiResponse>(response, StatusApiResponseSchema)
    } catch (error) {
      console.error('Error fetching status choices:', error)
      throw new Error('Failed to load status choices')
    }
  }

  async updateJobStatus(jobId: string, status: string): Promise<void> {
    try {
      const requestData: UpdateJobStatusRequest = UpdateJobStatusRequestSchema.parse({ status })

      await api.post(`/api/jobs/${jobId}/update-status/`, requestData)
    } catch (error) {
      console.error('Error updating job status:', error)
      throw new Error('Failed to update job status')
    }
  }

  async reorderJob(
    jobId: string,
    beforeId?: string,
    afterId?: string,
    status?: string
  ): Promise<void> {
    try {
      const requestData: ReorderJobRequest = ReorderJobRequestSchema.parse({
        before_id: beforeId || null,
        after_id: afterId || null,
        status
      })

      await api.post(`/api/jobs/${jobId}/reorder/`, requestData)
    } catch (error) {
      console.error('Error reordering job:', error)
      throw new Error('Failed to reorder job')
    }
  }

  async performAdvancedSearch(filters: AdvancedFilters): Promise<JobsApiResponse> {
    try {
      const validatedFilters = AdvancedFiltersSchema.parse(filters)
      const params = new URLSearchParams()

      // Add non-empty filters to params
      Object.entries(validatedFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => v && params.append(key, v))
        } else if (value) {
          params.append(key, value)
        }
      })

      const response = await api.get(
        `/api/jobs/advanced-search/?${params.toString()}`
      )

      return this.handleApiResponse<JobsApiResponse>(response, JobsApiResponseSchema)
    } catch (error) {
      console.error('Error performing advanced search:', error)
      throw new Error('Failed to perform advanced search')
    }
  }

  searchJobs(jobs: Job[], query: string): Job[] {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    return jobs.filter(job =>
      job.name.toLowerCase().includes(searchTerm) ||
      job.description.toLowerCase().includes(searchTerm) ||
      job.client_name.toLowerCase().includes(searchTerm) ||
      (job.contact_person && job.contact_person.toLowerCase().includes(searchTerm)) ||
      job.job_number.toLowerCase().includes(searchTerm)
    )
  }
}
