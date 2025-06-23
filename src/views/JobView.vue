<template>
  <AppLayout>
    <div class="flex flex-col h-full min-h-0 pt-6">
      <div class="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
        <div class="md:hidden">
          <div class="flex items-center justify-between mb-3">
            <button
              @click="navigateBack"
              class="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
          </div>

          <div class="mb-3">
            <h1 class="text-lg font-bold text-gray-900 leading-tight">
              {{ jobData?.name || 'Loading...' }}
            </h1>
            <p class="text-sm text-gray-500 mt-1">
              Job #{{ jobData?.job_number }} • {{ jobData?.client_name }}
            </p>
          </div>

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

      <div class="flex-1 flex flex-col min-h-0">
        <div class="flex-shrink-0 bg-white border-b border-gray-200">
          <div class="md:hidden">
            <div class="flex border-b border-gray-200">
              <button
                @click="activeTab = 'estimate'"
                :class="[
                  'flex-1 py-3 px-2 text-sm font-medium text-center border-b-2 transition-colors',
                  activeTab === 'estimate'
                    ? 'border-blue-500 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
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
                    : 'border-transparent text-gray-500 hover:text-gray-700',
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
                    : 'border-transparent text-gray-500 hover:text-gray-700',
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
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                ]"
              >
                Cost Analysis
              </button>
            </div>
          </div>

          <div class="hidden md:block px-6">
            <nav class="-mb-px flex space-x-8">
              <button
                @click="activeTab = 'estimate'"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'estimate'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
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
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
              >
                Quote
              </button>
              <button
                @click="activeTab = 'financial'"
                :class="[
                  'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                  activeTab === 'financial'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
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
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                ]"
              >
                Cost Analysis
              </button>
            </nav>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0">
          <div v-if="activeTab === 'estimate'" class="h-full p-4 md:p-6">
            <JobEstimateTab
              v-if="jobData && companyDefaults"
              :job-id="jobData.id"
              :company-defaults="companyDefaults"
            />
          </div>

          <div v-if="activeTab === 'quote'" class="h-full p-4 md:p-6">
            <JobQuoteTab
              v-if="jobDataWithPaid"
              :job-id="jobDataWithPaid.id"
              :job-data="jobDataWithPaid ?? null"
              @quote-imported="handleQuoteUpdated"
            />
          </div>

          <div v-if="activeTab === 'financial'" class="h-full p-4 md:p-6">
            <JobFinancialTab
              v-if="jobDataWithPaid"
              :job-data="jobDataWithPaid ?? null"
              :job-id="jobId"
              :latest-pricings="latestPricings"
              @quote-created="handleQuoteCreated"
              @quote-accepted="handleQuoteAccepted"
              @invoice-created="handleInvoiceCreated"
            />
          </div>

          <div v-if="activeTab === 'costAnalysis'" class="h-full p-4 md:p-6">
            <JobCostAnalysisTab v-if="jobData" :job-id="jobData.id" />
          </div>
        </div>

        <div class="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-4 py-3 md:px-6 md:py-4">
          <div class="md:hidden space-y-3">
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

      <JobSettingsModal
        :job-data="jobDataWithPaid ?? null"
        :is-open="showSettingsModal"
        @close="showSettingsModal = false"
      />
      <JobWorkflowModal
        :job-data="jobDataWithPaid ?? null"
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
        @update:open="(val) => (showPdfDialog = val)"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Printer,
  Trash2,
  X,
  Settings,
  Wrench,
  BookOpen,
  Paperclip,
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
import type { QuoteOperationResult } from '@/types'

import {
  jobRestService,
  type JobDetailResponse,
  type JobEvent,
  type CompanyDefaults,
} from '@/services/job-rest.service'
import { useJobsStore } from '@/stores/jobs'
import { useJobReactivity } from '@/composables/useJobReactivity'
import { useJobAutoSync } from '@/composables/useJobAutoSync'
import { toast } from 'vue-sonner'
import { extractErrorMessage, logError } from '@/utils/error-handler'
import JobPdfDialog from '@/components/job/JobPdfDialog.vue'

