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
            <div class="flex items-center gap-2 mb-1">
              <div class="group">
                <InlineEditText
                  v-if="jobDataWithPaid"
                  :value="localJobName"
                  @update:value="handleNameUpdate"
                  placeholder="Job name"
                  class="text-lg font-bold text-gray-900"
                  display-class="text-lg font-bold text-gray-900"
                />
              </div>
              <span
                v-if="shouldShowQuoteWarning"
                class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                :title="`Quote accepted on ${formatDate(jobDataWithPaid?.quote_acceptance_date || '')} - Create a revision to edit`"
              >
                Quote Accepted
              </span>
            </div>
            <div class="flex items-center gap-2 text-sm text-gray-500">
              <span>Job #{{ jobData?.job_number }}</span>
              <span>•</span>
              <div class="group">
                <InlineEditClient
                  v-if="jobDataWithPaid"
                  :client-name="localClientName"
                  :client-id="localClientId"
                  @update:client="handleClientUpdate"
                  placeholder="Select client"
                />
              </div>
            </div>
            <div class="flex items-center gap-2 text-xs text-gray-400 mt-1">
              <div class="group">
                <InlineEditSelect
                  v-if="jobDataWithPaid"
                  :value="localJobStatus"
                  :options="JOB_STATUS_CHOICES"
                  @update:value="handleStatusUpdate"
                  placeholder="Status"
                />
              </div>
              <span>•</span>
              <div class="group">
                <InlineEditSelect
                  v-if="jobDataWithPaid"
                  :value="localPricingMethodology"
                  :options="pricingMethodologyOptions"
                  @update:value="handlePricingMethodologyUpdate"
                />
              </div>
            </div>
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
              <div class="flex items-center gap-2">
                <div class="group">
                  <InlineEditText
                    v-if="jobDataWithPaid"
                    :value="localJobName"
                    @update:value="handleNameUpdate"
                    placeholder="Job name"
                    class="text-lg font-bold text-gray-900"
                    display-class="text-lg font-bold text-gray-900"
                  />
                </div>
                <span
                  v-if="shouldShowQuoteWarning"
                  class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200"
                  :title="`Quote accepted on ${formatDate(jobDataWithPaid?.quote_acceptance_date || '')} - Create a revision to edit`"
                >
                  Quote Accepted
                </span>
              </div>
              <div class="flex items-center gap-2 text-xs text-gray-500">
                <span>Job #{{ jobData?.job_number }}</span>
                <span>•</span>
                <div class="group">
                  <InlineEditClient
                    v-if="jobDataWithPaid"
                    :client-name="localClientName"
                    :client-id="localClientId"
                    @update:client="handleClientUpdate"
                    placeholder="Select client"
                  />
                </div>
                <span>•</span>
                <div class="group">
                  <InlineEditSelect
                    v-if="jobDataWithPaid"
                    :value="localJobStatus"
                    :options="JOB_STATUS_CHOICES"
                    @update:value="handleStatusUpdate"
                    placeholder="Select Status"
                  />
                </div>
                <span>•</span>
                <div class="group">
                  <InlineEditSelect
                    v-if="jobDataWithPaid"
                    :value="localPricingMethodology"
                    :options="pricingMethodologyOptions"
                    @update:value="handlePricingMethodologyUpdate"
                    placeholder="Select methodology"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="loadingJob || jobError"
        class="flex flex-1 items-center justify-center min-h-[200px]"
      >
        <span class="text-gray-500 text-lg font-medium">Loading...</span>
      </div>
      <template v-else>
        <!-- Debug: Check what's failing - keep for now in case we need to debug further -->
        <!-- <div v-if="!jobDataWithPaid" class="p-4 text-red-600">DEBUG: jobDataWithPaid is falsy</div>
        <div v-if="!companyDefaults" class="p-4 text-red-600">DEBUG: companyDefaults is falsy</div>
        <div v-if="!activeTab" class="p-4 text-red-600">DEBUG: activeTab is falsy</div> -->
        <JobViewTabs
          v-if="jobDataWithPaid && companyDefaults && activeTab"
          :active-tab="activeTab"
          @change-tab="setTab"
          :job-data="jobDataWithPaid"
          :company-defaults="companyDefaults"
          :latest-pricings="latestPricings"
          @open-history="openHistoryModal"
          @open-attachments="openAttachmentsModal"
          @open-pdf="openPdfDialog"
          @job-updated="handleJobUpdated"
          @event-added="handleEventAdded"
          @file-uploaded="handleFileUploaded"
          @file-deleted="handleFileDeleted"
          @quote-imported="handleQuoteImported"
          @quote-created="handleQuoteCreated"
          @quote-accepted="handleQuoteAccepted"
          @invoice-created="handleInvoiceCreated"
          @quote-deleted="handleQuoteDeleted"
          @invoice-deleted="handleInvoiceDeleted"
          @reload-job="handleReloadJob"
        />
      </template>
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
        :open="showPdfDialog"
        @update:open="showPdfDialog = $event"
      />
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { debugLog } from '../utils/debug'

