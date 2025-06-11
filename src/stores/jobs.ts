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
  detailedJobs: Map<string, JobData>
  
  // Jobs resumidos para kanban
  kanbanJobs: Map<string, JobKanbanData>
  
  // Job atualmente sendo visualizado
  currentJobId: string | null
  
  // Estados de loading
  isLoadingJob: boolean
  isLoadingKanban: boolean
  
  // Contexto atual da aplicação
  currentContext: 'kanban' | 'detail' | null
}

export const useJobsStore = defineStore('jobs', () => {
  // State
  const detailedJobs = ref<Map<string, JobData>>(new Map())
  const kanbanJobs = ref<Map<string, JobKanbanData>>(new Map())
  const currentJobId = ref<string | null>(null)
  const isLoadingJob = ref(false)
  const isLoadingKanban = ref(false)
  const currentContext = ref<'kanban' | 'detail' | null>(null)

  // Getters
  const currentJob = computed(() => {
    if (!currentJobId.value) return null
    return detailedJobs.value.get(currentJobId.value) || null
  })

  const allKanbanJobs = computed(() => {
    return Array.from(kanbanJobs.value.values())
  })

  const getJobById = computed(() => {
    return (id: string): JobData | null => {
      return detailedJobs.value.get(id) || null
    }
  })

  const getKanbanJobById = computed(() => {
    return (id: string): JobKanbanData | null => {
      return kanbanJobs.value.get(id) || null
    }
  })  // Actions para gerenciar jobs detalhados
  const setDetailedJob = (job: JobData): void => {
    console.log('🏪 Store - setDetailedJob called with job:', job.id, 'status:', job.job_status)
    console.log('🏪 Store - Before update, current job in store:', detailedJobs.value.get(job.id)?.job_status || 'NOT_FOUND')
    
    detailedJobs.value.set(job.id, job)
    
    console.log('🏪 Store - After update, job in store:', detailedJobs.value.get(job.id)?.job_status)
    
    // Atualizar também no kanban se o job existir lá
    if (kanbanJobs.value.has(job.id)) {
      console.log('🏪 Store - Also updating kanban job')
      updateKanbanJobFromDetailed(job)
    }
  }

  const updateDetailedJob = (jobId: string, updates: Partial<JobData>): void => {
    const existingJob = detailedJobs.value.get(jobId)
    if (existingJob) {
      const updatedJob = { ...existingJob, ...updates }
      detailedJobs.value.set(jobId, updatedJob)
      
      // Atualizar também no kanban se o job existir lá
      if (kanbanJobs.value.has(jobId)) {
        updateKanbanJobFromDetailed(updatedJob)
      }
    }
  }

  const removeDetailedJob = (jobId: string): void => {
    detailedJobs.value.delete(jobId)
    
    // Limpar currentJobId se for o job removido
    if (currentJobId.value === jobId) {
      currentJobId.value = null
    }
  }

  // Actions para gerenciar jobs do kanban
  const setKanbanJobs = (jobs: JobKanbanData[]): void => {
    kanbanJobs.value.clear()
    jobs.forEach(job => {
      kanbanJobs.value.set(job.id, job)
    })
  }

  const setKanbanJob = (job: JobKanbanData): void => {
    kanbanJobs.value.set(job.id, job)
  }

  const updateKanbanJob = (jobId: string, updates: Partial<JobKanbanData>): void => {
    const existingJob = kanbanJobs.value.get(jobId)
    if (existingJob) {
      const updatedJob = { ...existingJob, ...updates }
      kanbanJobs.value.set(jobId, updatedJob)
    }
  }

  const removeKanbanJob = (jobId: string): void => {
    kanbanJobs.value.delete(jobId)
  }

  // Helper para sincronizar dados do job detalhado para o kanban
  const updateKanbanJobFromDetailed = (detailedJob: JobData): void => {
    const kanbanJob = kanbanJobs.value.get(detailedJob.id)
    if (kanbanJob) {
      const updatedKanbanJob: JobKanbanData = {
        ...kanbanJob,
        name: detailedJob.name,
        job_status: detailedJob.job_status,
        client_name: detailedJob.client_name,
        // Adicionar outros campos relevantes para o kanban
      }
      kanbanJobs.value.set(detailedJob.id, updatedKanbanJob)
    }
  }

  // Actions para controle de estado
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
    detailedJobs.value.clear()
    currentJobId.value = null
  }

  const clearKanbanJobs = (): void => {
    kanbanJobs.value.clear()
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
  }
})