const route = useRoute()
const router = useRouter()
const jobsStore = useJobsStore()

const jobId = computed(() => route.params.id as string)

const { addEventReactively, reloadJobDataReactively } = useJobReactivity()

const loadJobData = async () => {
  if (!jobId.value) {
    console.error('No job ID provided')
    router.push({ name: 'kanban' })
    return
  }

  const loadingToastId = 'job-loading'

  try {
    console.log('🍞 Showing loading toast for job data')
    toast.loading('Loading job...', {
      description: 'Fetching work details',
      id: loadingToastId,
    })

    console.log('📞 Loading job data for ID:', jobId.value)

    jobsStore.setCurrentContext('detail')
    jobsStore.setCurrentJobId(jobId.value)
    jobsStore.setLoadingJob(true)

    const response: JobDetailResponse = await jobRestService.getJobForEdit(jobId.value)
    console.log('✅ Job data response:', response)

    if (response.success && response.data) {
      const enrichedJob = {
        ...response.data.job,
        latest_pricings: response.data.latest_pricings || {},
        events: response.data.events || [],
      }
      jobsStore.setDetailedJob(enrichedJob)

      if (response.data.company_defaults) {
        companyDefaults.value = response.data.company_defaults
      } else {
        console.warn(
          'Company defaults not found in job response, ensure they are loaded elsewhere if needed by NewTaskModal.',
        )
      }

      console.log('🍞 Dismissing loading toast and logging success')
      toast.dismiss(loadingToastId)
      console.log(
        `✅ Job ${enrichedJob.name || `Job #${enrichedJob.job_number}`} loaded successfully`,
      )
    } else {
      throw new Error('Failed to load job data')
    }
  } catch (error) {
    logError('loadJobData', error, { jobId: jobId.value })

    console.log('🍞 Dismissing loading toast and showing error')
    toast.dismiss(loadingToastId)

    const errorMessage = extractErrorMessage(error)
    console.log('🍞 Showing error toast for job loading:', errorMessage)
    toast.error('Error loading job', {
      description: `Failed to load job ${jobId.value}: ${errorMessage}`,
      duration: 6000,
    })

    navigateBack()
  } finally {
    jobsStore.setLoadingJob(false)
  }
}

useJobAutoSync(jobId.value || '', loadJobData, {
  interval: 60000,
  enabled: false,
  onError: (error) => {
    console.warn('Auto-sync error:', error.message)
  },
})

const jobData = computed(() => {
  const result = jobId.value ? jobsStore.getJobById(jobId.value) : null
  console.log('🔍 JobView computed - jobId:', jobId.value)
  console.log('🔍 JobView computed - result job_status:', result?.job_status || 'NULL')
  return result
})

const jobDataWithPaid = computed(() => {
  if (!jobData.value) return undefined
  return {
    ...jobData.value,
    paid: Boolean(jobData.value.paid),
  }
})

const latestPricings = computed(() => {
  return jobData.value?.latest_pricings || {}
})

const jobEvents = computed(() => {
  return jobData.value?.events || []
})

const companyDefaults = ref<CompanyDefaults | null>(null)

watch(
  jobData,
  (newJobData) => {
    if (newJobData) {
      console.log('👀 JobView - Job data changed reactively:', {
        id: newJobData.id,
        job_status: newJobData.job_status,
        name: newJobData.name,
      })
    }
  },
  { deep: true },
)

watch(
  jobEvents,
  (newEvents) => {
    console.log('📝 JobView - Events changed reactively:', newEvents.length, 'events')
  },
  { deep: true },
)

watch(
  latestPricings,
  () => {
    console.log('💰 JobView - Pricings changed reactively')
  },
  { deep: true },
)

const showSettingsModal = ref(false)
const showWorkflowModal = ref(false)
const showHistoryModal = ref(false)
const showAttachmentsModal = ref(false)
const showPdfDialog = ref(false)

const activeTab = ref<'estimate' | 'financial' | 'quote' | 'costAnalysis'>('estimate')

const navigateBack = () => {
  router.push({ name: 'kanban' })
}