import { ref, computed, onMounted, watch } from 'vue'
import AppLayout from '../components/AppLayout.vue'
import JobViewTabs from '../components/job/JobViewTabs.vue'
import JobHistoryModal from '../components/job/JobHistoryModal.vue'
import JobAttachmentsModal from '../components/job/JobAttachmentsModal.vue'
import JobPdfDialog from '../components/job/JobPdfDialog.vue'
import InlineEditText from '../components/shared/InlineEditText.vue'
import InlineEditClient from '../components/shared/InlineEditClient.vue'
import InlineEditSelect from '../components/shared/InlineEditSelect.vue'
import { useRoute, useRouter } from 'vue-router'
import { useJobsStore } from '../stores/jobs'
import { useJobTabs } from '../composables/useJobTabs'
import { useJobNotifications } from '../composables/useJobNotifications'
import { useJobEvents } from '../composables/useJobEvents'
import { useJobHeaderAutosave } from '../composables/useJobHeaderAutosave'
import { useCompanyDefaultsStore } from '../stores/companyDefaults'
import { api } from '../api/client'
import { ArrowLeft } from 'lucide-vue-next'
import { JOB_STATUS_CHOICES } from '../constants/job-status'

const route = useRoute()
const router = useRouter()
const jobsStore = useJobsStore()
const jobId = computed(() => route.params.id as string)
const jobData = computed(() => {
  const jobDetail = jobsStore.getJobById(jobId.value)
  return jobDetail?.job
})
const loadingJob = computed(() => jobsStore.isLoadingJob)

onMounted(async () => {
  jobsStore.setCurrentJobId(jobId.value)
  await jobsStore.fetchJob(jobId.value)
  await companyDefaultsStore.loadCompanyDefaults()
})

const { jobEvents, addEvent, loading: jobEventsLoading } = useJobEvents(jobId)
const { activeTab, setTab } = useJobTabs('actual')
const notifications = useJobNotifications()

// Local reactive data for header fields
const localJobName = ref('')
const localClientName = ref('')
const localClientId = ref('')
const localJobStatus = ref('')
const localPricingMethodology = ref('')

// Pricing methodology options
const pricingMethodologyOptions = [
  { key: 'time_materials', label: 'Time & Materials' },
  { key: 'fixed_price', label: 'Fixed Price' },
]

// Header autosave integration - will be initialized when job data is available
let headerAutosave: ReturnType<typeof useJobHeaderAutosave> | null = null

// Handler functions
const handleNameUpdate = (newName: string) => {
  localJobName.value = newName
  if (headerAutosave) {
    headerAutosave.handleNameUpdate(newName)
  } else {
    debugLog('JobView - headerAutosave not initialized yet for name update')
  }
}

const handleClientUpdate = (client: { id: string; name: string }) => {
  localClientName.value = client.name
  localClientId.value = client.id
  if (headerAutosave) {
    headerAutosave.handleClientUpdate(client)
  } else {
    debugLog('JobView - headerAutosave not initialized yet for client update')
  }
}

const handleStatusUpdate = (newStatus: string) => {
  debugLog('JobView - Status update:', newStatus, 'headerAutosave exists:', !!headerAutosave)
  localJobStatus.value = newStatus
  if (headerAutosave) {
    headerAutosave.handleStatusUpdate(newStatus)
  } else {
    debugLog('JobView - headerAutosave not initialized yet for status update')
  }
}

const handlePricingMethodologyUpdate = (newMethod: string) => {
  debugLog(
    'JobView - Pricing methodology update:',
    newMethod,
    'headerAutosave exists:',
    !!headerAutosave,
  )
  localPricingMethodology.value = newMethod
  if (headerAutosave) {
    headerAutosave.handlePricingMethodologyUpdate(newMethod)
  } else {
    debugLog('JobView - headerAutosave not initialized yet for pricing methodology update')
  }
}

const companyDefaultsStore = useCompanyDefaultsStore()
const companyDefaults = computed(() => companyDefaultsStore.companyDefaults)

const latestPricings = computed(() => jobData.value?.latestPricings || {})
const jobDataWithPaid = computed(() => {
  if (!jobData.value) return undefined

  // Ensure we have a proper Job object structure
  const job = jobData.value
  if (!job.id) {
    debugLog('🚨 JobView - jobDataWithPaid: Invalid job data structure:', job)
    return undefined
  }

  return {
    ...job,
    paid: Boolean(job.paid),
  }
})

