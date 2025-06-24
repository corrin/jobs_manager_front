<template>
  <AppLayout>
    <div class="flex flex-col h-full min-h-0">
      <div class="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-6 md:px-6 md:py-8">
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
              @click="openSettingsModal"
              class="text-blue-600 hover:bg-blue-50 flex-shrink-0"
              size="sm"
            >
              <Settings class="w-4 h-4" />
            </DraggableButton>
            <DraggableButton
              variant="ghost"
              @click="openWorkflowModal"
              class="text-green-600 hover:bg-green-50 flex-shrink-0"
              size="sm"
            >
              <Wrench class="w-4 h-4" />
            </DraggableButton>
            <DraggableButton
              variant="ghost"
              @click="openHistoryModal"
              class="text-purple-600 hover:bg-purple-50 flex-shrink-0"
              size="sm"
            >
              <BookOpen class="w-4 h-4" />
            </DraggableButton>
            <DraggableButton
              variant="ghost"
              @click="openAttachmentsModal"
              class="text-orange-600 hover:bg-orange-50 flex-shrink-0"
              size="sm"
            >
              <Paperclip class="w-4 h-4" />
            </DraggableButton>
            <DraggableButton
              variant="ghost"
              @click="openQuotingChat"
              class="text-cyan-600 hover:bg-cyan-50 flex-shrink-0"
              size="sm"
              v-if="jobDataWithPaid"
            >
              <span class="sr-only">Open Quoting Chat</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4.286 1.072A1 1 0 012 19.13V19a1 1 0 01.553-.894l2.276-1.138A7.963 7.963 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </DraggableButton>
          </div>
        </div>
        <div class="hidden md:flex items-center justify-between h-12">
          <div class="flex items-center space-x-4 h-full">
            <button
              @click="navigateBack"
              class="p-2 text-gray-400 hover:text-gray-600 transition-colors self-center"
              style="align-self: center"
            >
              <ArrowLeft class="w-5 h-5" />
            </button>
            <div class="flex flex-col justify-center h-full">
              <h1 class="text-lg font-bold text-gray-900 leading-tight">
                {{ jobData?.name || 'Loading...' }}
              </h1>
              <p class="text-xs text-gray-500">
                Job #{{ jobData?.job_number }} • {{ jobData?.client_name }}
              </p>
            </div>
          </div>
          <div class="flex items-center space-x-4 h-full">
            <div class="flex space-x-2 h-full items-center">
              <DraggableButton
                variant="ghost"
                @click="openSettingsModal"
                class="text-blue-600 hover:bg-blue-50"
                size="sm"
              >
                <Settings class="w-4 h-4" />
              </DraggableButton>
              <DraggableButton
                variant="ghost"
                @click="openWorkflowModal"
                class="text-green-600 hover:bg-green-50"
                size="sm"
              >
                <Wrench class="w-4 h-4" />
              </DraggableButton>
              <DraggableButton
                variant="ghost"
                @click="openHistoryModal"
                class="text-purple-600 hover:bg-purple-50"
                size="sm"
              >
                <BookOpen class="w-4 h-4" />
              </DraggableButton>
              <DraggableButton
                variant="ghost"
                @click="openAttachmentsModal"
                class="text-orange-600 hover:bg-orange-50"
                size="sm"
              >
                <Paperclip class="w-4 h-4" />
              </DraggableButton>
              <DraggableButton
                variant="ghost"
                @click="openQuotingChat"
                class="text-cyan-600 hover:bg-cyan-50"
                size="sm"
                v-if="jobDataWithPaid"
              >
                <span class="sr-only">Open Quoting Chat</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8l-4.286 1.072A1 1 0 012 19.13V19a1 1 0 01.553-.894l2.276-1.138A7.963 7.963 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </DraggableButton>
            </div>
          </div>
        </div>
      </div>
      <div v-if="loadingJob" class="flex flex-1 items-center justify-center min-h-[200px]">
        <span class="text-gray-500 text-lg font-medium">Loading...</span>
      </div>
      <div v-else-if="jobError" class="flex flex-1 items-center justify-center min-h-[200px]">
        <span class="text-red-500 text-lg font-medium">Failed to load job data.</span>
      </div>
      <template v-else>
        <div>
          <pre class="bg-yellow-50 text-xs text-yellow-800 p-2 rounded mb-2">
            jobDataWithPaid: {{ jobDataWithPaid }}
            companyDefaults: {{ companyDefaults }}
            activeTab: {{ activeTab }}
          </pre>
        </div>
        <JobViewTabs
          v-if="jobDataWithPaid && companyDefaults && activeTab"
          :active-tab="activeTab"
          @change-tab="setTab"
          :job-data="jobDataWithPaid"
          :company-defaults="companyDefaults"
          :latest-pricings="latestPricings"
          @open-settings="openSettingsModal"
          @open-workflow="openWorkflowModal"
          @open-history="openHistoryModal"
          @open-attachments="openAttachmentsModal"
          @open-pdf="openPdfDialog"
          @quote-imported="handleQuoteImported"
          @quote-created="handleQuoteCreated"
          @quote-accepted="handleQuoteAccepted"
          @invoice-created="handleInvoiceCreated"
        />
        <div v-else class="text-red-600 text-sm mt-4">
          Não foi possível renderizar as abas. Verifique se jobData, companyDefaults e activeTab estão definidos.
        </div>
        <div class="flex-shrink-0 bg-gray-50 border-t border-gray-200 px-4 py-3 md:px-6 md:py-4">
          <div class="md:hidden space-y-3">
            <div class="flex space-x-3">
              <DraggableButton
                variant="primary"
                @click="openPdfDialog"
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
          </div>
          <div class="hidden md:block">
            <div class="flex items-center justify-center space-x-3 mb-2">
              <DraggableButton
                variant="primary"
                @click="openPdfDialog"
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
          v-if="showSettingsModal && jobDataWithPaid"
          :job-data="jobDataWithPaid"
          :is-open="showSettingsModal"
          @close="showSettingsModal = false"
          @job-updated="handleJobUpdated"
        />
        <JobWorkflowModal
          v-if="showWorkflowModal && jobDataWithPaid"
          :job-data="jobDataWithPaid"
          :is-open="showWorkflowModal"
          @close="showWorkflowModal = false"
        />
        <JobHistoryModal
          v-if="showHistoryModal && jobDataWithPaid"
          :job-id="jobId"
          :events="jobEvents"
          :is-open="showHistoryModal"
          :loading="loadingJob || jobEventsLoading"
          @close="showHistoryModal = false"
          @event-added="handleEventAdded"
        />
        <JobAttachmentsModal
          v-if="showAttachmentsModal && jobDataWithPaid"
          :job-id="jobId"
          :job-number="jobDataWithPaid.job_number"
          :is-open="showAttachmentsModal"
          @close="showAttachmentsModal = false"
          @file-uploaded="handleFileUploaded"
          @file-deleted="handleFileDeleted"
        />
        <JobPdfDialog
          v-if="showPdfDialog && jobDataWithPaid"
          :job-id="jobId"
          :job-number="jobDataWithPaid.job_number"
          :is-open="showPdfDialog"
          @update:open="showPdfDialog = $event"
        />
      </template>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from '@/components/AppLayout.vue'
