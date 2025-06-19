<template>
  <AppLayout>
    <div class="flex flex-col h-full min-h-0 pt-6">
      <!-- Mobile Header -->
      <div class="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <!-- Mobil            <button
              v-if="featureFlags.isCostingApiEnabled"
              @click="activeTab = 'costing'"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'costing'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Cost Analysis
            </button>acked) -->
        <div class="md:hidden">
          <!-- Top row: Back button -->
          <div class="flex items-center justify-between mb-3">
            <button
              @click="navigateBack"
              class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
          </div>

          <!-- Job title and info -->
          <div class="mb-3">
            <h1 class="text-lg font-bold text-gray-900 leading-tight">
              {{ jobData?.name || 'Loading...' }}
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              Job #{{ jobData?.job_number }} • {{ jobData?.client_name }}
            </p>
          </div>

          <!-- Action buttons - horizontal scroll on mobile -->
          <div class="flex space-x-2 overflow-x-auto pb-2">
            <DraggableButton
              variant="ghost"
              @click="showSettingsModal = true"
              class="text-blue-600 hover:bg-blue-50 flex-shrink-0"
              size="sm"
            >
              <Settings class="w-4 h-4" />
            </DraggableButton>

            <DraggableButton
              variant="ghost"
              @click="showWorkflowModal = true"
              class="text-green-600 hover:bg-green-50 flex-shrink-0"
              size="sm"
            >
              <Wrench class="w-4 h-4" />
            </DraggableButton>

            <DraggableButton
              variant="ghost"
              @click="showHistoryModal = true"
              class="text-purple-600 hover:bg-purple-50 flex-shrink-0"
              size="sm"
            >
              <BookOpen class="w-4 h-4" />
            </DraggableButton>

            <DraggableButton
              variant="ghost"
              @click="showAttachmentsModal = true"
              class="text-orange-600 hover:bg-orange-50 flex-shrink-0"
              size="sm"
            >
              <Paperclip class="w-4 h-4" />
            </DraggableButton>
          </div>
        </div>

        <!-- Desktop/Tablet Layout (original) -->
        <div class="hidden md:flex items-end justify-between h-7">
          <div class="flex items-center space-x-4">
            <button
              @click="navigateBack"
              class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div>
              <h1 class="text-xl font-bold text-gray-900">
                {{ jobData?.name || 'Loading...' }}
              </h1>
              <p class="text-sm text-gray-500">
                Job #{{ jobData?.job_number }} • {{ jobData?.client_name }}
              </p>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <!-- Action Buttons -->
            <div class="flex space-x-2">
              <DraggableButton
                variant="ghost"
                @click="showSettingsModal = true"
                class="text-blue-600 hover:bg-blue-50"
                size="sm"
              >
                <Settings class="w-4 h-4" />
              </DraggableButton>

              <DraggableButton
                variant="ghost"
                @click="showWorkflowModal = true"
                class="text-green-600 hover:bg-green-50"
                size="sm"
              >
                <Wrench class="w-4 h-4" />
              </DraggableButton>

              <DraggableButton
                variant="ghost"
                @click="showHistoryModal = true"
                class="text-purple-600 hover:bg-purple-50"
                size="sm"
              >
                <BookOpen class="w-4 h-4" />
              </DraggableButton>

              <DraggableButton
                variant="ghost"
                @click="showAttachmentsModal = true"
                class="text-orange-600 hover:bg-orange-50"
                size="sm"
              >
                <Paperclip class="w-4 h-4" />
              </DraggableButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo Principal -->
      <div class="flex-1 flex flex-col min-h-0">
      <!-- Tabs Navigation - Mobile First -->
      <div class="flex-shrink-0 bg-white border-b border-gray-200">
        <!-- Mobile Tabs -->
        <div class="md:hidden">
          <div class="flex border-b border-gray-200">
            <button
              @click="activeTab = 'estimate'"
              :class="[
                'flex-1 py-3 px-2 text-sm font-medium text-center border-b-2 transition-colors',
                activeTab === 'estimate'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              ]"
            >
              Estimate
            </button>
            <button
              @click="activeTab = 'quote'"
              :class="[
                'flex-1 py-3 px-2 text-sm font-medium text-center border-b-2 transition-colors',
                activeTab === 'quote'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              ]"
            >
              Quote
            </button>
            <button
              @click="activeTab = 'financial'"
              :class="[
                'flex-1 py-3 px-2 text-sm font-medium text-center border-b-2 transition-colors',
                activeTab === 'financial'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              ]"
            >
              Financial
            </button>
            <button
              @click="activeTab = 'costAnalysis'"
              :class="[
                'flex-1 py-3 px-2 text-sm font-medium text-center border-b-2 transition-colors',
                activeTab === 'costAnalysis'
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              ]"
            >
              Cost Analysis
            </button>
          </div>
        </div>

        <!-- Desktop/Tablet Tabs -->
        <div class="hidden md:block px-6">
          <nav class="-mb-px flex space-x-8">
            <button
              @click="activeTab = 'estimate'"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'estimate'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Estimate
            </button>
            <button
              @click="activeTab = 'quote'"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'quote'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Quote Import
            </button>
            <button
              @click="activeTab = 'financial'"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'financial'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Financial Overview
            </button>
            <button
              @click="activeTab = 'costAnalysis'"
              :class="[
                'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                activeTab === 'costAnalysis'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              ]"
            >
              Cost Analysis
            </button>
          </nav>
        </div>
      </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto min-h-0">
          <!-- Estimate Tab -->
          <div v-if="activeTab === 'estimate'" class="h-full p-4 md:p-6">
            <JobEstimateTab
              v-if="jobData && companyDefaults"
              :job-id="jobData.id"
              :company-defaults="companyDefaults"
            />
          </div>

          <!-- Quote Tab -->
          <div v-if="activeTab === 'quote'" class="h-full p-4 md:p-6">
            <JobQuoteTab
              v-if="jobData"
              :job-id="jobData.id"
              :job-data="jobData"
              @quote-imported="handleQuoteUpdated"
            />
          </div>

          <!-- Financial Tab -->
          <div v-if="activeTab === 'financial'" class="h-full p-4 md:p-6">
            <JobFinancialTab
              v-if="jobData"
              :job-data="jobData"
              :job-id="jobId"
              :latest-pricings="latestPricings"
              @quote-created="handleQuoteCreated"
              @quote-accepted="handleQuoteAccepted"
              @invoice-created="handleInvoiceCreated"
            />
          </div>

          <!-- Cost Analysis Tab -->
          <div v-if="activeTab === 'costAnalysis'" class="h-full p-4 md:p-6">
            <JobCostAnalysisTab
              v-if="jobData"
              :job-id="jobData.id"
            />
          </div>

        </div>

        <!-- Footer com Ações Principais - Mobile First -->
        <div class="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-4 py-3 md:px-6 md:py-4">
          <!-- Mobile Layout (stacked) -->
          <div class="md:hidden space-y-3">
            <!-- Primary Actions Row -->
            <div class="flex space-x-3">
              <DraggableButton
                variant="primary"
                @click="printJobSheet"
                class="bg-blue-600 hover:bg-blue-700 flex-1"
                size="sm"
              >
                <Printer class="w-4 h-4 mr-2" />
                Print
              </DraggableButton>

              <DraggableButton
                variant="destructive"
                @click="confirmDeleteJob"
                class="bg-red-600 hover:bg-red-700 flex-1"
                size="sm"
              >
                <Trash2 class="w-4 h-4 mr-2" />
                Delete
              </DraggableButton>
            </div>

            <!-- Close Button -->
            <DraggableButton
              variant="secondary"
              @click="navigateBack"
              class="bg-gray-600 hover:bg-gray-700 w-full"
              size="sm"
            >
              <X class="w-4 h-4 mr-2" />
              Close
            </DraggableButton>
          </div>

          <!-- Desktop/Tablet Layout (horizontal) -->
          <div class="hidden md:flex items-center justify-between">
            <div class="flex space-x-3">
              <DraggableButton
                variant="primary"
                @click="printJobSheet"
                class="bg-blue-600 hover:bg-blue-700"
              >
                <Printer class="w-4 h-4 mr-2" />
                Print Job Sheet
              </DraggableButton>

              <DraggableButton
                variant="destructive"
                @click="confirmDeleteJob"
                class="bg-red-600 hover:bg-red-700"
              >
                <Trash2 class="w-4 h-4 mr-2" />
                Delete Job
              </DraggableButton>
            </div>

            <DraggableButton
              variant="secondary"
              @click="navigateBack"
              class="bg-gray-600 hover:bg-gray-700"
            >
              <X class="w-4 h-4 mr-2" />
              Close
            </DraggableButton>
          </div>
        </div>
      </div>

      <!-- Modais -->
      <JobSettingsModal
        :job-data="jobData"
        :is-open="showSettingsModal"
        @close="showSettingsModal = false"
      />
      <JobWorkflowModal
        :job-data="jobData"
        :is-open="showWorkflowModal"
        @close="showWorkflowModal = false"
      />

      <JobHistoryModal
        :job-id="jobId"
        :events="jobEvents"
        :is-open="showHistoryModal"
        @close="showHistoryModal = false"
        @event-added="handleEventAdded"
      />

      <JobAttachmentsModal
        :job-id="jobId"
        :job-number="jobData?.job_number"
        :is-open="showAttachmentsModal"
        @close="showAttachmentsModal = false"
        @file-uploaded="handleFileUploaded"
        @file-deleted="handleFileDeleted"
      />

      <JobPdfDialog
        :job-id="jobId"
        :job-number="jobData?.job_number"
        :open="showPdfDialog"
        @update:open="val => showPdfDialog = val"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Printer,
  Trash2,
  X,
  Settings,
  Wrench,
  BookOpen,
  Paperclip
  // PlusCircle não é mais necessário aqui diretamente se JobAddEntryDropdown o encapsula
} from 'lucide-vue-next'