// Initialize header autosave and local values when job data changes
watch(
  jobDataWithPaid,
  (newJobData) => {
    if (newJobData) {
      // Initialize headerAutosave only once
      if (!headerAutosave) {
        headerAutosave = useJobHeaderAutosave(newJobData)
        debugLog('JobView - headerAutosave initialized')
      }

      // Update local values
      localJobName.value = newJobData.name || ''
      localClientName.value = newJobData.client_name || ''
      localClientId.value = newJobData.client_id || ''
      localJobStatus.value = newJobData.job_status || ''
      localPricingMethodology.value = newJobData.pricing_methodology || ''
    }
  },
  { immediate: true },
)
const jobError = computed(() => !loadingJob.value && !jobData.value)

// Quote status computed properties
const isQuoteAccepted = computed(() => {
  return !!jobDataWithPaid.value?.quote_acceptance_date
})

// Check if there are any quote revisions available
const hasQuoteRevisions = computed(() => {
  if (!quoteRevisionsData.value) return false
  return quoteRevisionsData.value.total_revisions > 0
})

// Show warning only if quote is accepted AND there are no revisions
const shouldShowQuoteWarning = computed(() => {
  return isQuoteAccepted.value && !hasQuoteRevisions.value
})

// Format date function
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const showHistoryModal = ref(false)
const showAttachmentsModal = ref(false)
const showPdfDialog = ref(false)

// Store quote revisions data to check if edits should be blocked
const quoteRevisionsData = ref<{ total_revisions: number } | null>(null)

// Fetch quote revisions to determine if edits should be blocked
async function fetchQuoteRevisions() {
  if (!jobId.value) return
  try {
    const response = await api.job_rest_jobs_cost_sets_quote_revise_retrieve({
      params: { job_id: jobId.value },
    })
    quoteRevisionsData.value = response
  } catch {
    // Silently fail - if we can't fetch revisions, assume no revisions exist
    quoteRevisionsData.value = { total_revisions: 0 }
  }
}

// Watch for quote acceptance to fetch revisions data
watch(
  () => jobDataWithPaid.value?.quote_acceptance_date,
  (acceptanceDate) => {
    if (acceptanceDate) {
      fetchQuoteRevisions()
    }
  },
  { immediate: true },
)

function openHistoryModal() {
  showHistoryModal.value = true
}
function openAttachmentsModal() {
  showAttachmentsModal.value = true
}
function openPdfDialog() {
  showPdfDialog.value = true
}

function handleJobUpdated(updatedJob) {
  // Extract JobDetail from the API response wrapper if needed
  if (updatedJob?.data) {
    // This is a JobDetailResponse wrapper, extract the data
    jobsStore.setDetailedJob(updatedJob.data)
    notifications.notifyJobUpdated(updatedJob.data?.job?.name || 'Job')
  } else if (updatedJob?.job) {
    // This is already a JobDetail structure
    jobsStore.setDetailedJob(updatedJob)
    notifications.notifyJobUpdated(updatedJob.job?.name || 'Job')
  } else {
    // This might be a direct job object
    jobsStore.setDetailedJob(updatedJob)
    notifications.notifyJobUpdated(updatedJob?.name || 'Job')
  }
}

async function handleEventAdded(event) {
  if (event?.description) {
    await addEvent(event.description)
    await jobsStore.fetchJob(jobId.value)
    notifications.notifyEventAdded(event.event_type || 'Event')
  }
}

function navigateBack() {
  router.push({ name: 'kanban' })
}

function handleQuoteImported() {
  notifications.notifyJobUpdated('Quote imported')
  // Reload job data to show the imported quote
  jobsStore.fetchJob(jobId.value)
}
function handleQuoteCreated() {
  notifications.notifyJobUpdated('Quote created')
  // Reload job data to show the newly created quote
  jobsStore.fetchJob(jobId.value)
}
function handleQuoteAccepted() {
  notifications.notifyJobUpdated('Quote accepted')
  // Reload job data to reflect quote acceptance
  jobsStore.fetchJob(jobId.value)
}
function handleInvoiceCreated() {
  notifications.notifyJobUpdated('Invoice created')
  // Reload job data to show the newly created invoice
  jobsStore.fetchJob(jobId.value)
}
function handleQuoteDeleted() {
  notifications.notifyJobUpdated('Quote deleted')
  // Reload job data to reflect quote deletion
  jobsStore.fetchJob(jobId.value)
}
function handleInvoiceDeleted() {
  notifications.notifyJobUpdated('Invoice deleted')
  // Reload job data to reflect invoice deletion
  jobsStore.fetchJob(jobId.value)
}
function handleFileUploaded() {
  notifications.notifyJobUpdated('File uploaded')
  // Reload job data to update file list
  jobsStore.fetchJob(jobId.value)
}
function handleFileDeleted() {
  notifications.notifyJobUpdated('File deleted')
  // Reload job data to update file list
  jobsStore.fetchJob(jobId.value)
}

function handleReloadJob() {
  // Simple job reload when cost lines are changed
  jobsStore.fetchJob(jobId.value)
}

debugLog('JobView - jobId:', jobId.value)

watch(jobData, (val) => {
  debugLog('JobView - jobData changed:', val)
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
