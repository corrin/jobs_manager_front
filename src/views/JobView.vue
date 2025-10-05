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
              <span class="text-xl font-bold text-gray-900">Job #{{ jobHeader?.job_number }}</span>
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
            <div class="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
              <span>•</span>
              <div class="group">
                <InlineEditClient
                  v-if="jobDataWithPaid"
                  :key="localClientId"
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
              <template v-if="jobDataWithPaid?.quoted">
                <span>•</span>
                <label class="flex items-center gap-1">
                  <input
                    type="checkbox"
                    disabled
                    v-model="localQuoted"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Already Quoted</span>
                </label>
              </template>
              <template v-if="jobDataWithPaid?.fully_invoiced">
                <span>•</span>
                <label class="flex items-center gap-1">
                  <input
                    type="checkbox"
                    disabled
                    v-model="localFullyInvoiced"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Fully Invoiced</span>
                </label>
              </template>
              <span>•</span>
              <label class="flex items-center gap-1">
                <input
                  type="checkbox"
                  disabled
                  :checked="jobDataWithPaid?.paid"
                  class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
                />
                <span>Job Paid</span>
              </label>
              <span>•</span>
              <label class="flex items-center gap-1">
                <input
                  type="checkbox"
                  v-model="localRejected"
                  @change="handleRejectedChange"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Rejected Job</span>
              </label>
              <template v-if="jobDataWithPaid?.quote_acceptance_date">
                <span
                  >• Quote Accepted On:
                  {{ formatDate(jobDataWithPaid.quote_acceptance_date) }}</span
                >
              </template>
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
              <div class="flex items-center">
                <span class="text-xl font-bold text-gray-900"
                  >Job #{{ jobHeader?.job_number }} -</span
                >
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
                <div class="group">
                  <InlineEditClient
                    v-if="jobDataWithPaid"
                    :key="localClientId"
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
                <template v-if="jobDataWithPaid?.quoted">
                  <span>•</span>
                  <label class="flex items-center gap-1">
                    <input
                      type="checkbox"
                      v-model="localQuoted"
                      disabled
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Already Quoted</span>
                  </label>
                </template>
                <template v-if="jobDataWithPaid?.fully_invoiced">
                  <span>•</span>
                  <label class="flex items-center gap-1">
                    <input
                      type="checkbox"
                      disabled
                      v-model="localFullyInvoiced"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Fully Invoiced</span>
                  </label>
                </template>
                <span>•</span>
                <label class="flex items-center gap-1">
                  <input
                    type="checkbox"
                    disabled
                    :checked="jobDataWithPaid?.paid"
                    class="rounded border-gray-300 text-gray-400 cursor-not-allowed"
                  />
                  <span>Job Paid</span>
                </label>
                <span>•</span>
                <label class="flex items-center gap-1">
                  <input
                    type="checkbox"
                    v-model="localRejected"
                    @change="handleRejectedChange"
                    class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Rejected Job</span>
                </label>
                <template v-if="jobDataWithPaid?.quote_acceptance_date">
                  <span
                    >• Quote Accepted On:
                    {{ formatDate(jobDataWithPaid.quote_acceptance_date) }}</span
                  >
                </template>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="inline-flex items-center justify-center h-9 px-3 rounded-md bg-gray-100 text-gray-700 border border-gray-300 text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              @click="printJob"
            >
              <Printer class="w-4 h-4 mr-1" /> Print
            </button>
            <button
              class="inline-flex items-center justify-center h-9 px-3 rounded-md bg-gray-100 text-gray-700 border border-gray-300 text-sm font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              @click="downloadJobSheet"
            >
              <Download class="w-4 h-4 mr-1" /> Download Sheet
            </button>
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
        <JobViewTabs
          v-if="jobHeader && companyDefaults && activeTab"
          :active-tab="activeTab"
          @change-tab="setTab"
          :job-id="jobId"
          :job-number="jobHeader.job_number"
          :job-status="localJobStatus"
          :charge-out-rate="companyDefaults?.charge_out_rate ?? 0"
          :pricing-methodology="jobHeader.pricing_methodology || ''"
          :quoted="jobHeader.quoted"
          :fully-invoiced="jobHeader.fully_invoiced"
          :paid="jobHeader?.paid ?? false"
          :company-defaults="companyDefaults"
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
import { useJobFinancials } from '../composables/useJobFinancials'
import { useCompanyDefaultsStore } from '../stores/companyDefaults'
import { api } from '../api/client'
import { ArrowLeft, Printer, Download } from 'lucide-vue-next'
import { JOB_STATUS_CHOICES } from '../constants/job-status'
import { jobService } from '../services/job.service'
import { toast } from 'vue-sonner'