import JobViewTabs from '@/components/job/JobViewTabs.vue'
import JobSettingsModal from '@/components/job/JobSettingsModal.vue'
import JobWorkflowModal from '@/components/job/JobWorkflowModal.vue'
import JobHistoryModal from '@/components/job/JobHistoryModal.vue'
import JobAttachmentsModal from '@/components/job/JobAttachmentsModal.vue'
import JobPdfDialog from '@/components/job/JobPdfDialog.vue'
import { useRoute, useRouter } from 'vue-router'
import { useJobData } from '@/composables/useJobData'
import { useJobTabs } from '@/composables/useJobTabs'
import { useJobNotifications } from '@/composables/useJobNotifications'
import { useJobEvents } from '@/composables/useJobEvents'
import { CompanyDefaultsService } from '@/services/company-defaults.service'
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
import DraggableButton from '@/components/job/DraggableButton.vue'

const route = useRoute()
const router = useRouter()
const jobId = computed(() => route.params.id as string)

const { jobData, loading: loadingJob, loadJob, updateJob } = useJobData(jobId)
const { jobEvents, addEvent, loading: jobEventsLoading } = useJobEvents(jobId)
const { activeTab, setTab } = useJobTabs('estimate')
const notifications = useJobNotifications()

const companyDefaultsLoaded = ref(null)

