import { useJobsStore, type JobPricings } from '@/stores/jobs'
import { jobRestService, type JobEvent, type JobData } from '@/services/job-rest.service'
import { useJobCache } from './useJobCache'

export function useJobReactivity() {
  const jobsStore = useJobsStore()
  const { setCachedJob, updateCachedJob, withCache } = useJobCache()

  const ongoingReloads = new Set<string>()

  const updateJobReactively = (jobId: string, updates: Partial<JobData>) => {
    jobsStore.updateJobPartialData(jobId, updates)
    updateCachedJob(jobId, updates)
    console.log(`🔄 Job ${jobId} updated reactively:`, Object.keys(updates))
  }

  const addEventReactively = (jobId: string, event: JobEvent) => {
    jobsStore.addJobEvent(jobId, event)
    console.log(`📝 Event added reactively to job ${jobId}:`, event.event_type)
  }

  const updateStatusReactively = (jobId: string, newStatus: string) => {
    jobsStore.updateJobStatus(jobId, newStatus)
    console.log(`📊 Status updated reactively for job ${jobId}:`, newStatus)
  }

  const updatePricingsReactively = (jobId: string, pricings: JobPricings) => {
    jobsStore.updateJobPricings(jobId, pricings)
    console.log(`💰 Pricings updated reactively for job ${jobId}`)
  }

  const reloadJobDataReactively = async (jobId: string, forceReload = false): Promise<void> => {
    if (ongoingReloads.has(jobId)) {
      console.log(`⏳ Job ${jobId} reload already in progress, skipping duplicate request`)
      return
    }

    ongoingReloads.add(jobId)

    try {
      const loadFromAPI = async () => {
        const response = await jobRestService.getJobForEdit(jobId)

        if (!response.success || !response.data) {
          throw new Error('Failed to load job data from API')
        }

        return {
          ...response.data.job,
          latest_pricings: response.data.latest_pricings || {},
          events: response.data.events || [],
          company_defaults: response.data.company_defaults || null,
        }
      }

      let enrichedJob: JobData

      if (forceReload) {
        enrichedJob = await loadFromAPI()
      } else {
        enrichedJob = await withCache(jobId, loadFromAPI)
      }

      jobsStore.setDetailedJob(enrichedJob)
      setCachedJob(jobId, enrichedJob)

      console.log(
        `♻️ Job ${jobId} data reloaded reactively ${forceReload ? '(forced)' : '(with cache)'}`,
      )
    } catch (error) {
      console.error(`Error reloading job ${jobId}:`, error)
      throw error
    } finally {
      ongoingReloads.delete(jobId)
    }
  }

  return {
    updateJobReactively,
    addEventReactively,
    updateStatusReactively,
    updatePricingsReactively,
    reloadJobDataReactively,
  }
}