import AppLayout from '@/components/AppLayout.vue'
import JobEstimateTab from '@/components/job/JobEstimateTab.vue'
import JobQuoteTab from '@/components/job/JobQuoteTab.vue'
import JobFinancialTab from '@/components/job/JobFinancialTab.vue'
import JobCostAnalysisTab from '@/components/job/JobCostAnalysisTab.vue'
import JobSettingsModal from '@/components/job/JobSettingsModal.vue'
import JobWorkflowModal from '@/components/job/JobWorkflowModal.vue'
import JobHistoryModal from '@/components/job/JobHistoryModal.vue'
import JobAttachmentsModal from '@/components/job/JobAttachmentsModal.vue'
import DraggableButton from '@/components/job/DraggableButton.vue'

import {
  jobRestService,
  type JobData,
  type JobDetailResponse,
  type JobEvent,
  type CompanyDefaults
} from '@/services/job-rest.service'
import { useJobsStore } from '@/stores/jobs'
import { useJobReactivity } from '@/composables/useJobReactivity'
import { useJobNotifications } from '@/composables/useJobNotifications'
import { useJobAutoSync } from '@/composables/useJobAutoSync'
import JobPdfDialog from '@/components/job/JobPdfDialog.vue'

const route = useRoute()
const router = useRouter()
const jobsStore = useJobsStore()