onMounted(async () => {
  await loadJob()
  if (!jobData.value?.companyDefaults) {
    companyDefaultsLoaded.value = await CompanyDefaultsService.getDefaults()
    console.log(
      'JobView - Loaded company defaults from service (fallback)',
      companyDefaultsLoaded.value,
    )
  } else {
    companyDefaultsLoaded.value = jobData.value.companyDefaults
    console.log('JobView - Loaded company defaults from jobData', companyDefaultsLoaded.value)
  }
})

const companyDefaults = computed(() => {
  return jobData.value?.companyDefaults || companyDefaultsLoaded.value || null
})
const latestPricings = computed(() => jobData.value?.latestPricings || {})
const jobDataWithPaid = computed(() => {
  if (!jobData.value) return undefined
  return {
    ...jobData.value,
    paid: Boolean(jobData.value.paid),
  }
})
const jobError = computed(() => !loadingJob.value && !jobData.value)

const showSettingsModal = ref(false)
const showWorkflowModal = ref(false)
const showHistoryModal = ref(false)
const showAttachmentsModal = ref(false)
const showPdfDialog = ref(false)

function openSettingsModal() {
  showSettingsModal.value = true
}
function openWorkflowModal() {
  showWorkflowModal.value = true
}
function openHistoryModal() {
  showHistoryModal.value = true
}
function openAttachmentsModal() {
  showAttachmentsModal.value = true
}
function openPdfDialog() {
  showPdfDialog.value = true
}
function openQuotingChat() {
  if (!jobDataWithPaid.value) return
  router.push({
    name: 'QuotingChatView',
    query: {
      jobId: jobDataWithPaid.value.id,
      jobName: jobDataWithPaid.value.name,
      jobNumber: jobDataWithPaid.value.job_number,
      clientName: jobDataWithPaid.value.client_name,
    },
  })
  console.log('JobView - Navigated to QuotingChatView', jobDataWithPaid.value)
}

function handleJobUpdated(updatedJob) {
  updateJob(updatedJob)
  notifications.notifyJobUpdated(updatedJob?.name || 'Job')
}

async function handleEventAdded(event) {
  if (event?.description) {
    await addEvent(event.description)
    await loadJob()
    notifications.notifyEventAdded(event.event_type || 'Event')
  }
}

function navigateBack() {
  router.push({ name: 'kanban' })
}
function confirmDeleteJob() {
  if (confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
    deleteJob()
  }
}

async function deleteJob() {
  if (!jobId.value) return
  const jobName = jobData.value?.name || `Job #${jobData.value?.job_number}` || 'job'
  try {
    notifications.notifyJobUpdated(`Deleting ${jobName}...`)
    const { jobRestService } = await import('@/services/job-rest.service')
    const result = await jobRestService.deleteJob(jobId.value)
    if (result.success) {
      notifications.notifyJobUpdated(`${jobName} deleted!`)
      navigateBack()
    } else {
      throw new Error(result.error || 'Failed to delete job')
    }
  } catch {
    notifications.notifyJobUpdated(`Error deleting ${jobName}`)
  }
}

function handleQuoteImported() {
  notifications.notifyJobUpdated('Quote imported')
}
function handleQuoteCreated() {
  notifications.notifyJobUpdated('Quote created')
}
function handleQuoteAccepted() {
  notifications.notifyJobUpdated('Quote accepted')
}
function handleInvoiceCreated() {
  notifications.notifyJobUpdated('Invoice created')
}
function handleFileUploaded() {
  notifications.notifyJobUpdated('File uploaded')
}
function handleFileDeleted() {
  notifications.notifyJobUpdated('File deleted')
}

console.log('JobView - jobId:', jobId.value)

watch(jobData, (val) => {
  console.log('JobView - jobData changed:', val)
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
