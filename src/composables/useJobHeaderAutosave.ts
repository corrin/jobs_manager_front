import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { createJobAutosave, type SaveResult } from './useJobAutosave'
import { jobService } from '../services/job.service'
import { useJobsStore } from '../stores/jobs'
import { toast } from 'vue-sonner'
import { debugLog } from '../utils/debug'
import type { z } from 'zod'
import type { schemas } from '../api/generated/api'

type Job = z.infer<typeof schemas.Job>
type JobDetailResponse = z.infer<typeof schemas.JobDetailResponse>
type JobData = z.infer<typeof schemas.JobData>

export function useJobHeaderAutosave(jobData: Job) {
  const router = useRouter()
  const jobsStore = useJobsStore()

  // Local reactive data for header fields
  const localJobData = ref<Partial<Job>>({})
  const originalJobData = ref<Partial<Job>>({})
  const isInitializing = ref(false)
  const hasInitialized = ref(false)

  let unbindRouteGuard: () => void = () => {}

  // Initialize local data when jobData changes
  const initializeData = (newJobData: Job) => {
    debugLog(
      'JobHeaderAutosave - initializeData called with:',
      newJobData?.id,
      'isInitializing:',
      isInitializing.value,
    )

    if (!newJobData?.id) {
      debugLog('JobHeaderAutosave - initializeData aborted: no job ID')
      return
    }

    // Evita race/duplicação
    if (isInitializing.value || hasInitialized.value) {
      debugLog('JobHeaderAutosave - initializeData aborted: already initializing or initialized')
      return
    }

    isInitializing.value = true
    debugLog('JobHeaderAutosave - Starting initialization')

    const jobDataSnapshot = {
      id: newJobData.id,
      name: newJobData.name,
      client_id: newJobData.client_id,
      client_name: newJobData.client_name,
      contact_id: newJobData.contact_id,
      contact_name: newJobData.contact_name,
      job_status: newJobData.job_status,
      pricing_methodology: newJobData.pricing_methodology,
    }

    localJobData.value = { ...jobDataSnapshot }
    originalJobData.value = { ...jobDataSnapshot }

    isInitializing.value = false
    hasInitialized.value = true
    debugLog('JobHeaderAutosave - Initialization completed')
  }

  // Create autosave instance
  const autosave = createJobAutosave({
    jobId: jobData.id,
    getSnapshot: () => {
      // Always base no-op check with latest saved state
      return {
        id: originalJobData.value.id,
        name: originalJobData.value.name,
        client_id: originalJobData.value.client_id,
        client_name: originalJobData.value.client_name,
        contact_id: originalJobData.value.contact_id,
        contact_name: originalJobData.value.contact_name,
        job_status: originalJobData.value.job_status,
        pricing_methodology: originalJobData.value.pricing_methodology,
      }
    },
    applyOptimistic: (patch) => {
      Object.entries(patch).forEach(([k, v]) => {
        ;(localJobData.value as Record<string, unknown>)[k] = v as unknown
      })
    },
    rollbackOptimistic: (previous) => {
      Object.entries(previous).forEach(([k, v]) => {
        ;(localJobData.value as Record<string, unknown>)[k] = v as unknown
      })
    },
    saveAdapter: async (patch): Promise<SaveResult> => {
      try {
        if (!jobData.id) {
          return { success: false, error: 'Missing job id' }
        }

        const storeJob = jobsStore.getJobById(jobData.id) as JobData | undefined
        const baseline: Job = (storeJob?.job ?? jobData) as Job
        const header: Partial<Job> = {
          name: originalJobData.value.name ?? baseline.name,
          client_id: originalJobData.value.client_id ?? baseline.client_id,
          client_name: originalJobData.value.client_name ?? baseline.client_name,
          contact_id: originalJobData.value.contact_id ?? baseline.contact_id,
          contact_name: originalJobData.value.contact_name ?? baseline.contact_name,
          job_status: originalJobData.value.job_status ?? baseline.job_status,
          pricing_methodology:
            originalJobData.value.pricing_methodology ?? baseline.pricing_methodology,
        }

        // Start with complete original jobData to ensure all required fields are present
        // Then apply the patch to override specific fields (including contact_id clearing)
        const mergedJob = {
          ...baseline, // Complete job data with all required fields
          ...header,
          ...(patch as Partial<Job>), // Apply patch changes (this will override contact_id if needed)
        } as Job

        if ('client_id' in (patch as Record<string, unknown>)) {
          mergedJob.contact_id = null
          mergedJob.contact_name = null
        }

        debugLog('JobHeaderAutosave - Final payload (mergedJob):', {
          job_status: mergedJob.job_status,
          pricing_methodology: mergedJob.pricing_methodology,
          client_id: mergedJob.client_id,
          contact_id: mergedJob.contact_id,
        })

        const jobDetailResponse: JobDetailResponse = {
          success: true,
          data: {
            job: mergedJob,
            events: [],
            company_defaults: {
              wage_rate: 0,
              time_markup: 0,
              materials_markup: 0,
              charge_out_rate: 0,
            },
          },
        }

        const result = await jobService.updateJob(jobData.id, jobDetailResponse)
        if (!result.success) return { success: false, error: result.error || 'Update failed' }

        const payload = result?.data?.data as JobData
        const savedJob: Job = (payload?.job as Job) ?? mergedJob

        if (payload?.job) {
          jobsStore.setDetailedJob(payload)
        } else {
          debugLog('JobHeaderAutosave - Unexpected payload shape, skipping store update')
        }

        originalJobData.value = {
          id: savedJob.id,
          name: savedJob.name,
          client_id: savedJob.client_id,
          client_name: savedJob.client_name,
          contact_id: savedJob.contact_id,
          contact_name: savedJob.contact_name,
          job_status: savedJob.job_status,
          pricing_methodology: savedJob.pricing_methodology,
        }

        toast.success('Job updated successfully')

        return { success: true, serverData: result.data }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        return { success: false, error: msg }
      }
    },
    devLogging: true,
  })

  // Helper to queue changes only when not initializing
  const enqueueIfNotInitializing = (key: string, value: unknown) => {
    debugLog('JobHeaderAutosave - enqueueIfNotInitializing:', {
      key,
      value,
      isInitializing: isInitializing.value,
    })
    if (!isInitializing.value) {
      autosave.queueChange(key, value)
    } else {
      debugLog('JobHeaderAutosave - Skipping queue because isInitializing is true')
    }
  }

  // Handler functions for inline edit components
  const handleNameUpdate = (newName: string) => {
    localJobData.value.name = newName
    enqueueIfNotInitializing('name', newName)
  }

  const handleClientUpdate = (client: { id: string; name: string }) => {
    debugLog('JobHeaderAutosave - Client update:', client)
    debugLog('JobHeaderAutosave - Previous contact_id:', localJobData.value.contact_id)

    // Only updates local data
    localJobData.value.client_id = client.id
    localJobData.value.client_name = client.name
    localJobData.value.contact_id = null
    localJobData.value.contact_name = null

    autosave.queueChanges({
      client_id: client.id,
      client_name: client.name,
      contact_id: null,
      contact_name: null,
    })

    debugLog('JobHeaderAutosave - Flushing client change with cleared contact')
    void autosave.flush('client-change')
  }

  const handleStatusUpdate = (newStatus: string) => {
    localJobData.value.job_status = newStatus
    enqueueIfNotInitializing('job_status', newStatus)
  }

  const handlePricingMethodologyUpdate = (newMethod: string) => {
    localJobData.value.pricing_methodology = newMethod as 'time_materials' | 'fixed_price'
    enqueueIfNotInitializing('pricing_methodology', newMethod)
  }

  // Status indicators
  const saveHasError = computed(() => !!autosave.error.value)
  const saveStatusText = computed(() => {
    if (autosave.isSaving.value) return 'Saving...'
    if (autosave.error.value) return 'Save failed'
    if (autosave.lastSavedAt.value) {
      try {
        return `Saved at ${autosave.lastSavedAt.value.toLocaleTimeString()}`
      } catch {
        return 'Saved'
      }
    }
    return ''
  })

  const retrySave = () => {
    void autosave.flush('retry-click')
  }

  // Lifecycle bindings
  onMounted(() => {
    autosave.onBeforeUnloadBind()
    autosave.onVisibilityBind()
    unbindRouteGuard = autosave.onRouteLeaveBind({
      beforeEach: router.beforeEach.bind(router),
    })

    // Initialize with current job data
    initializeData(jobData)
  })

  onUnmounted(() => {
    autosave.onBeforeUnloadUnbind()
    autosave.onVisibilityUnbind()
    unbindRouteGuard()
  })

  return {
    localJobData,
    handleNameUpdate,
    handleClientUpdate,
    handleStatusUpdate,
    handlePricingMethodologyUpdate,
    saveHasError,
    saveStatusText,
    retrySave,
    initializeData,
  }
}