// Reactive data seguindo princípios de composição do Vue 3
const jobId = computed(() => route.params.id as string)

const {
  updateJobReactively,
  addEventReactively,
  updatePricingsReactively,
  reloadJobDataReactively
} = useJobReactivity()
const {
  notifyJobUpdated,
  notifyJobError,
  notifyEventAdded,
  notifyPricingUpdated,
  notifyFileUploaded,
  notifyFileDeleted
} = useJobNotifications()

// Service layer delegation para carregar dados
const loadJobData = async () => {
  if (!jobId.value) {
    console.error('No job ID provided')
    router.push({ name: 'kanban' })
    return
  }

  try {
    // Configurar contexto no store
    jobsStore.setCurrentContext('detail')
    jobsStore.setCurrentJobId(jobId.value)
    jobsStore.setLoadingJob(true)

    // Buscar dados da API e salvar no store
    const response: JobDetailResponse = await jobRestService.getJobForEdit(jobId.value)

    if (response.success && response.data) {
      // Enriquecer o job com dados complementares antes de salvar no store
      const enrichedJob = {
        ...response.data.job,
        latest_pricings: response.data.latest_pricings || {},
        events: response.data.events || [],
        // company_defaults: response.data.company_defaults || null // Removido daqui
      };
      jobsStore.setDetailedJob(enrichedJob);

      // Salvar companyDefaults separadamente se vier na resposta
      if (response.data.company_defaults) {
        companyDefaults.value = response.data.company_defaults;
        // Opcionalmente, salvar no store se for usado globalmente
        // jobsStore.setCompanyDefaults(response.data.company_defaults);
      } else {
        // Tentar buscar do store se não vier na resposta do job específico
        // ou carregar de um endpoint dedicado se necessário
        // companyDefaults.value = jobsStore.companyDefaults;
        console.warn('Company defaults not found in job response, ensure they are loaded elsewhere if needed by NewTaskModal.');
      }

      // jobEvents e latestPricings são computed e não precisam ser atribuídos manualmente
      // eles são automaticamente atualizados quando jobData muda

      // Não fazer isso - são computed readonly:
      // jobEvents.value = response.data.events || [];
      // latestPricings.value = response.data.latest_pricings || [];
      // jobData.value = jobsStore.detailedJob;

    } else {
      throw new Error('Failed to load job data')
    }
  } catch (error) {
    console.error('Error loading job:', error)

    // Usar o sistema de notificações para erros
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    notifyJobError(jobId.value, errorMessage)

    // Fallback para alert se necessário
    alert('Failed to load job data')
    navigateBack()
  } finally {
    jobsStore.setLoadingJob(false)
  }
}

