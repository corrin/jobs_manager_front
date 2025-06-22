import api from '@/plugins/axios'
import type { AxiosResponse } from 'axios'
import type { z } from 'zod'
import {
  JobsApiResponseSchema,
  StatusApiResponseSchema,
  UpdateJobStatusRequestSchema,
  ReorderJobRequestSchema,
  AdvancedFiltersSchema,
  AllJobsApiResponseSchema,
} from '@/schemas/kanban.schemas'
import type {
  JobsApiResponse,
  StatusApiResponse,
  UpdateJobStatusRequest,
  ReorderJobRequest,
} from '@/schemas/kanban.schemas'
import type { Job, AdvancedFilters } from '@/types'

// Base interface for API responses to ensure type safety
interface BaseApiResponse {
  success: boolean
  error?: string
}

export class JobService {
  private static instance: JobService
  static getInstance(): JobService {
    if (!JobService.instance) {
      JobService.instance = new JobService()
    }
    return JobService.instance
  }

  private handleApiResponse<T extends BaseApiResponse>(
    response: AxiosResponse,
    schema: z.ZodType<T>,
  ): T {
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

  async getAllJobs(): Promise<{ activeJobs: Job[]; archivedJobs: Job[]; totalArchived: number }> {
    try {
      const response = await api.get('/job/api/jobs/fetch-all/')
      const data = this.handleApiResponse(response, AllJobsApiResponseSchema)

      return {
        activeJobs: data.active_jobs,
        archivedJobs: data.archived_jobs,
        totalArchived: data.total_archived,
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

      const response = await api.get(`/job/api/jobs/fetch/${status}/?${params.toString()}`)

      return this.handleApiResponse(response, JobsApiResponseSchema)
    } catch (error) {
      console.error('Error fetching jobs by status:', error)
      throw new Error('Failed to load jobs by status')
    }
  }

  async getStatusChoices(): Promise<StatusApiResponse> {
    try {
      const response = await api.get('/job/api/jobs/status-values/')
      return this.handleApiResponse(response, StatusApiResponseSchema)
    } catch (error) {
      console.error('Error fetching status choices:', error)
      throw new Error('Failed to load status choices')
    }
  }

  async updateJobStatus(jobId: string, status: string): Promise<void> {
    try {
      console.log(`🔄 Updating job ${jobId} to status ${status}`)
      const requestData: UpdateJobStatusRequest = UpdateJobStatusRequestSchema.parse({ status })

      const response = await api.post(`/job/api/jobs/${jobId}/update-status/`, requestData)
      console.log(`✅ Job status update successful`, response.data)

      // Update the store with the new status
      const { useJobsStore } = await import('@/stores/jobs')
      const jobsStore = useJobsStore()
      jobsStore.updateJobStatus(jobId, status)
    } catch (error) {
      console.error('❌ Error updating job status:', error)
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
        })
      }
      throw new Error('Failed to update job status')
    }
  }

  async reorderJob(
    jobId: string,
    beforeId?: string,
    afterId?: string,
    status?: string,
  ): Promise<void> {
    try {
      const requestData: ReorderJobRequest = ReorderJobRequestSchema.parse({
        before_id: beforeId || null,
        after_id: afterId || null,
        status,
      })

      await api.post(`/job/api/jobs/${jobId}/reorder/`, requestData)

      // If the status changed, update the store
      if (status) {
        const { useJobsStore } = await import('@/stores/jobs')
        const jobsStore = useJobsStore()
        jobsStore.updateJobStatus(jobId, status)
      }
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
          value.forEach((v) => v && params.append(key, v))
        } else if (value) {
          params.append(key, value as string)
        }
      })

      const response = await api.get(`/job/api/jobs/advanced-search/?${params.toString()}`)

      return this.handleApiResponse(response, JobsApiResponseSchema)
    } catch (error) {
      console.error('Error performing advanced search:', error)
      throw new Error('Failed to perform advanced search')
    }
  }

  async getJobsByKanbanColumn(columnId: string, searchTerms?: string): Promise<JobsApiResponse> {
    try {
      const params = new URLSearchParams()
      if (searchTerms) {
        params.append('search', searchTerms)
      }

      const response = await api.get(
        `/job/api/jobs/fetch-by-column/${columnId}/?${params.toString()}`,
      )

      return this.handleApiResponse(response, JobsApiResponseSchema)
    } catch (error) {
      console.error('Error fetching jobs by kanban column:', error)
      throw new Error('Failed to load jobs by kanban column')
    }
  }

  searchJobs(jobs: Job[], query: string): Job[] {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    return jobs.filter(
      (job) =>
        job.name.toLowerCase().includes(searchTerm) ||
        (job.description && job.description.toLowerCase().includes(searchTerm)) ||
        job.client_name.toLowerCase().includes(searchTerm) ||
        (job.contact_person && job.contact_person.toLowerCase().includes(searchTerm)) ||
        job.job_number.toString().includes(searchTerm),
    )
  }
}
