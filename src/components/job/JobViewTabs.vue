<template>
  <div class="flex-1 flex flex-col min-h-0">
    <div class="flex-shrink-0 bg-white border-b border-gray-200">
      <div class="md:hidden">
        <div class="flex border-b border-gray-200">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="handleTabChange(tab.key as JobTabKey)"
            :class="[
              'flex-1 py-3 px-2 text-sm font-medium text-center border-b-2 transition-colors',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700',
            ]"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <div class="hidden md:block px-6">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="handleTabChange(tab.key as JobTabKey)"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === tab.key
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            {{ tab.label }}
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
          @cost-line-changed="$emit('reload-job')"
        />
      </div>
      <div
        v-if="activeTab === 'quote' && jobData?.pricing_methodology !== 'time_materials'"
        class="h-full p-4 md:p-6"
      >
        <JobQuoteTab
          v-if="jobData"
          :job-id="jobData.id"
          :job-data="jobData"
          @quote-imported="$emit('quote-imported', $event)"
          @cost-line-changed="$emit('reload-job')"
        />
      </div>
      <div v-if="activeTab === 'actual'" class="h-full p-4 md:p-6">
        <JobActualTab
          v-if="jobData"
          :job-id="jobData.id"
          :actual-summary-from-backend="jobData.latest_actual?.summary"
          @cost-line-changed="$emit('reload-job')"
        />
      </div>
      <div v-if="activeTab === 'financial'" class="h-full p-4 md:p-6">
        <JobFinancialTab
          v-if="jobData"
          :job-data="jobData"
          :job-id="jobData.id"
          :latest-pricings="latestPricings || undefined"
          @quote-created="$emit('quote-created')"
          @quote-accepted="$emit('quote-accepted')"
          @invoice-created="$emit('invoice-created')"
        />
      </div>
      <div v-if="activeTab === 'costAnalysis'" class="h-full p-4 md:p-6">
        <JobCostAnalysisTab v-if="jobData" :job-id="jobData.id" :job-data="analysisData" />
      </div>
      <div v-if="activeTab === 'jobSettings'" class="h-full p-4 md:p-6">
        <JobSettingsTab
          v-if="jobData"
          :job-data="jobData"
          @job-updated="$emit('job-updated', $event)"
        />
      </div>
      <div v-if="activeTab === 'workflow'" class="h-full p-4 md:p-6">
        <JobWorkflowTab v-if="jobData" :job-data="jobData" />
      </div>
      <div v-if="activeTab === 'history'" class="h-full p-4 md:p-6">
        <JobHistoryTab
          v-if="jobData"
          :job-id="jobData.id"
          @event-added="$emit('event-added', $event)"
        />
      </div>
      <div v-if="activeTab === 'attachments'" class="h-full p-4 md:p-6">
        <JobAttachmentsTab
          v-if="jobData"
          :job-id="jobData.id"
          :job-number="jobData.job_number"
          @file-uploaded="$emit('file-uploaded')"
          @file-deleted="$emit('file-deleted')"
        />
      </div>
      <div v-if="activeTab === 'printJob'" class="h-full p-4 md:p-6">
        <JobPdfTab v-if="jobData" :job-id="jobData.id" :job-number="jobData.job_number" />
      </div>
      <div v-if="activeTab === 'quotingChat'" class="h-full p-4 md:p-6">
        <div class="h-full flex items-center justify-center">
          <div class="text-center">
            <h3 class="text-lg font-medium text-gray-900 mb-2">Quoting Chat</h3>
            <p class="text-gray-500">AI assistant for quoting help.</p>
            <button
              @click="openQuotingChat"
              class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Open Quoting Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '@/utils/debug'