// Auto-sync para manter dados sempre atualizados (opcional - pode ser desabilitado)
const {
  isAutoSyncEnabled,
  toggleAutoSync,
  manualSync
} = useJobAutoSync(
  jobId.value || '',
  loadJobData,
  {
    interval: 60000, // 1 minuto
    enabled: false, // Desabilitado por padrão - pode ser ativado se necessário
    onError: (error) => {
      console.warn('Auto-sync error:', error.message)
      // Não mostrar notificação para erros de auto-sync para não incomodar o usuário
    }
  }
)

// jobData é um computed que sempre vem do store - única fonte de verdade
const jobData = computed(() => {
  const result = jobId.value ? jobsStore.getJobById(jobId.value) : null
  console.log('🔍 JobView computed - jobId:', jobId.value)
  console.log('🔍 JobView computed - result job_status:', result?.job_status || 'NULL')
  return result
})

// Dados complementares - também reativos baseados no job atual
const latestPricings = computed(() => {
  return jobData.value?.latest_pricings || {}
})

const jobEvents = computed(() => {
  return jobData.value?.events || []
})

const companyDefaults = ref<CompanyDefaults | null>(null);

// Loading vem do store para ser reativo
const isLoading = computed(() => jobsStore.isLoadingJob)

// Watchers reativos para otimização
watch(jobData, (newJobData) => {
  if (newJobData) {
    console.log('👀 JobView - Job data changed reactively:', {
      id: newJobData.id,
      job_status: newJobData.job_status,
      name: newJobData.name
    })
  }
}, { deep: true })

watch(jobEvents, (newEvents) => {
  console.log('📝 JobView - Events changed reactively:', newEvents.length, 'events')
}, { deep: true })

watch(latestPricings, (newPricings) => {
  console.log('💰 JobView - Pricings changed reactively')
}, { deep: true })

