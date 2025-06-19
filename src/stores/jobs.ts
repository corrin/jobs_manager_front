import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { JobDetail } from '@/schemas/job.schemas'
import type { Job } from '@/types'

// Tipo específico para dados do job no kanban (versão resumida)
export interface JobKanbanData {
  id: string
  name: string
  description?: string | null
  job_number: number
  client_name: string
  contact_person?: string | null
  people: Array<{ id: string; display_name: string }>
  status: string
  status_key: string
  job_status: string
  paid: boolean
  created_by_id?: string | null
  created_at?: string
  priority?: number
}

export interface JobsStoreState {
  // Jobs completos para visualização detalhada
  detailedJobs: Record<string, JobDetail>

  // Jobs resumidos para kanban
  kanbanJobs: Record<string, JobKanbanData>

  // Job atualmente sendo visualizado
  currentJobId: string | null

  // Estados de loading
  isLoadingJob: boolean
  isLoadingKanban: boolean

  // Contexto atual da aplicação
  currentContext: 'kanban' | 'detail' | null
}

export const useJobsStore = defineStore('jobs', () => {
  // State - usar objetos reativos ao invés de Maps para melhor reatividade
  const detailedJobs = ref<Record<string, JobDetail>>({})
  const kanbanJobs = ref<Record<string, JobKanbanData>>({})
  const currentJobId = ref<string | null>(null)
  const isLoadingJob = ref(false)
  const isLoadingKanban = ref(false)
  const currentContext = ref<'kanban' | 'detail' | null>(null)

  // Getters
  const currentJob = computed(() => {
    if (!currentJobId.value) return null
    return detailedJobs.value[currentJobId.value] || null
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
    return (id: string): JobKanbanData | null => {
      return kanbanJobs.value[id] || null
    }
  })

  // Actions para gerenciar jobs detalhados
  const setDetailedJob = (job: JobDetail): void => {
    // Guard clause - validar se job e job.id existem e são válidos
    if (!job) {
      console.error('🚨 Store - setDetailedJob called with null/undefined job')
      console.trace('Stack trace for undefined job call')
      return
    }

    if (!job.id || typeof job.id !== 'string') {
      console.error('🚨 Store - setDetailedJob called with invalid job.id:', job.id, 'Full job:', job)
      console.trace('Stack trace for invalid job.id call')
      return
    }

    // Evitar loops infinitos - verificar se o job já existe e é idêntico
    const existingJob = detailedJobs.value[job.id]
    if (existingJob && JSON.stringify(existingJob) === JSON.stringify(job)) {
      console.log('🔄 Store - Job data identical, skipping update to prevent loop:', job.id)
      return
    }

    console.log('🏪 Store - setDetailedJob called with job:', job.id, 'job_status:', job.job_status)
    console.log('🏪 Store - Before update, current job in store:', detailedJobs.value[job.id]?.job_status || 'NOT_FOUND')

    // Criar novo objeto para forçar reatividade
    const newJob = { ...job }
    detailedJobs.value = {
      ...detailedJobs.value,
      [job.id]: newJob
    }

    console.log('🏪 Store - After update, job in store:', detailedJobs.value[job.id]?.job_status)

    // Atualizar também no kanban se o job existir lá
    if (kanbanJobs.value[job.id]) {
      console.log('🏪 Store - Also updating kanban job')
      updateKanbanJobFromDetailed(newJob)
    }
  }

  const updateDetailedJob = (jobId: string, updates: Partial<JobDetail>): void => {
    const existingJob = detailedJobs.value[jobId]
    if (existingJob) {
      // Criar novo objeto para forçar reatividade
      const updatedJob = { ...existingJob, ...updates }
      detailedJobs.value = {
        ...detailedJobs.value,
        [jobId]: updatedJob
      }

      // Atualizar também no kanban se o job existir lá
      if (kanbanJobs.value[jobId]) {
        updateKanbanJobFromDetailed(updatedJob)
      }
    }
  }

  const removeDetailedJob = (jobId: string): void => {
    delete detailedJobs.value[jobId]
  }

  // Actions para gerenciar jobs do kanban
  const setKanbanJobs = (jobs: JobKanbanData[]): void => {
    // Limpar primeiro e depois popular
    kanbanJobs.value = {}
    jobs.forEach(job => {
      kanbanJobs.value[job.id] = job
    })
  }

  const setKanbanJob = (job: JobKanbanData): void => {
    kanbanJobs.value[job.id] = job
  }

  const updateKanbanJob = (jobId: string, updates: Partial<JobKanbanData>): void => {
    const existingJob = kanbanJobs.value[jobId]
    if (existingJob) {
      kanbanJobs.value[jobId] = { ...existingJob, ...updates }
    }
  }

  const removeKanbanJob = (jobId: string): void => {
    delete kanbanJobs.value[jobId]
  }

  // Helper para sincronizar dados do job detalhado para o kanban
  const updateKanbanJobFromDetailed = (detailedJob: JobDetail): void => {
    const kanbanJob = kanbanJobs.value[detailedJob.id]
    if (kanbanJob) {
      kanbanJobs.value[detailedJob.id] = {
        ...kanbanJob,
        name: detailedJob.name,
        job_status: detailedJob.job_status,
        client_name: detailedJob.client_name,
        contact_person: detailedJob.contact_name || kanbanJob.contact_person,
        paid: detailedJob.paid || false,
      }
    }
  }

  // Actions para navegação
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

  // Actions para limpeza
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
    currentContext.value = null
  }

  // Action para atualizar status específico (usado pelos modals)
  const updateJobStatus = (jobId: string, newStatus: string): void => {
    // Atualizar no job detalhado
    updateDetailedJob(jobId, { job_status: newStatus })

    // Atualizar no kanban
    updateKanbanJob(jobId, { job_status: newStatus })
  }

  // Actions específicas para atualizar dados do job de forma reativa
  const updateJobEvents = (jobId: string, events: any[]): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      detailedJobs.value[jobId] = { ...job, events }
    }
  }

  const addJobEvent = (jobId: string, event: any): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      const events = job.events || []
      detailedJobs.value[jobId] = { ...job, events: [event, ...events] }
    }
  }

  const updateJobPricings = (jobId: string, pricings: any): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      // Atualizar as estruturas de pricing individuais
      const updates: Partial<JobDetail> = {}
      if (pricings.estimate_pricing) {
        updates.latest_estimate_pricing = pricings.estimate_pricing
      }
      if (pricings.quote_pricing) {
        updates.latest_quote_pricing = pricings.quote_pricing
      }
      if (pricings.reality_pricing) {
        updates.latest_reality_pricing = pricings.reality_pricing
      }

      detailedJobs.value[jobId] = { ...job, ...updates }
    }
  }

  const updateJobCompanyDefaults = (jobId: string, companyDefaults: any): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      detailedJobs.value[jobId] = { ...job, company_defaults: companyDefaults }
    }
  }

  // Action para atualizar dados específicos sem recarregar tudo
  const updateJobPartialData = (jobId: string, partialData: Partial<JobDetail>): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      detailedJobs.value[jobId] = { ...job, ...partialData }

      // Sincronizar dados essenciais com kanban se existir
      if (kanbanJobs.value[jobId]) {
        updateKanbanJobFromDetailed(detailedJobs.value[jobId])
      }
    }
  }

  // Actions assíncronas para adicionar entradas
  const addTimeEntry = async (jobId: string, timeEntryData: any): Promise<void> => {
    try {
      console.log('🏪 Store - Adding time entry for job:', jobId, timeEntryData)

      // Importar o service aqui para evitar circular dependency
      const { jobRestService } = await import('@/services/job-rest.service')

      // Verificar se temos o job atual e suas pricings
      const currentJob = detailedJobs.value[jobId]
      if (!currentJob?.latest_estimate_pricing?.id) {
        throw new Error('Job or estimate pricing not found')
      }

      // Preparar dados para o backend
      const hours = timeEntryData.estimatedHours || timeEntryData.hours || 0
      const chargeMultiplier = timeEntryData.chargeMultiplier || 1
      const baseChargeOutRate = Number(currentJob.company_defaults?.charge_out_rate) || Number(currentJob.charge_out_rate) || 105.0
      const baseWageRate = Number(currentJob.company_defaults?.wage_rate) || 32.0

      console.log('🔍 Store - Debug wage_rate and charge_out_rate:', {
        company_defaults: currentJob.company_defaults,
        job_charge_out_rate: currentJob.charge_out_rate,
        calculated_charge_out_rate: chargeMultiplier * baseChargeOutRate,
        base_wage_rate: baseWageRate
      })

      const entryData = {
        job_pricing_id: currentJob.latest_estimate_pricing.id,
        description: timeEntryData.taskName || timeEntryData.description,
        hours: hours, // Campo obrigatório para o backend
        items: 1,
        minutes_per_item: hours * 60,
        wage_rate: baseWageRate,
        charge_out_rate: chargeMultiplier * baseChargeOutRate
      }

      const response = await jobRestService.createTimeEntry(jobId, entryData)

      if (response.success && response.data) {
        // Atualizar o job no store com os dados retornados
        setDetailedJob(response.data.job)

        // Forçar um reload completo para garantir reatividade das pricing entries
        const { jobRestService: reloadService } = await import('@/services/job-rest.service')
        const freshResponse = await reloadService.getJobForEdit(jobId)
        if (freshResponse.success && freshResponse.data) {
          setDetailedJob(freshResponse.data.job)
        }

        console.log('✅ Store - Time entry added successfully and job reloaded')
      } else {
        throw new Error('Failed to add time entry')
      }
    } catch (error) {
      console.error('❌ Store - Error adding time entry:', error)
      throw error
    }
  }

  const addMaterialEntry = async (jobId: string, materialEntryData: any): Promise<void> => {
    try {
      console.log('🏪 Store - Adding material entry for job:', jobId, materialEntryData)

      const { jobRestService } = await import('@/services/job-rest.service')

      const currentJob = detailedJobs.value[jobId]
      if (!currentJob?.latest_estimate_pricing?.id) {
        throw new Error('Job or estimate pricing not found')
      }

      // Calcular unit_revenue baseado no markup
      const unitCost = materialEntryData.unitPrice || 0
      const markupPercent = materialEntryData.chargePercentage || 0
      const unitRevenue = unitCost * (1 + markupPercent / 100)

      const entryData = {
        job_pricing_id: currentJob.latest_estimate_pricing.id,
        description: materialEntryData.description,
        quantity: materialEntryData.quantity || 1,
        unit_cost: unitCost,
        unit_revenue: unitRevenue
      }

      const response = await jobRestService.createMaterialEntry(jobId, entryData)

      if (response.success && response.data) {
        // Atualizar o job no store com os dados retornados
        setDetailedJob(response.data.job)

        // Forçar um reload completo para garantir reatividade das pricing entries
        const { jobRestService: reloadService } = await import('@/services/job-rest.service')
        const freshResponse = await reloadService.getJobForEdit(jobId)
        if (freshResponse.success && freshResponse.data) {
          setDetailedJob(freshResponse.data.job)
        }

        console.log('✅ Store - Material entry added successfully and job reloaded')
      } else {
        throw new Error('Failed to add material entry')
      }
    } catch (error) {
      console.error('❌ Store - Error adding material entry:', error)
      throw error
    }
  }

  const addAdjustmentEntry = async (jobId: string, adjustmentEntryData: any): Promise<void> => {
    try {
      console.log('🏪 Store - Adding adjustment entry for job:', jobId, adjustmentEntryData)

      const { jobRestService } = await import('@/services/job-rest.service')

      const currentJob = detailedJobs.value[jobId]
      if (!currentJob?.latest_estimate_pricing?.id) {
        throw new Error('Job or estimate pricing not found')
      }

      const entryData = {
        job_pricing_id: currentJob.latest_estimate_pricing.id,
        description: adjustmentEntryData.description,
        cost_adjustment: adjustmentEntryData.amount || 0,
        price_adjustment: adjustmentEntryData.amount || 0,
        comments: `Adjustment type: ${adjustmentEntryData.adjustmentType || 'add'}`
      }

      const response = await jobRestService.createAdjustmentEntry(jobId, entryData)

      if (response.success && response.data) {
        // Atualizar o job no store com os dados retornados
        setDetailedJob(response.data.job)

        // Forçar um reload completo para garantir reatividade das pricing entries
        const { jobRestService: reloadService } = await import('@/services/job-rest.service')
        const freshResponse = await reloadService.getJobForEdit(jobId)
        if (freshResponse.success && freshResponse.data) {
          setDetailedJob(freshResponse.data.job)
        }

        console.log('✅ Store - Adjustment entry added successfully and job reloaded')
      } else {
        throw new Error('Failed to add adjustment entry')
      }    } catch (error) {
      console.error('❌ Store - Error adding adjustment entry:', error)
      throw error
    }
  }

  // Quote sync actions
  const linkQuote = async (jobId: string, templateUrl?: string): Promise<void> => {
    try {
      console.log('🏪 Store - Linking quote sheet for job:', jobId)
      
      const { quoteService } = await import('@/services/quote.service')
      const result = await quoteService.linkQuote(jobId, templateUrl)
      
      // Update job with quote sheet info - Note: this would need proper typing
      console.log('✅ Store - Quote sheet linked successfully:', result)
    } catch (error) {
      console.error('❌ Store - Error linking quote sheet:', error)
      throw error
    }
  }

  const refreshQuote = async (jobId: string, options: { skipValidation?: boolean } = {}): Promise<void> => {
    try {
      console.log('🏪 Store - Refreshing quote for job:', jobId)
      
      const { quoteService } = await import('@/services/quote.service')
      
      // Get preview first if not skipping validation
      if (!options.skipValidation) {
        const preview = await quoteService.previewQuote(jobId)
        // Note: Preview handling should be done in the component
        // This is just for direct application
      }
      
      // Apply the quote changes
      const result = await quoteService.applyQuote(jobId)
      
      if (result.success && result.cost_set) {
        // Force reload the job to get updated data
        const { jobRestService } = await import('@/services/job-rest.service')
        const freshResponse = await jobRestService.getJobForEdit(jobId)
        if (freshResponse.success && freshResponse.data) {
          setDetailedJob(freshResponse.data.job)
        }
        
        console.log('✅ Store - Quote refreshed successfully')
      } else {
        throw new Error(result.error || 'Quote refresh failed')
      }
    } catch (error) {
      console.error('❌ Store - Error refreshing quote:', error)
      throw error
    }
  }

  return {
    // State
    detailedJobs,
    kanbanJobs,
    currentJobId,
    isLoadingJob,
    isLoadingKanban,
    currentContext,

    // Getters
    currentJob,
    allKanbanJobs,
    getJobById,
    getKanbanJobById,

    // Actions
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
    
    // Additional actions
    clearAll,
    updateJobStatus,
    updateJobEvents,
    addJobEvent,
    updateJobPricings,
    updateJobCompanyDefaults,
    updateJobPartialData,

    // Actions assíncronas
    addTimeEntry,
    addMaterialEntry,
    addAdjustmentEntry,
    
    // Quote sync actions
    linkQuote,
    refreshQuote,
  }
})
