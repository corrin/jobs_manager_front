<template>
  <Dialog :open="isOpen" @update:open="(open) => !open && closeModal()">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Workflow Settings</DialogTitle>
        <DialogDescription>
          Configure job status, delivery dates, and workflow tracking.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 max-h-[60vh] overflow-y-auto">
        <!-- Job Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Job Status
          </label>
          <select v-model="localJobData.job_status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            <option v-if="isLoadingStatuses" value="">Loading statuses...</option>
            <template v-else>
              <!-- Show current status first if it exists and is not in the status choices -->
              <option
                v-if="localJobData.job_status && !statusChoices.find(s => s.key === localJobData.job_status)"
                :value="localJobData.job_status">
                {{ currentStatusLabel }} (Current)
              </option>
              <option v-for="status in statusChoices" :key="status.key" :value="status.key">
                {{ status.label }}
              </option>
            </template>
          </select>
        </div>

        <!-- Delivery Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Delivery Date
          </label>
          <input v-model="localJobData.delivery_date" type="date"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" />
        </div>

        <!-- Quote Acceptance Date -->
        <div v-if="localJobData.quote_acceptance_date">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Quote Accepted On
          </label>
          <input :value="formatDate(localJobData.quote_acceptance_date)" type="text" readonly
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50" />
        </div>

        <!-- Status Checkboxes -->
        <div class="space-y-3">
          <h4 class="text-sm font-medium text-gray-700">Job Status Tracking</h4>

          <div class="flex items-start">
            <input v-model="localJobData.quoted" type="checkbox" :disabled="true"
              class="mt-1 rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:opacity-50">
            <div class="ml-2">
              <label class="text-sm text-gray-700">
                Already Quoted?
              </label>
              <div class="text-xs text-gray-500">Indicator of whether the job was already quoted in Xero (read-only)
              </div>
            </div>
          </div>

          <div class="flex items-start">
            <input v-model="localJobData.invoiced" type="checkbox" :disabled="true"
              class="mt-1 rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 disabled:opacity-50">
            <div class="ml-2">
              <label class="text-sm text-gray-700">
                Already Invoiced?
              </label>
              <div class="text-xs text-gray-500">Indicator of whether the job was already invoiced in Xero (read-only)
              </div>
            </div>
          </div>

          <div class="flex items-center">
            <input v-model="localJobData.paid" type="checkbox"
              class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
            <label class="ml-2 text-sm text-gray-700">
              Job Paid
            </label>
          </div>
        </div>
      </div>

      <DialogFooter>
        <button @click="closeModal" type="button"
          class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          Cancel
        </button>
        <button @click="saveWorkflow" type="button" :disabled="isLoading"
          class="ml-3 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
          <span v-if="isLoading" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
              viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
              </path>
            </svg>
            Saving...
          </span>
          <span v-else>Save Changes</span>
        </button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import type { JobData, JobUpdateData } from '@/services/job-rest.service'
import { JobService } from '@/services/job.service'
import { jobRestService } from '@/services/job-rest.service'
import { useJobsStore } from '@/stores/jobs'
import { toast } from 'vue-sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

interface StatusChoice {
  key: string
  label: string
}

// Props
interface Props {
  jobData: JobData | null
  isOpen: boolean
}

const props = defineProps<Props>()

// Events - apenas close, a store cuida do resto
const emit = defineEmits<{
  close: []
}>()

// Services e Store
const jobService = JobService.getInstance()
const jobsStore = useJobsStore()

// Reactive state - dados locais apenas para o form
const localJobData = ref<Partial<JobData>>({})
const statusChoices = ref<StatusChoice[]>([])
const isLoadingStatuses = ref(false)
const isLoading = ref(false)

// Computed properties
const currentStatusLabel = computed(() => {
  if (!localJobData.value.job_status) {
    return ''
  }

  const statusChoice = statusChoices.value.find(s => s.key === localJobData.value.job_status)
  return statusChoice ? statusChoice.label : localJobData.value.job_status
})

// Initialize local job data with proper status handling
const initializeLocalJobData = (jobData: JobData) => {
  localJobData.value = {
    ...jobData,
    // Preserve existing status or use job's current status
    job_status: localJobData.value.job_status || jobData.job_status,
    // Set checkbox values based on job data
    quoted: !!jobData.quoted,
    invoiced: !!jobData.invoiced,
    paid: !!jobData.paid
  }
}

// Watch for props changes
watch(() => props.jobData, (newJobData) => {
  if (!newJobData) {
    console.log('🚫 JobWorkflowModal - Received null/undefined jobData, skipping initialization')
    return
  }

  console.log('✅ JobWorkflowModal - Received valid jobData, initializing:', newJobData.id)
  initializeLocalJobData(newJobData)
}, { immediate: true })

// Load status choices on component mount
onMounted(async () => {
  await loadStatusChoices()
})

// Methods
const loadStatusChoices = async () => {
  isLoadingStatuses.value = true

  try {
    const response = await jobService.getStatusChoices()

    if (!response.success || !response.statuses) {
      throw new Error('Invalid response from status choices API')
    }

    // Convert statuses object to array, same as KanbanView
    statusChoices.value = Object.entries(response.statuses).map(([key, label]) => ({
      key,
      label: label as string
    }))

    // Ensure current job status is preserved after loading choices
    preserveCurrentJobStatus()

  } catch (error) {
    console.error('Failed to load status choices:', error)
    toast.error('Failed to load status options', {
      description: 'Could not load status options. Please try again.'
    })
  } finally {
    isLoadingStatuses.value = false
  }
}

