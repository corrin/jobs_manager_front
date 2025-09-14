import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { schemas } from '../api/generated/api'
import { debugLog } from '../utils/debug'
import type { z } from 'zod'

type Job = z.infer<typeof schemas.Job>
type JobDetail = z.infer<typeof schemas.JobDetailResponse>['data']

// Basic info fields that are stored separately to prevent autosave conflicts
type JobBasicInfo = z.infer<typeof schemas.JobBasicInformationResponse>
type JobEvent = z.infer<typeof schemas.JobEvent>
type KanbanJobUI = z.infer<typeof schemas.KanbanJob>
type CompanyDefaultsJobDetail = z.infer<typeof schemas.CompanyDefaultsJobDetail>
type JobHeaderResponse = z.infer<typeof schemas.JobHeaderResponse>

export const useJobsStore = defineStore('jobs', () => {
  const detailedJobs = ref<Record<string, JobDetail>>({})
  const kanbanJobs = ref<Record<string, KanbanJobUI>>({})
  const headersById = ref<Record<string, JobHeaderResponse>>({})
  const basicInfoById = ref<Record<string, JobBasicInfo>>({})
  const currentJobId = ref<string | null>(null)
  const isLoadingJob = ref(false)
  const isLoadingKanban = ref(false)
  const currentContext = ref<'kanban' | 'detail' | null>(null)

  const currentJob = computed(() => {
    if (!currentJobId.value) return null
    return detailedJobs.value[currentJobId.value] || null
  })

  const currentHeader = computed(() => {
    if (!currentJobId.value) return null
    return headersById.value[currentJobId.value] || null
  })

  const currentBasicInfo = computed(() => {
    if (!currentJobId.value) return null
    return basicInfoById.value[currentJobId.value] || null
  })

  const allKanbanJobs = computed(() => {
    return Object.values(kanbanJobs.value)
  })

  const getJobById = computed(() => {
    return (id: string): JobDetail | null => {
      return detailedJobs.value[id] || null
    }
  })

  const getKanbanJobById = computed(() => {
    return (id: string): KanbanJobUI | null => {
      return kanbanJobs.value[id] || null
    }
  })

  const setDetailedJob = (jobDetail: JobDetail): void => {
    if (!jobDetail) {
      debugLog('🚨 Store - setDetailedJob called with null/undefined jobDetail')
      return
    }

    // JobDetail has structure: {job: {...}, events: [...], company_defaults: {...}}
    if (!jobDetail.job || !jobDetail.job.id || typeof jobDetail.job.id !== 'string') {
      debugLog('🚨 Store - setDetailedJob called with invalid jobDetail structure:', {
        hasJob: !!jobDetail.job,
        jobId: jobDetail.job?.id,
        jobIdType: typeof jobDetail.job?.id,
      })
      return
    }

    const jobId = jobDetail.job.id
    const existingJob = detailedJobs.value[jobId]

    // Preserve existing basic info fields if they're not present in the new data
    const mergedJobDetail = { ...jobDetail }
    if (existingJob && existingJob.job) {
      mergedJobDetail.job = {
        ...existingJob.job, // Start with existing data
        ...jobDetail.job, // Override with new data
        // Preserve basic info fields if not present in new data
        description: jobDetail.job.description ?? existingJob.job.description,
        order_number: jobDetail.job.order_number ?? existingJob.job.order_number,
        notes: jobDetail.job.notes ?? existingJob.job.notes,
        delivery_date: jobDetail.job.delivery_date ?? existingJob.job.delivery_date,
      }
      // Preserve other arrays/objects if not present
      mergedJobDetail.events = jobDetail.events ?? existingJob.events
      mergedJobDetail.company_defaults = jobDetail.company_defaults ?? existingJob.company_defaults
    }

    if (existingJob && JSON.stringify(existingJob) === JSON.stringify(mergedJobDetail)) {
      debugLog('🔄 Store - JobDetail data identical, skipping update to prevent loop:', jobId)
      return
    }

    debugLog('🏪 Store - setDetailedJob called:', {
      jobId,
      jobStatus: mergedJobDetail.job.job_status,
      hasEvents: Array.isArray(mergedJobDetail.events),
      eventsCount: mergedJobDetail.events?.length || 0,
      preservedBasicInfo: !!existingJob,
    })

    detailedJobs.value = {
      ...detailedJobs.value,
      [jobId]: mergedJobDetail,
    }

    debugLog('🏪 Store - Job updated successfully:', {
      jobId,
      newStatus: detailedJobs.value[jobId]?.job?.job_status,
    })

    // Always keep header in sync when receiving full job
    setHeader(jobToHeader(mergedJobDetail.job))

    if (kanbanJobs.value[jobId]) {
      debugLog('🏪 Store - Also updating kanban job')
      updateKanbanJobFromDetailed(mergedJobDetail)
    }
  }

  const updateDetailedJob = (jobId: string, updates: Partial<JobDetail>): void => {
    const existingJob = detailedJobs.value[jobId]
    if (existingJob) {
      const updatedJob = { ...existingJob, ...updates }
      detailedJobs.value = {
        ...detailedJobs.value,
        [jobId]: updatedJob,
      }

      if (kanbanJobs.value[jobId]) {
        updateKanbanJobFromDetailed(updatedJob)
      }
    }
  }

  const removeDetailedJob = (jobId: string): void => {
    delete detailedJobs.value[jobId]
  }

  const setKanbanJobs = (jobs: KanbanJobUI[]): void => {
    kanbanJobs.value = {}
    jobs.forEach((job) => {
      kanbanJobs.value[job.id] = job
    })
  }

  const setKanbanJob = (job: KanbanJobUI): void => {
    kanbanJobs.value[job.id] = job
  }

  const updateKanbanJob = (jobId: string, updates: Partial<KanbanJobUI>): void => {
    const existingJob = kanbanJobs.value[jobId]
    if (existingJob) {
      kanbanJobs.value[jobId] = { ...existingJob, ...updates }
    }
  }

  const removeKanbanJob = (jobId: string): void => {
    delete kanbanJobs.value[jobId]
  }

  const updateKanbanJobFromDetailed = (detailedJob: JobDetail): void => {
    const jobId = detailedJob.job.id
    const kanbanJob = kanbanJobs.value[jobId]
    if (kanbanJob) {
      kanbanJobs.value[jobId] = {
        ...kanbanJob,
        name: detailedJob.job.name,
        job_status: detailedJob.job.job_status,
        client_name: detailedJob.job.client_name || '',
        contact_person: detailedJob.job.contact_name || kanbanJob.contact_person,
        paid: detailedJob.job.paid || false,
      }
    }
  }

  const setCurrentJobId = (jobId: string | null): void => {
    currentJobId.value = jobId
  }

  const setCurrentContext = (context: 'kanban' | 'detail' | null): void => {
    currentContext.value = context
  }

  const setLoadingJob = (loading: boolean): void => {
    isLoadingJob.value = loading
  }

  const setLoadingKanban = (loading: boolean): void => {
    isLoadingKanban.value = loading
  }

  const clearDetailedJobs = (): void => {
    detailedJobs.value = {}
    currentJobId.value = null
  }

  const clearKanbanJobs = (): void => {
    kanbanJobs.value = {}
  }

  const clearAll = (): void => {
    clearDetailedJobs()
    clearKanbanJobs()
    basicInfoById.value = {}
    currentContext.value = null
  }

  const setBasicInfo = (jobId: string, basicInfo: JobBasicInfo): void => {
    basicInfoById.value[jobId] = basicInfo
  }

  const updateBasicInfo = (jobId: string, updates: Partial<JobBasicInfo>): void => {
    const existing = basicInfoById.value[jobId]
    if (existing) {
      basicInfoById.value[jobId] = { ...existing, ...updates }
    }
  }

  const loadBasicInfo = async (jobId: string): Promise<JobBasicInfo | null> => {
    try {
      const { api } = await import('../api/client')
      const data = await api.job_rest_jobs_basic_info_retrieve({
        params: { job_id: jobId },
      })

      debugLog('✅ Store - loadBasicInfo success:', { jobId, data })
      setBasicInfo(jobId, data)
      return data
    } catch (error) {
      debugLog('❌ Store - loadBasicInfo error:', error)
      throw error
    }
  }

  const updateJobStatus = (jobId: string, newStatus: string): void => {
    updateDetailedJob(jobId, { job_status: newStatus })

    updateKanbanJob(jobId, { job_status: newStatus })
  }

  const updateJobEvents = (jobId: string, events: JobEvent[]): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      detailedJobs.value[jobId] = { ...job, events }
    }
  }

  const addJobEvent = (jobId: string, event: JobEvent): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      const events = job.events || []
      detailedJobs.value[jobId] = { ...job, events: [event, ...events] }
    }
  }

  const updateJobCompanyDefaults = (
    jobId: string,
    companyDefaults: CompanyDefaultsJobDetail,
  ): void => {
    const jobDetail = detailedJobs.value[jobId]
    if (jobDetail) {
      detailedJobs.value[jobId] = { ...jobDetail, company_defaults: companyDefaults }
    }
  }

  const updateJobPartialData = (jobId: string, partialData: Partial<JobDetail>): void => {
    const jobDetail = detailedJobs.value[jobId]
    if (jobDetail) {
      detailedJobs.value[jobId] = { ...jobDetail, ...partialData }

      if (kanbanJobs.value[jobId]) {
        updateKanbanJobFromDetailed(detailedJobs.value[jobId])
      }
    }
  }

  const jobToHeader = (job: Job): JobHeaderResponse => {
    return {
      job_id: job.id,
      job_number: job.job_number,
      name: job.name,
      client: {
        id: job.client_id ?? '',
        name: job.client_name ?? '',
      },
      status: job.job_status,
      pricing_methodology: job.pricing_methodology ?? null,
      fully_invoiced: job.fully_invoiced,
      quoted: job.quoted,
      quote_acceptance_date: job.quote_acceptance_date ?? null,
      paid: Boolean(job.paid),
    }
  }

  const setHeader = (header: JobHeaderResponse): void => {
    headersById.value[header.job_id] = header
  }

  const patchHeader = (jobId: string, patch: Partial<JobHeaderResponse>): void => {
    const cur = headersById.value[jobId]
    if (!cur) return
    headersById.value[jobId] = { ...cur, ...patch, client: patch.client ?? cur.client }
  }

  const upsertFromFullJob = (job: Job): void => {
    setHeader(jobToHeader(job))
  }

  async function fetchJob(jobId: string): Promise<unknown> {
    if (!jobId) return undefined

    try {
      const { jobService } = await import('../services/job.service')
      const response = await jobService.getJob(jobId)

      if (response.success && response.data) {
        setDetailedJob(response.data)
        return { job: response.data.job, events: response.data.events || [] }
      }

      throw new Error('Job not found or invalid response format')
    } catch (error) {
      debugLog('❌ Store - fetchJob error:', error)
      throw error
    }
  }

  return {
    detailedJobs,
    kanbanJobs,
    headersById,
    basicInfoById,
    currentJobId,
    isLoadingJob,
    isLoadingKanban,
    currentContext,

    currentJob,
    currentHeader,
    currentBasicInfo,
    allKanbanJobs,
    getJobById,
    getKanbanJobById,

    setDetailedJob,
    updateDetailedJob,
    removeDetailedJob,
    setKanbanJobs,
    setKanbanJob,
    updateKanbanJob,
    removeKanbanJob,
    setCurrentJobId,
    setCurrentContext,
    setLoadingJob,
    setLoadingKanban,
    clearDetailedJobs,
    clearKanbanJobs,

    clearAll,
    updateJobStatus,
    updateJobEvents,
    addJobEvent,
    updateJobCompanyDefaults,
    updateJobPartialData,

    setBasicInfo,
    updateBasicInfo,
    loadBasicInfo,

    jobToHeader,
    setHeader,
    patchHeader,
    upsertFromFullJob,

    fetchJob,
  }
})
