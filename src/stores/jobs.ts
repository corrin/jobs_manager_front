import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { JobData } from '@/services/jobRestService'
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
  detailedJobs: Record<string, JobData>

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
  const detailedJobs = ref<Record<string, JobData>>({})
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
    return (id: string): JobData | null => {
      return detailedJobs.value[id] || null
    }
  })

  const getKanbanJobById = computed(() => {
    return (id: string): JobKanbanData | null => {
      return kanbanJobs.value[id] || null
    }
  })

  // Actions para gerenciar jobs detalhados
  const setDetailedJob = (job: JobData): void => {
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

  const updateDetailedJob = (jobId: string, updates: Partial<JobData>): void => {
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
  const updateKanbanJobFromDetailed = (detailedJob: JobData): void => {
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
      detailedJobs.value[jobId] = { ...job, latest_pricings: pricings }
    }
  }

  const updateJobCompanyDefaults = (jobId: string, companyDefaults: any): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      detailedJobs.value[jobId] = { ...job, company_defaults: companyDefaults }
    }
  }

  // Action para atualizar dados específicos sem recarregar tudo
  const updateJobPartialData = (jobId: string, partialData: Partial<JobData>): void => {
    const job = detailedJobs.value[jobId]
    if (job) {
      detailedJobs.value[jobId] = { ...job, ...partialData }

      // Sincronizar dados essenciais com kanban se existir
      if (kanbanJobs.value[jobId]) {
        updateKanbanJobFromDetailed(detailedJobs.value[jobId])
      }
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
    clearAll,
    updateJobStatus,
    updateJobEvents,
    addJobEvent,
    updateJobPricings,
    updateJobCompanyDefaults,
    updateJobPartialData,
  }
})