// Preserve current job status after loading status choices
const preserveCurrentJobStatus = () => {
  if (!props.jobData?.job_status) {
    return
  }

  // Ensure the current status is selected if not already set
  if (!localJobData.value.job_status) {
    localJobData.value.job_status = props.jobData.job_status
  }
}

const closeModal = () => {
  emit('close')
}

const saveWorkflow = async () => {
  // Guard clauses - early return for invalid states
  if (!props.jobData) {
    toast.error('Error', {
      description: 'Job data not found'
    })
    return
  }

  if (!localJobData.value) {
    toast.error('Error', {
      description: 'Local data not initialised'
    })
    return
  }

  isLoading.value = true

  try {
    const updateData = prepareUpdateData()
    const result = await jobRestService.updateJob(props.jobData.id, updateData)

    if (!result.success) {
      throw new Error('Failed to update workflow - request failed')
    }

    // Se a API retornou dados atualizados, usar eles
    if (result.data) {
      // A API do JobWorkflowModal retorna dados em result.data (pode ser completa ou simples)
      // Passar diretamente para handleSuccessfulUpdate que fará a extração correta
      handleSuccessfulUpdate(result.data)
    } else {
      // Se não retornou dados (apenas success: true), criar dados atualizados manualmente
      console.log('⚠️ JobWorkflowModal - API returned success but no data, using local updates')

      // Guard clause - validar dados antes de criar objeto atualizado
      if (!props.jobData?.id) {
        throw new Error('Invalid job data - missing id')
      }

      const updatedJobData = {
        ...props.jobData,
        ...updateData,
        id: props.jobData.id // Garantir que o ID sempre existe
      }

      // Validar se o objeto criado é válido
      if (!updatedJobData.id) {
        throw new Error('Failed to create valid updated job data')
      }

      handleSuccessfulUpdate(updatedJobData)
    }

  } catch (error) {
    handleUpdateError(error)
  } finally {
    isLoading.value = false
  }
}

// Prepare data for update - only include workflow fields
const prepareUpdateData = (): JobUpdateData => {
  return {
    job_status: localJobData.value.job_status || '',
    delivery_date: localJobData.value.delivery_date,
    paid: localJobData.value.paid
    // Note: quoted and invoiced are read-only from backend
  }
}

// Handle successful workflow update
const handleSuccessfulUpdate = (updatedJobData: any) => {
  // Guard clause - early return for null/undefined data
  if (!updatedJobData) {
    console.error('🚨 JobWorkflowModal - handleSuccessfulUpdate called with null/undefined data')
    throw new Error('Invalid job data received - data is null or undefined')
  }

  // Extract job data using switch-like logic for different response structures
  let jobData: JobData

  // Use early return pattern for different data structures
  if (updatedJobData.data?.job?.id) {
    // Structure: { data: { job: {...}, latest_pricings: {...}, events: [...] } }
    console.log('🔍 JobWorkflowModal - Processing data.job structure')
    jobData = {
      ...updatedJobData.data.job,
      latest_pricings: updatedJobData.data.latest_pricings || updatedJobData.data.job.latest_pricings,
      events: updatedJobData.data.events || updatedJobData.data.job.events,
      company_defaults: updatedJobData.data.company_defaults || updatedJobData.data.job.company_defaults
    }
  } else if (updatedJobData.job?.id) {
    // Structure: { job: {...}, latest_pricings: {...}, events: [...] }
    console.log('🔍 JobWorkflowModal - Processing job structure')
    jobData = {
      ...updatedJobData.job,
      latest_pricings: updatedJobData.latest_pricings || updatedJobData.job.latest_pricings,
      events: updatedJobData.events || updatedJobData.job.events,
      company_defaults: updatedJobData.company_defaults || updatedJobData.job.company_defaults
    }
  } else if (updatedJobData.id) {
    // Structure: direct job data
    console.log('🔍 JobWorkflowModal - Processing direct job structure')
    jobData = updatedJobData
  } else {
    console.error('🚨 JobWorkflowModal - Invalid data structure:', updatedJobData)
    throw new Error('Invalid job data received - missing job ID')
  }

  // Guard clause - validate final job data
  if (!jobData.id || typeof jobData.id !== 'string' || jobData.id.trim() === '') {
    console.error('🚨 JobWorkflowModal - Invalid job ID received:', jobData.id)
    throw new Error('Invalid job ID received')
  }

  console.log('🎯 JobWorkflowModal - Processing valid job data:', jobData.id)
  console.log('🔍 JobWorkflowModal - Updated job_status:', jobData.job_status)

  toast.success('Workflow atualizado com sucesso!', {
    description: `Status e configurações do ${jobData.name} foram salvos`
  })

  // Update store - this will trigger reactivity throughout the application
  console.log('📝 JobWorkflowModal - Calling jobsStore.setDetailedJob')
  jobsStore.setDetailedJob(jobData)

  console.log('✅ JobWorkflowModal - Store updated successfully')
  closeModal()
}

// Handle workflow update errors
const handleUpdateError = (error: unknown) => {
  console.error('Error saving workflow:', error)

  const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
  toast.error('Falha ao salvar workflow', {
    description: `Erro: ${errorMessage}. Tente novamente.`
  })
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
