import { useJobsStore, type JobPricings } from '@/stores/jobs'
import { jobRestService, type JobEvent, type JobData } from '@/services/job-rest.service'
import { useJobCache } from './useJobCache'

/**
 * Composable para gerenciar atualizações reativas de jobs
 * Centraliza a lógica de updates para manter consistência
 */
export function useJobReactivity() {
  const jobsStore = useJobsStore()
  const { setCachedJob, updateCachedJob, withCache } = useJobCache()

  // Track ongoing operations to prevent duplicate calls
  const ongoingReloads = new Set<string>()

  /**
   * Atualiza dados parciais do job de forma reativa
   */
  const updateJobReactively = (jobId: string, updates: Partial<JobData>) => {
    jobsStore.updateJobPartialData(jobId, updates)
    updateCachedJob(jobId, updates) // Sincronizar com cache
    console.log(`🔄 Job ${jobId} updated reactively:`, Object.keys(updates))
  }

  /**
   * Adiciona evento ao job de forma reativa
   */
  const addEventReactively = (jobId: string, event: JobEvent) => {
    jobsStore.addJobEvent(jobId, event)
    console.log(`📝 Event added reactively to job ${jobId}:`, event.event_type)
  }

  /**
   * Atualiza status do job de forma reativa
   */
  const updateStatusReactively = (jobId: string, newStatus: string) => {
    jobsStore.updateJobStatus(jobId, newStatus)
    console.log(`📊 Status updated reactively for job ${jobId}:`, newStatus)
  }

  /**
   * Atualiza pricings do job de forma reativa
   */
  const updatePricingsReactively = (jobId: string, pricings: JobPricings) => {
    jobsStore.updateJobPricings(jobId, pricings)
    console.log(`💰 Pricings updated reactively for job ${jobId}`)
  }

  /**
   * Recarrega dados completos do job de forma reativa com cache inteligente
   * Usado quando precisamos de dados frescos da API
   */
  const reloadJobDataReactively = async (jobId: string, forceReload = false): Promise<void> => {
    // Prevent duplicate calls
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
        // Força recarregamento da API
        enrichedJob = await loadFromAPI()
      } else {
        // Usa cache inteligente
        enrichedJob = await withCache(jobId, loadFromAPI)
      }

      // Atualizar store e cache
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
