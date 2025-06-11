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
          <select v-model="localJobData.status"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500">
            <option v-if="isLoadingStatuses" value="">Loading statuses...</option>
            <option v-for="status in statusChoices" :key="status.key" :value="status.key">
              {{ status.label }}
            </option>
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
import { ref, watch, onMounted } from 'vue'
import type { JobData } from '@/services/jobRestService'
import { JobService } from '@/services/job.service'
import { jobRestService } from '@/services/jobRestService'
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

// Events
const emit = defineEmits<{
  close: []
  'workflow-updated': [data: Partial<JobData>]
}>()

// Services
const jobService = JobService.getInstance()

// Reactive state
const localJobData = ref<Partial<JobData>>({})
const statusChoices = ref<StatusChoice[]>([])
const isLoadingStatuses = ref(false)
const isLoading = ref(false)

// Watch for props changes
watch(() => props.jobData, (newJobData) => {
  if (newJobData) {
    localJobData.value = { ...newJobData }
    // Set checkbox values based on job data
    localJobData.value.quoted = !!newJobData.quoted
    localJobData.value.invoiced = !!newJobData.invoiced
  }
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
    if (response.success && response.statuses) {
      // Convert statuses object to array, same as KanbanView
      statusChoices.value = Object.entries(response.statuses).map(([key, label]) => ({
        key,
        label: label as string
      }))
    }
  } catch (error) {
    console.error('Failed to load status choices:', error)
    toast.error('Falha ao carregar opções de status', {
      description: 'Não foi possível carregar as opções de status. Tente novamente.'
    })
  } finally {
    isLoadingStatuses.value = false
  }
}

const closeModal = () => {
  emit('close')
}

const saveWorkflow = async () => {
  if (!props.jobData || !localJobData.value) {
    toast.error('Erro', {
      description: 'Dados do job não encontrados'
    })
    return
  }

  isLoading.value = true

  try {
    // Prepare data for update - only include workflow fields
    const updateData = {
      status: localJobData.value.status,
      delivery_date: localJobData.value.delivery_date,
      paid: localJobData.value.paid
      // Note: quoted and invoiced are read-only from backend
    }

    // Call the job update API
    const result = await jobRestService.updateJob(props.jobData.id, updateData)

    if (result.success && result.data) {
      toast.success('Workflow atualizado com sucesso!', {
        description: `Status e configurações do ${result.data.name} foram salvos`
      })

      // Emit with updated data
      emit('workflow-updated', result.data)
      closeModal()
    } else {
      throw new Error('Failed to update workflow - invalid response')
    }
  } catch (error) {
    console.error('Error saving workflow:', error)

    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    toast.error('Falha ao salvar workflow', {
      description: `Erro: ${errorMessage}. Tente novamente.`
    })
  } finally {
    isLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}
</script>