import JobEstimateTab from './JobEstimateTab.vue'
import JobQuoteTab from './JobQuoteTab.vue'
import JobActualTab from './JobActualTab.vue'
import JobFinancialTab from './JobFinancialTab.vue'
import JobCostAnalysisTab from './JobCostAnalysisTab.vue'
import JobSettingsTab from './JobSettingsTab.vue'
import JobWorkflowTab from './JobWorkflowTab.vue'
import JobHistoryTab from './JobHistoryTab.vue'
import JobAttachmentsTab from './JobAttachmentsTab.vue'
import JobPdfTab from './JobPdfTab.vue'
import { watch, computed } from 'vue'
import { useRouter } from 'vue-router'
import { z } from 'zod'
import { schemas } from '@/api/generated/api'
// Define JobTabKey type locally as it's UI-specific
type JobTabKey =
  | 'estimate'
  | 'quote'
  | 'actual'
  | 'financial'
  | 'costAnalysis'
  | 'jobSettings'
  | 'workflow'
  | 'history'
  | 'attachments'
  | 'printJob'
  | 'quotingChat'

// Use generated Job type from Zodios API
type Job = z.infer<typeof schemas.Job>

const emit = defineEmits<{
  (e: 'change-tab', tab: JobTabKey): void
  (e: 'open-settings'): void
  (e: 'open-workflow'): void
  (e: 'open-history'): void
  (e: 'open-attachments'): void
  (e: 'open-pdf'): void
  (e: 'quote-imported', result: unknown): void
  (e: 'quote-created'): void
  (e: 'quote-accepted'): void
  (e: 'invoice-created'): void
  (e: 'delete-job'): void
  (e: 'reload-job'): void
  (e: 'job-updated', job: unknown): void
  (e: 'event-added', event: unknown): void
  (e: 'file-uploaded'): void
  (e: 'file-deleted'): void
}>()

const allTabs = [
  { key: 'estimate', label: 'Estimate' },
  { key: 'quote', label: 'Quote' },
  { key: 'actual', label: 'Actual' },
  { key: 'financial', label: 'Financial' },
  { key: 'costAnalysis', label: 'Cost Analysis' },
  { key: 'jobSettings', label: 'Job Settings' },
  { key: 'workflow', label: 'Workflow' },
  { key: 'history', label: 'History' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'printJob', label: 'Print Job' },
  { key: 'quotingChat', label: 'Quoting Chat' },
] as const

const tabs = computed(() => {
  if (props.jobData?.pricing_methodology === 'time_materials') {
    return allTabs.filter((tab) => tab.key !== 'quote')
  }

  return allTabs
})

function handleTabChange(tab: JobTabKey) {
  emit('change-tab', tab)
}

const router = useRouter()

function openQuotingChat() {
  if (!props.jobData) return
  router.push({
    name: 'QuotingChatView',
    query: {
      jobId: props.jobData.id,
      jobName: props.jobData.name,
      jobNumber: props.jobData.job_number.toString(),
      clientName: props.jobData.client_name,
    },
  })
}

const props = defineProps<{
  activeTab: JobTabKey
  jobData: Job | null
  companyDefaults: Record<string, unknown> | null
  latestPricings: Record<string, unknown> | null
}>()

const analysisData = computed(() => {
  if (!props.jobData) return undefined

  const hasValidQuote =
    props.jobData.latest_quote &&
    typeof props.jobData.latest_quote === 'object' &&
    Object.keys(props.jobData.latest_quote).length > 0

  return {
    pricing_methodology: props.jobData.pricing_methodology,
    has_quote: hasValidQuote,
    quote: props.jobData.latest_quote || null,
  }
})

watch(
  () => props.jobData,
  (val) => {
    debugLog('[JobViewTabs] jobData prop changed:', val)
  },
)
watch(
  () => props.companyDefaults,
  (val) => {
    debugLog('[JobViewTabs] companyDefaults prop changed:', val)
  },
)
watch(
  () => props.activeTab,
  (val) => {
    debugLog('[JobViewTabs] activeTab changed:', val)
  },
)
</script>
