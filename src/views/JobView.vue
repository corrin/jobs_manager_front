<template>
  <AppLayout>
    <div class="flex flex-col h-full">
      <!-- Header com informações básicas do job -->
      <div class="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4">
        <div class="flex items-center justify-between">
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

            <!-- Status Badge -->
            <div v-if="jobData" class="flex items-center space-x-2">
              <Badge
                :variant="getStatusVariant(jobData.status)"
                class="text-xs"
              >
                {{ getStatusLabel(jobData.status) }}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <!-- Conteúdo Principal -->
      <div class="flex-1 flex flex-col min-h-0">
        <!-- Grids de Dados -->
        <div class="flex-1 p-6 overflow-y-auto min-h-0">
          <JobPricingGrids
            v-if="jobData"
            :job-data="jobData"
            :latest-pricings="latestPricings"
            :company-defaults="companyDefaults"
            @data-changed="handleDataChanged"
          />
        </div>

        <!-- Rodapé com Ações Principais - Sempre visível -->
        <div class="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-6 py-4 mt-auto">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <DraggableButton
                variant="primary"
                @click="printJobSheet"
                class="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Printer class="w-4 h-4 mr-2" />
                Print Job Sheet
              </DraggableButton>

              <DraggableButton
                variant="destructive"
                @click="confirmDeleteJob"
                class="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                <Trash2 class="w-4 h-4 mr-2" />
                Delete Job
              </DraggableButton>
            </div>

            <DraggableButton
              variant="secondary"
              @click="navigateBack"
              class="bg-gray-600 hover:bg-gray-700 w-full sm:w-auto"
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
        @job-updated="handleJobUpdated"
      />
      <JobWorkflowModal
        :job-data="jobData"
        :is-open="showWorkflowModal"
        @close="showWorkflowModal = false"
        @workflow-updated="handleWorkflowUpdated"
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
        :is-open="showAttachmentsModal"
        @close="showAttachmentsModal = false"
        @file-uploaded="handleFileUploaded"
        @file-deleted="handleFileDeleted"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
} from 'lucide-vue-next'

import AppLayout from '@/components/AppLayout.vue'
import Badge from '@/components/ui/badge/Badge.vue'
import JobPricingGrids from '@/components/job/JobPricingGrids.vue'
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
} from '@/services/jobRestService'

const route = useRoute()
const router = useRouter()

// Reactive data seguindo princípios de composição do Vue 3
const jobId = computed(() => route.params.id as string)
const jobData = ref<JobData | null>(null)
const latestPricings = ref<any>({})
const jobEvents = ref<JobEvent[]>([])
const companyDefaults = ref<CompanyDefaults | null>(null)
const isLoading = ref(true)

// Modal states
const showSettingsModal = ref(false)
const showWorkflowModal = ref(false)
const showHistoryModal = ref(false)
const showAttachmentsModal = ref(false)

// Status mappings seguindo switch-case pattern
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'quoting':
      return 'secondary'
    case 'accepted_quote':
      return 'default'
    case 'in_progress':
      return 'default'
    case 'completed':
      return 'default'
    case 'archived':
      return 'secondary'
    case 'on_hold':
      return 'destructive'
    case 'rejected':
      return 'destructive'
    default:
      return 'secondary'
  }
}

const getStatusLabel = (status: string) => {
  const statusLabels: Record<string, string> = {
    'quoting': 'Quoting',
    'accepted_quote': 'Accepted Quote',
    'awaiting_materials': 'Awaiting Materials',
    'in_progress': 'In Progress',
    'on_hold': 'On Hold',
    'special': 'Special',
    'completed': 'Completed',
    'rejected': 'Rejected',
    'archived': 'Archived'
  }
  return statusLabels[status] || status
}

// Early return pattern para navegação
const navigateBack = () => {
  router.push({ name: 'kanban' })
}

// Service layer delegation para carregar dados
const loadJobData = async () => {
  if (!jobId.value) {
    console.error('No job ID provided')
    navigateBack()
    return
  }

  try {
    isLoading.value = true
    const response: JobDetailResponse = await jobRestService.getJobForEdit(jobId.value)

    if (response.success && response.data) {
      jobData.value = response.data.job
      latestPricings.value = response.data.latest_pricings || {}
      jobEvents.value = response.data.events || []
      companyDefaults.value = response.data.company_defaults || null
    } else {
      throw new Error('Failed to load job data')
    }
  } catch (error) {
    console.error('Error loading job:', error)
    // TODO: Implementar toast notification
    alert('Failed to load job data')
    navigateBack()
  } finally {
    isLoading.value = false
  }
}

// Handlers para eventos dos componentes
const handleJobUpdated = (updatedJobResponse: any) => {
  console.log('JobView - handleJobUpdated called:', updatedJobResponse)
  
  // Guard clause - check if response exists
  if (!updatedJobResponse) {
    console.error('JobView - No data in handleJobUpdated')
    return
  }
  
  // Guard clause - extract job data based on response structure
  let updatedJob: JobData | null = null
  
  if (updatedJobResponse.success && updatedJobResponse.data) {
    // New API structure with success/data
    updatedJob = updatedJobResponse.data
  } else if (updatedJobResponse.id) {
    // Direct job data structure
    updatedJob = updatedJobResponse
  } else {
    console.error('JobView - Invalid job data received:', updatedJobResponse)
    return
  }
  
  // Guard clause - validate job data
  if (!updatedJob || !updatedJob.id) {
    console.error('JobView - Invalid job data extracted:', updatedJob)
    return
  }
  
  // Update the reactive jobData
  jobData.value = { ...jobData.value, ...updatedJob }
  console.log('JobView - Job data updated:', updatedJob.name)
}

const handleDataChanged = (data: any) => {
  // Auto-save dos dados do pricing
  // TODO: Implementar debounce para evitar muitas chamadas
  console.log('Data changed:', data)
}

const handleEventAdded = (event: JobEvent) => {
  jobEvents.value.unshift(event)
}

const handleWorkflowUpdated = (workflowData: Partial<JobData>) => {
  if (jobData.value) {
    // Update job data with workflow changes
    Object.assign(jobData.value, workflowData)
    // TODO: Auto-save changes to backend
    console.log('Workflow updated:', workflowData)
  }
}

const handleFileUploaded = (file: any) => {
  // TODO: Refresh file list or update state
  console.log('File uploaded:', file)
}

const handleFileDeleted = (fileId: string) => {
  // TODO: Remove from local state
  console.log('File deleted:', fileId)
}

// Ações dos botões do rodapé
const printJobSheet = () => {
  // TODO: Implementar impressão via PDF
  console.log('Print job sheet for:', jobId.value)
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