const handleEventAdded = (event: JobEvent) => {
  if (jobId.value) {
    addEventReactively(jobId.value, event)
    toast.success('Event added', {
      description: `Event "${event.event_type}" was added successfully`,
    })
  }
}

interface JobFile {
  size: number | null
  status: 'active' | 'deleted'
  id: string
  filename: string
  mime_type: string | null
  uploaded_at: string
  print_on_jobsheet: boolean
  download_url: string
  thumbnail_url: string | null
}

const handleFileUploaded = (file: JobFile) => {
  if (jobId.value && file) {
    try {
      console.log('File uploaded - store will be updated:', file)
      toast.success('File uploaded', {
        description: `${file.filename || 'file'} was sent successfully`,
      })

      loadJobData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error processing upload'
      toast.error('Error uploading file', {
        description: errorMessage,
      })
    }
  }
}

const handleFileDeleted = (fileId: string) => {
  if (jobId.value && fileId) {
    try {
      console.log('🗑️ File deleted - store will be updated:', fileId)
      toast.success('File removed', {
        description: 'File was successfully removed',
      })

      loadJobData()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error processing removal'
      toast.error('Error removing file', {
        description: errorMessage,
      })
    }
  }
}

const handleQuoteCreated = async () => {
  if (jobId.value) {
    try {
      await reloadJobDataReactively(jobId.value)

      activeTab.value = 'financial'
      toast.success('Quote created!', {
        description: 'New quote has been generated successfully',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error reloading quote data'
      toast.error('Error creating quote', {
        description: errorMessage,
      })
    }
  }
}

const handleQuoteAccepted = async () => {
  if (jobId.value) {
    try {
      await reloadJobDataReactively(jobId.value)
      toast.success('Quote accepted!', {
        description: 'Quote has been accepted and status updated',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error updating quote status'
      toast.error('Error accepting quote', {
        description: errorMessage,
      })
    }
  }
}

const handleInvoiceCreated = async () => {
  if (jobId.value) {
    try {
      await reloadJobDataReactively(jobId.value)
      toast.success('Invoice created!', {
        description: 'Invoice has been generated and is ready for sending',
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error reloading invoice data'
      toast.error('Error creating invoice', {
        description: errorMessage,
      })
    }
  }
}

const handleQuoteUpdated = async (result: QuoteOperationResult) => {
  if (jobId.value) {
    try {
      console.log('Quote updated successfully:', result)

      if ('shouldReloadJob' in result && result.shouldReloadJob) {
        console.log('Reloading job data after quote link operation')
        await reloadJobDataReactively(jobId.value, true)
      } else if ('changes_applied' in result && result.changes_applied) {
        toast.success('Quote changes applied!', {
          description: `${result.changes_applied} changes have been applied`,
        })
      } else if ('sheet_url' in result && result.sheet_url) {
        toast.success('Quote sheet linked!', {
          description: `Quote sheet linked: ${result.sheet_url}`,
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error updating quote'
      toast.error('Error updating quote', {
        description: errorMessage,
      })
    }
  }
}

const printJobSheet = async () => {
  showPdfDialog.value = true
}

const confirmDeleteJob = () => {
  if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
    deleteJob()
  }
}

const deleteJob = async () => {
  const jobName = jobData.value?.name || `Job #${jobData.value?.job_number}` || 'job'

  try {
    toast.loading(`Deleting ${jobName}...`, {
      id: 'delete-job',
    })

    const result = await jobRestService.deleteJob(jobId.value)
    if (result.success) {
      toast.success(`${jobName} deleted!`, {
        description: 'Item has been permanently removed',
        id: 'delete-job',
      })
      navigateBack()
    } else {
      throw new Error(result.error || 'Failed to delete job')
    }
  } catch (error) {
    logError('deleteJob', error, { jobId: jobId.value, jobName })
    const errorMessage = extractErrorMessage(error)
    toast.error(`Error deleting ${jobName}`, {
      description: errorMessage,
      id: 'delete-job',
      duration: 6000,
    })
  }
}

onMounted(() => {
  loadJobData()
})
</script>

<style scoped>
.h-screen {
  height: 100vh;
}

.max-h-screen {
  max-height: 100vh;
}

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
