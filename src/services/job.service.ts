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
import { validate as validateUuid } from 'uuid'
import { debugLog } from '@/utils/debug'

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
    if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
      throw new Error('Authentication required - redirected to login page')
    }

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
        activeJobs: data.active_jobs.map((job) => ({ ...job, people: job.people ?? [] })),
        archivedJobs: data.archived_jobs.map((job) => ({ ...job, people: job.people ?? [] })),
        totalArchived: data.total_archived,
      }
    } catch (error) {
      debugLog('Error fetching all jobs:', error)
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

      const apiResult = this.handleApiResponse(response, JobsApiResponseSchema)
      return {
        ...apiResult,
        jobs: apiResult.jobs.map((job) => ({ ...job, people: job.people ?? [] })),
      }
    } catch (error) {
      debugLog('Error fetching jobs by status:', error)
      throw new Error('Failed to load jobs by status')
    }
  }

  async getStatusChoices(): Promise<StatusApiResponse> {
    try {
      const response = await api.get('/job/api/jobs/status-values/')
      return this.handleApiResponse(response, StatusApiResponseSchema)
    } catch (error) {
      debugLog('Error fetching status choices:', error)
      throw new Error('Failed to load status choices')
    }
  }

  async updateJobStatus(jobId: string, status: string): Promise<void> {
    try {
      debugLog(`🔄 Updating job ${jobId} to status ${status}`)
      const requestData: UpdateJobStatusRequest = UpdateJobStatusRequestSchema.parse({ status })

      const response = await api.post(`/job/api/jobs/${jobId}/update-status/`, requestData)
      debugLog(`✅ Job status update successful`, response.data)

      const { useJobsStore } = await import('@/stores/jobs')
      const jobsStore = useJobsStore()
      jobsStore.updateJobStatus(jobId, status)
    } catch (error) {
      debugLog('❌ Error updating job status:', error)
      if (error instanceof Error) {
        debugLog('Error details:', {
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
      if (!validateUuid(jobId)) {
        throw new Error(`Invalid jobId: ${jobId}`)
      }
      if (beforeId && !validateUuid(beforeId)) {
        throw new Error(`Invalid beforeId: ${beforeId}`)
      }
      if (afterId && !validateUuid(afterId)) {
        throw new Error(`Invalid afterId: ${afterId}`)
      }
      const requestData: ReorderJobRequest = ReorderJobRequestSchema.parse({
        before_id: beforeId || null,
        after_id: afterId || null,
        status,
      })

      await api.post(`/job/api/jobs/${jobId}/reorder/`, requestData)

      if (status) {
        const { useJobsStore } = await import('@/stores/jobs')
        const jobsStore = useJobsStore()
        jobsStore.updateJobStatus(jobId, status)
      }
    } catch (error) {
      debugLog('Error reordering job:', error)
      throw new Error('Failed to reorder job')
    }
  }

  async performAdvancedSearch(filters: AdvancedFilters): Promise<JobsApiResponse> {
    try {
      const validatedFilters = AdvancedFiltersSchema.parse(filters)
      const params = new URLSearchParams()

      Object.entries(validatedFilters).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((v) => v && params.append(key, v))
        } else if (value) {
          params.append(key, value as string)
        }
      })

      const response = await api.get(`/job/api/jobs/advanced-search/?${params.toString()}`)
      const apiResult = this.handleApiResponse(response, JobsApiResponseSchema)
      return {
        ...apiResult,
        jobs: apiResult.jobs.map((job) => ({ ...job, people: job.people ?? [] })),
      }
    } catch (error) {
      debugLog('Error performing advanced search:', error)
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
      const apiResult = this.handleApiResponse(response, JobsApiResponseSchema)
      return {
        ...apiResult,
        jobs: apiResult.jobs.map((job) => ({ ...job, people: job.people ?? [] })),
      }
    } catch (error) {
      debugLog('Error fetching jobs by kanban column:', error)
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