const route = useRoute()
const router = useRouter()
const jobsStore = useJobsStore()
const jobId = computed(() => route.params.id as string)
const loadingJob = ref(false)

// Use store for header (single source of truth)
const jobHeader = computed(() => jobsStore.headersById[jobId.value] ?? null)

onMounted(async () => {
  loadingJob.value = true
  try {
    const headerResponse = await api.job_rest_jobs_header_retrieve({
      params: { job_id: jobId.value },
    })
    jobsStore.setHeader(headerResponse)
  } catch (error) {
    console.error('Failed to fetch job header:', error)
  } finally {
    loadingJob.value = false
  }

  await companyDefaultsStore.loadCompanyDefaults()
})

const { jobEvents, addEvent, loading: jobEventsLoading } = useJobEvents(jobId)
// Check if this is a newly created job (redirected from creation)
const isNewJob = computed(() => route.query.new === 'true')
const queryTab = computed(() => route.query.tab as string)
const defaultTab = computed(() => {
  if (queryTab.value) return queryTab.value
  if (isNewJob.value) return 'quote'
  return 'actual'
})
const { activeTab, setTab } = useJobTabs(defaultTab.value)
const notifications = useJobNotifications()

const localJobName = ref('')
const localClientName = ref('')
const localClientId = ref('')
const localJobStatus = ref('')
const localPricingMethodology = ref('')
const localQuoted = ref(false)
const localFullyInvoiced = ref(false)
const localRejected = ref(false)

const pricingMethodologyOptions = [
  { key: 'time_materials', label: 'Time & Materials' },
  { key: 'fixed_price', label: 'Fixed Price' },
]

let headerAutosave: ReturnType<typeof useJobHeaderAutosave> | null = null

const handleNameUpdate = (newName: string) => {
  localJobName.value = newName
  headerAutosave?.handleNameUpdate(newName)
}

const handleClientUpdate = (client: { id: string; name: string }) => {
  localClientName.value = client.name
  localClientId.value = client.id
  headerAutosave?.handleClientUpdate(client)
}

const handleStatusUpdate = (newStatus: string) => {
  localJobStatus.value = newStatus
  headerAutosave?.handleStatusUpdate(newStatus)
}

const handlePricingMethodologyUpdate = (newMethod: string) => {
  localPricingMethodology.value = newMethod
  headerAutosave?.handlePricingMethodologyUpdate(newMethod)
}

// Initialize the job financials composable
const { fetchJobFinancials } = useJobFinancials(jobId)

const handleRejectedChange = async () => {
  if (!jobHeader.value) return

  if (!localRejected.value) {
    // UNCHECKING - warn about moving back to draft
    const confirmed = confirm('Warning: This will move the job back to Draft status. Are you sure?')

    if (!confirmed) {
      // User cancelled - revert the checkbox
      localRejected.value = true
      return
    }

    try {
      await api.job_rest_jobs_partial_update(
        {
          rejected_flag: false,
          job_status: 'draft',
        },
        {
          params: { job_id: jobId.value },
        },
      )

      // Update the header in the store
      jobsStore.patchHeader(jobHeader.value.job_id, {
        status: 'draft',
        rejected_flag: false,
      })

      // Update local status
      localJobStatus.value = 'draft'

      toast.success('Job moved back to Draft status')
    } catch (error) {
      console.error('Failed to update rejected status:', error)
      toast.error('Failed to update job')
      // Revert the checkbox on error
      localRejected.value = true
    }
  } else {
    // CHECKING - validate no money to be invoiced
    try {
      // Use the composable to fetch financial data
      const financials = await fetchJobFinancials(jobHeader.value.pricing_methodology || undefined)

      // Check if there's money to be invoiced
      if (financials.toBeInvoiced > 0) {
        // Show warning but allow proceeding
        const confirmed = confirm(
          `Warning: Job has $${financials.toBeInvoiced.toFixed(2)} still to be invoiced. Are you sure you want to reject?`,
        )

        if (!confirmed) {
          // User cancelled - revert the checkbox
          localRejected.value = false
          return
        }
        // User confirmed - proceed with rejection despite outstanding amount
      }

      // Proceed with rejection
      await api.job_rest_jobs_partial_update(
        {
          rejected_flag: true,
          job_status: 'recently_completed',
        },
        {
          params: { job_id: jobId.value },
        },
      )

      // Update the header in the store
      jobsStore.patchHeader(jobHeader.value.job_id, {
        status: 'recently_completed',
        rejected_flag: true,
      })

      // Update local status
      localJobStatus.value = 'recently_completed'

      toast.success('Job marked as rejected and moved to Recently Completed')
    } catch (error) {
      console.error('Failed to update rejected status:', error)
      toast.error('Failed to update job')
      // Revert the checkbox on error
      localRejected.value = false
    }
  }
}