// Modal states
const showSettingsModal = ref(false)
const showWorkflowModal = ref(false)
const showHistoryModal = ref(false)
const showAttachmentsModal = ref(false)
const showPdfDialog = ref(false)

// Tab state
const activeTab = ref<'estimate' | 'financial' | 'quote' | 'costAnalysis'>('estimate')

// Early return pattern para navegação
const navigateBack = () => {
  router.push({ name: 'kanban' })
}

const handleDataChanged = (data: any) => {
  // Auto-save dos dados do pricing e atualização reativa no store
  if (jobId.value && data) {
    // Usar o composable para manter consistência
    updatePricingsReactively(jobId.value, data)
    // Notificação discreta para pricing auto-save
    notifyPricingUpdated()
  }
}

const handleEventAdded = (event: JobEvent) => {
  // Usar o composable para manter consistência
  if (jobId.value) {
    addEventReactively(jobId.value, event)
    notifyEventAdded(event.event_type)
  }
}

const handleFileUploaded = (file: any) => {
  // Atualizar files no store para manter reatividade
  if (jobId.value && file) {
    // TODO: Implementar atualização de arquivos no store quando tivermos o campo
    console.log('📎 File uploaded - store will be updated:', file)
    notifyFileUploaded(file.name || 'arquivo')
    // Recarregar dados para pegar mudanças de arquivos
    loadJobData()
  }
}

const handleFileDeleted = (fileId: string) => {
  // Remover file do store para manter reatividade
  if (jobId.value && fileId) {
    // TODO: Implementar remoção de arquivos no store quando tivermos o campo
    console.log('🗑️ File deleted - store will be updated:', fileId)
    notifyFileDeleted('arquivo')
    // Recarregar dados para pegar mudanças de arquivos
    loadJobData()
  }
}

// Handler unificado para updates - não mais necessário devido à reatividade automática do store
// Os modais atualizam diretamente o store, JobView é automaticamente reativo
// const handleJobUpdated = (updatedJob: JobData) => {
//   console.log('✅ Job updated - automatic reactivity via store')
// }

// Handlers para aba financeira - usando composable para reatividade otimizada
const handleQuoteCreated = async () => {
  if (jobId.value) {
    // Usar o composable para recarregar dados de forma reativa
    await reloadJobDataReactively(jobId.value)
    // Switch to financial tab to show the new quote
    activeTab.value = 'financial'
  }
}

const handleQuoteAccepted = async () => {
  if (jobId.value) {
    // Usar o composable para recarregar dados de forma reativa
    await reloadJobDataReactively(jobId.value)
  }
}

const handleInvoiceCreated = async () => {
  if (jobId.value) {
    // Usar o composable para recarregar dados de forma reativa
    await reloadJobDataReactively(jobId.value)
  }
}

// Handler para atualização de quote (importação/refresh)
const handleQuoteUpdated = async (result: any) => {
  if (jobId.value) {
    console.log('✅ Quote updated successfully:', result)
    // Recarregar dados para refletir a nova quote
    await reloadJobDataReactively(jobId.value)
    // Notificar sucesso
    // TODO: Adicionar notificação toast quando implementarmos
  }
}

// Ações dos botões do rodapé
const printJobSheet = async () => {
  showPdfDialog.value = true
}

const confirmDeleteJob = () => {
  if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
    deleteJob()
  }
}

const deleteJob = async () => {
  try {
    const result = await jobRestService.deleteJob(jobId.value)
    if (result.success) {
      // TODO: Toast notification
      alert('Job deleted successfully')
      navigateBack()
    }
  } catch (error) {
    console.error('Error deleting job:', error)
    alert(error instanceof Error ? error.message : 'Failed to delete job')
  }
}

// Lifecycle hook
onMounted(() => {
  loadJobData()
})
</script>

<style scoped>
/* Garantir altura máxima de 100vh */
.h-screen {
  height: 100vh;
}

.max-h-screen {
  max-height: 100vh;
}

/* Scroll customizado para Webkit */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