const companyDefaultsStore = useCompanyDefaultsStore()
const companyDefaults = computed(() => companyDefaultsStore.companyDefaults)

const jobDataWithPaid = computed(() => {
  if (!jobHeader.value) return undefined
  const h = jobHeader.value
  return {
    id: h.job_id,
    job_number: h.job_number,
    name: h.name,
    client_name: h.client?.name ?? '',
    client_id: h.client?.id ?? '',
    job_status: h.status ?? '',
    pricing_methodology: h.pricing_methodology ?? '',
    quoted: h.quoted,
    fully_invoiced: h.fully_invoiced,
    quote_acceptance_date: h.quote_acceptance_date ?? null,
    paid: Boolean(h.paid),
  }
})

watch(
  jobHeader,
  (h) => {
    if (!h) return
    if (!headerAutosave) {
      headerAutosave = useJobHeaderAutosave(h)
    }

    // locals (for the InlineEdit... existing components)
    localJobName.value = h.name
    localClientName.value = h.client?.name ?? ''
    localClientId.value = h.client?.id ?? ''
    localJobStatus.value = h.status
    localPricingMethodology.value = h.pricing_methodology ?? ''
    localQuoted.value = h.quoted
    localFullyInvoiced.value = h.fully_invoiced
    localRejected.value = h.rejected_flag
  },
  { immediate: true },
)

const jobError = computed(() => !loadingJob.value && !jobHeader.value)

// Quote accepted / revisions
const isQuoteAccepted = computed(() => !!jobDataWithPaid.value?.quote_acceptance_date)
const quoteRevisionsData = ref<{ total_revisions: number } | null>(null)

async function fetchQuoteRevisions() {
  if (!jobId.value) return
  try {
    const response = await api.job_rest_jobs_cost_sets_quote_revise_retrieve({
      params: { job_id: jobId.value },
    })
    quoteRevisionsData.value = response
  } catch {
    quoteRevisionsData.value = { total_revisions: 0 }
  }
}

watch(
  () => jobDataWithPaid.value?.quote_acceptance_date,
  (acceptanceDate) => {
    if (acceptanceDate) fetchQuoteRevisions()
  },
  { immediate: true },
)

const hasQuoteRevisions = computed(
  () => !!quoteRevisionsData.value && quoteRevisionsData.value.total_revisions > 0,
)
const shouldShowQuoteWarning = computed(() => isQuoteAccepted.value && !hasQuoteRevisions.value)

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

async function handleEventAdded(event) {
  if (event?.description) {
    await addEvent(event.description)
    notifications.notifyEventAdded(event.event_type || 'Event')
  }
}

function navigateBack() {
  router.push({ name: 'kanban' })
}

async function printJob() {
  if (!jobDataWithPaid.value?.id) {
    toast.error('Job ID not available')
    return
  }
  try {
    const blob = await jobService.getWorkshopPdf(jobDataWithPaid.value.id)
    const pdfUrl = URL.createObjectURL(blob)
    const win = window.open(pdfUrl, '_blank')
    if (win) {
      win.addEventListener('load', () => {
        win.print()
      })
      toast.success('Print dialog opened')
    } else {
      toast.error('Failed to open print window. Please check popup blocker settings.')
    }
  } catch (error) {
    toast.error('Error generating PDF for printing')
    debugLog('Error printing job:', error)
  }
}

async function downloadJobSheet() {
  if (!jobDataWithPaid.value?.id) {
    toast.error('Job ID not available')
    return
  }
  try {
    const blob = await jobService.getWorkshopPdf(jobDataWithPaid.value.id)
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `job_${jobDataWithPaid.value.job_number}_sheet.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Job sheet download started')
  } catch (error) {
    toast.error('Error generating PDF for download')
    debugLog('Error downloading job sheet:', error)
  }
}

debugLog('JobView - jobId:', jobId.value, 'jobHeader:', jobHeader.value)

onMounted(() => {
  debugLog('Quote accepted?: ', shouldShowQuoteWarning.value)
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
