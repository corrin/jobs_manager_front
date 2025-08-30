<template>
  <div class="job-quote-tab h-full flex flex-col">
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            Quote Management{{
              currentQuote?.has_quote ? ` - Revision ${currentQuote.quote?.rev}` : ''
            }}
          </h2>
        </div>
        <div v-if="currentQuote?.has_quote" class="flex items-center gap-2">
          <button
            class="inline-flex items-center justify-center h-9 px-3 rounded-md bg-blue-600 text-white border border-blue-700 text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style="min-width: 0"
            @click="onCopyFromEstimate"
            :disabled="isLoading || !hasEstimateData"
            :title="'Copy from Estimate'"
          >
            <Copy class="w-4 h-4 mr-1" /> Copy from Estimate
          </button>
          <button
            class="inline-flex items-center justify-center h-9 px-3 rounded-md bg-black text-white border border-gray-800 text-sm font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            style="min-width: 0"
            @click="onShowQuoteRevisions"
            :title="'Quote Revisions'"
          >
            <BookOpen class="w-4 h-4 mr-1" /> Quote Revisions
          </button>
          <template v-if="props.jobData?.quote_sheet">
            <button
              class="inline-flex items-center justify-center h-9 px-3 rounded-md bg-black text-white border border-gray-800 text-sm font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style="min-width: 0"
              @click="onGoToSpreadsheet"
              :title="'Go to Spreadsheet'"
            >
              <ExternalLink class="w-4 h-4 mr-1" /> Go to Spreadsheet
            </button>
            <button
              class="inline-flex items-center justify-center h-9 px-3 rounded-md bg-black text-white border border-gray-800 text-sm font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style="min-width: 0"
              @click="onRefreshSpreadsheet"
              :disabled="isLoading || isRefreshing"
              :title="'Refresh Spreadsheet'"
            >
              <RefreshCw class="w-4 h-4 mr-1" /> Refresh Spreadsheet
            </button>
          </template>
          <template v-else>
            <button
              class="inline-flex items-center justify-center h-9 px-3 rounded-md bg-black text-white border border-gray-800 text-sm font-medium hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style="min-width: 0"
              @click="onLinkQuote"
              :title="'Link Spreadsheet'"
            >
              <Link2 class="w-4 h-4 mr-1" /> Link Spreadsheet
            </button>
          </template>
          <CostLineDropdown
            :disabled="isLoading || areEditsBlocked"
            :wageRate="wageRate"
            :chargeOutRate="chargeOutRate"
            :materialsMarkup="materialsMarkup"
            @add-material="handleAddMaterial"
            @add-time="handleAddTime"
            @add-adjustment="handleAddAdjustment"
          />
        </div>
      </div>
    </div>

    <div v-if="currentQuote?.has_quote" class="flex-1 flex gap-6 min-h-0">
      <div v-if="isLoading" class="flex-1 flex items-center justify-center">
        <div class="flex items-center gap-2">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          Quote data is still loading, please wait
        </div>
      </div>
      <template v-else>
        <div class="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
          <div class="flex-shrink-0 p-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Quote Details</h3>
          </div>
          <div class="flex-1 overflow-hidden">
            <SmartCostLinesTable
              :lines="costLines"
              tabKind="quote"
              :readOnly="isLoading || areEditsBlocked"
              :showItemColumn="true"
              :showSourceColumn="false"
              @delete-line="handleSmartDelete"
              @add-line="handleAddEmptyLine"
              @duplicate-line="(line) => handleAddMaterial(line)"
              @move-line="(index, direction) => {}"
              @create-line="handleCreateFromEmpty"
            />
          </div>
        </div>
        <div class="w-64 flex-shrink-0">
          <CompactSummaryCard
            :key="`quote-summary-compact-${quoteKey}`"
            title="Quote Summary"
            :summary="currentQuote.quote?.summary"
            :costLines="quoteCostLines"
            :isLoading="isLoading"
            :revision="currentQuote.quote?.rev"
            @expand="showDetailedSummary = true"
          />
        </div>
      </template>
    </div>

    <div v-else class="flex-1">
      <CostLineDropdown
        :disabled="true"
        :wageRate="wageRate"
        :chargeOutRate="chargeOutRate"
        :materialsMarkup="materialsMarkup"
      />
      <SmartCostLinesTable
        :lines="quoteCostLines"
        tabKind="quote"
        :readOnly="true"
        :showItemColumn="false"
        :showSourceColumn="false"
        @delete-line="() => {}"
        @add-line="() => {}"
        @duplicate-line="() => {}"
        @move-line="() => {}"
      />
      <CostSetSummaryCard
        :key="`quote-summary-alt-${quoteKey}`"
        title="Quote Summary"
        :summary="null"
        :costLines="quoteCostLines"
        :isLoading="isLoading"
        :revision="currentQuote.quote?.rev"
      />
    </div>

    <Dialog :open="showPreviewModal" @update:open="showPreviewModal = $event">
      <DialogContent class="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Quote Refresh Preview</DialogTitle>
          <DialogDescription>
            Review the changes that will be applied to your quote
          </DialogDescription>
        </DialogHeader>
        <div v-if="previewData" class="space-y-6">
          <div class="bg-blue-50 rounded-lg p-4">
            <h4 class="font-medium text-blue-900 mb-3">Summary of Changes</h4>
            <div
              v-if="
                previewData.changes &&
                (previewData.changes.additions?.length ||
                  previewData.changes.updates?.length ||
                  previewData.changes.deletions?.length)
              "
              class="grid grid-cols-3 gap-4 text-sm"
            >
              <div class="text-center">
                <div class="text-lg font-bold text-green-600">
                  {{ previewData.changes.additions?.length || 0 }}
                </div>
                <div class="text-gray-600">Additions</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-blue-600">
                  {{ previewData.changes.updates?.length || 0 }}
                </div>
                <div class="text-gray-600">Updates</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-red-600">
                  {{ previewData.changes.deletions?.length || 0 }}
                </div>
                <div class="text-gray-600">Deletions</div>
              </div>
            </div>
            <div v-else class="text-center">
              <div class="text-lg font-bold text-gray-600">0</div>
              <div class="text-gray-600">No changes detected</div>
              <div class="text-sm text-gray-500 mt-1">
                The spreadsheet is in sync with the system
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <button class="px-4 py-2 bg-gray-200 rounded-md mr-2" @click="showPreviewModal = false">
            Cancel
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md font-medium"
            :disabled="
              !previewData?.changes ||
              (!previewData.changes.additions?.length &&
                !previewData.changes.updates?.length &&
                !previewData.changes.deletions?.length) ||
              isRefreshing
            "
            @click="onApplySpreadsheetChanges"
          >
            {{
              !previewData?.changes ||
              (!previewData.changes.additions?.length &&
                !previewData.changes.updates?.length &&
                !previewData.changes.deletions?.length)
                ? 'No Changes to Apply'
                : `Apply ${(previewData.changes.additions?.length || 0) + (previewData.changes.updates?.length || 0) + (previewData.changes.deletions?.length || 0)} Changes`
            }}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Quote Revisions Modal -->
    <Dialog :open="showQuoteRevisionsModal" @update:open="showQuoteRevisionsModal = $event">
      <DialogContent class="sm:max-w-4xl max-h-[85vh] min-h-[60vh]">
        <DialogHeader>
          <DialogTitle>Quote Revisions History</DialogTitle>
          <DialogDescription>
            View all previous quote revisions and create new ones
          </DialogDescription>
        </DialogHeader>

        <div v-if="isLoading" class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span class="ml-2">Loading revisions...</span>
        </div>

        <div v-else-if="quoteRevisionsData" class="space-y-6">
          <!-- Summary Header -->
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <h4 class="font-medium text-blue-900">Job {{ quoteRevisionsData.job_number }}</h4>
                <p class="text-sm text-blue-700">
                  {{ quoteRevisionsData.total_revisions }} revision{{
                    quoteRevisionsData.total_revisions !== 1 ? 's' : ''
                  }}
                  total
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-blue-700">Current CostSet Rev</p>
                <p class="font-semibold text-blue-900">
                  #{{ quoteRevisionsData.current_cost_set_rev }}
                </p>
              </div>
            </div>
          </div>

          <!-- Create New Revision Button -->
          <div class="flex justify-end">
            <button
              @click="onCreateNewRevision"
              :disabled="isCreatingRevision"
              class="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            >
              <PlusCircle class="w-4 h-4 mr-2" />
              {{ isCreatingRevision ? 'Creating...' : 'Create New Revision' }}
            </button>
          </div>

          <!-- Revisions List -->
          <div v-if="quoteRevisionsData.revisions.length > 0" class="space-y-4">
            <h5 class="font-medium text-gray-900">Previous Revisions</h5>
            <div class="space-y-3 max-h-[50vh] overflow-y-auto">
              <div
                v-for="revision in quoteRevisionsData.revisions"
                :key="revision.quote_revision"
                class="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                      <div class="flex items-center gap-2">
                        <RotateCcw class="w-4 h-4 text-blue-600" />
                        <span class="font-semibold text-gray-900"
                          >Revision #{{ revision.quote_revision }}</span
                        >
                      </div>
                      <span class="text-sm text-gray-500">
                        {{ formatDate(revision.archived_at) }}
                      </span>
                    </div>

                    <div v-if="revision.reason" class="mb-3">
                      <p class="text-sm text-gray-600">
                        <span class="font-medium">Reason:</span> {{ revision.reason }}
                      </p>
                    </div>

                    <div class="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <span class="text-gray-500">Cost:</span>
                        <span class="ml-1 font-medium text-red-600">
                          ${{ formatCurrency(revision.summary.cost) }}
                        </span>
                      </div>
                      <div>
                        <span class="text-gray-500">Revenue:</span>
                        <span class="ml-1 font-medium text-green-600">
                          ${{ formatCurrency(revision.summary.rev) }}
                        </span>
                      </div>
                      <div>
                        <span class="text-gray-500">Hours:</span>
                        <span class="ml-1 font-medium text-blue-600">
                          {{ formatNumber(revision.summary.hours) }}h
                        </span>
                      </div>
                    </div>

                    <!-- Cost Lines Details -->
                    <div class="mt-4 border-t border-gray-100 pt-4">
                      <h6 class="text-sm font-medium text-gray-900 mb-3">
                        Cost Lines ({{ revision.cost_lines.length }})
                      </h6>
                      <div class="space-y-2 max-h-24 overflow-y-auto">
                        <div
                          v-for="line in revision.cost_lines"
                          :key="line.id"
                          class="flex items-center justify-between text-xs bg-gray-50 rounded p-2"
                        >
                          <div class="flex-1">
                            <div class="flex items-center gap-2">
                              <span
                                class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium"
                                :class="{
                                  'bg-blue-100 text-blue-800': line.kind === 'time',
                                  'bg-purple-100 text-purple-800': line.kind === 'material',
                                  'bg-orange-100 text-orange-800': line.kind === 'adjust',
                                }"
                              >
                                {{ line.kind }}
                              </span>
                              <span class="font-medium text-gray-900 truncate max-w-32">{{
                                line.desc
                              }}</span>
                            </div>
                          </div>
                          <div class="flex items-center gap-3 text-right">
                            <div>
                              <span class="text-gray-500">Qty:</span>
                              <span class="font-medium">{{ formatNumber(line.quantity) }}</span>
                            </div>
                            <div>
                              <span class="text-gray-500">Cost:</span>
                              <span class="font-medium text-red-600"
                                >${{ formatCurrency(line.total_cost) }}</span
                              >
                            </div>
                            <div>
                              <span class="text-gray-500">Rev:</span>
                              <span class="font-medium text-green-600"
                                >${{ formatCurrency(line.total_rev) }}</span
                              >
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-8">
            <FileX class="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p class="text-gray-500">No previous revisions found</p>
            <p class="text-sm text-gray-400 mt-1">Create your first revision to get started</p>
          </div>
        </div>

        <DialogFooter>
          <button class="px-4 py-2 bg-gray-200 rounded-md" @click="showQuoteRevisionsModal = false">
            Close
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Detailed Summary Dialog -->
    <Dialog :open="showDetailedSummary" @update:open="showDetailedSummary = $event">
      <DialogContent class="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Detailed Quote Summary</DialogTitle>
          <DialogDescription>Complete breakdown of quote costs and revenue</DialogDescription>
        </DialogHeader>
        <div class="max-h-[60vh] overflow-y-auto">
          <CostSetSummaryCard
            :key="`quote-summary-detailed-${quoteKey}`"
            title="Quote Summary"
            :summary="currentQuote.quote?.summary"
            :costLines="quoteCostLines"
            :isLoading="isLoading"
            :revision="currentQuote.quote?.rev"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showDetailedSummary = false">Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <CostLineMaterialModal
      v-if="showEditModal && editingCostLine && editingCostLine.kind === 'material'"
      :materialsMarkup="materialsMarkup"
      :initial="editingCostLine"
      mode="edit"
      @close="closeEditModal"
      @submit="submitEditCostLine"
    />
    <CostLineTimeModal
      v-if="showEditModal && editingCostLine && editingCostLine.kind === 'time'"
      :wageRate="wageRate"
      :chargeOutRate="chargeOutRate"
      :initial="editingCostLine"
      mode="edit"
      @close="closeEditModal"
      @submit="submitEditCostLine"
    />
    <CostLineAdjustmentModal
      v-if="showEditModal && editingCostLine && editingCostLine.kind === 'adjust'"
      :initial="editingCostLine"
      mode="edit"
      @close="closeEditModal"
      @submit="submitEditCostLine"
    />
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '../../utils/debug'

import { ref, computed, watch } from 'vue'
import {
  Link2,
  ExternalLink,
  RefreshCw,
  BookOpen,
  PlusCircle,
  RotateCcw,
  FileX,
  Copy,
} from 'lucide-vue-next'
import CostLineDropdown from './CostLineDropdown.vue'
import SmartCostLinesTable from '../shared/SmartCostLinesTable.vue'
import CostSetSummaryCard from '../shared/CostSetSummaryCard.vue'
import { quoteService } from '../../services/quote.service'
import { toast } from 'vue-sonner'
import { schemas } from '../../api/generated/api'
import { api } from '../../api/client'
import { z } from 'zod'
import { useCompanyDefaultsStore } from '../../stores/companyDefaults'
import { costlineService } from '../../services/costline.service'
import CostLineMaterialModal from './CostLineMaterialModal.vue'
import CostLineTimeModal from './CostLineTimeModal.vue'
import CostLineAdjustmentModal from './CostLineAdjustmentModal.vue'
import CompactSummaryCard from '../shared/CompactSummaryCard.vue'
import { useJobsStore } from '../../stores/jobs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog'

type CostLine = z.infer<typeof schemas.CostLine>
type JobDetailResponse = z.infer<typeof schemas.JobDetailResponse>
type Job = z.infer<typeof schemas.Job>
type CostSet = z.infer<typeof schemas.CostSet>
type PreviewQuoteResponse = z.infer<typeof schemas.PreviewQuoteResponse>
type QuoteRevisionsListResponse = z.infer<typeof schemas.QuoteRevisionsList>

const props = defineProps<{
  jobId: string
  jobData?: Job
}>()

const emit = defineEmits<{
  'cost-line-changed': []
}>()

const currentQuote = computed(() => {
  const jobData = props.jobData

  if (!jobData || !jobData.latest_quote) {
    return { has_quote: false, quote: null }
  }

  // Use API structure exactly as returned - NO CONVERSIONS
  const quote = jobData.latest_quote as CostSet
  return {
    has_quote: true,
    quote: {
      id: quote.id,
      kind: quote.kind,
      rev: quote.rev,
      created: quote.created,
      summary: quote.summary,
      cost_lines: quote.cost_lines || [],
    },
  }
})

const isLoading = ref(false)
const isRefreshing = ref(false)
const showPreviewModal = ref(false)
const showQuoteRevisionsModal = ref(false)
const quoteRevisionsData = ref<QuoteRevisionsListResponse | null>(null)
const isCreatingRevision = ref(false)
const previewData = ref<PreviewQuoteResponse | null>(null)
const editingCostLine = ref<CostLine | null>(null)
const showEditModal = ref(false)
const costLines = ref<CostLine[]>([])
const quoteKey = ref(0) // Force reactivity key
const showDetailedSummary = ref(false)

const companyDefaultsStore = useCompanyDefaultsStore()
const companyDefaults = computed(() => companyDefaultsStore.companyDefaults)
const wageRate = computed(() => {
  const rate = companyDefaults.value?.wage_rate
  return rate || 0
})
const chargeOutRate = computed(() => {
  const rate = companyDefaults.value?.charge_out_rate
  return rate || 0
})
const materialsMarkup = computed(() => {
  const markup = companyDefaults.value?.materials_markup
  return markup || 0
})

const quoteCostLines = computed(() => {
  const lines = currentQuote.value?.quote?.cost_lines || []
  return lines
})

// Check if estimate data is available for copying
const hasEstimateData = computed(() => {
  return !!props.jobData?.latest_estimate?.cost_lines?.length
})

// Check if quote is accepted and edits should be blocked
const isQuoteAccepted = computed(() => {
  return !!props.jobData?.quote_acceptance_date
})

// Check if there are any quote revisions available
const hasQuoteRevisions = computed(() => {
  if (!quoteRevisionsData.value) return false
  return quoteRevisionsData.value.total_revisions > 0
})

// Edits are blocked if quote is accepted AND there are no revisions to unlock it
const areEditsBlocked = computed(() => {
  return isQuoteAccepted.value && !hasQuoteRevisions.value
})

watch(
  () => currentQuote.value.quote?.cost_lines,
  (lines) => {
    if (lines) costLines.value = lines
  },
  { immediate: true },
)

// Watch for quote acceptance to fetch revisions data
watch(
  () => props.jobData?.quote_acceptance_date,
  (acceptanceDate) => {
    if (acceptanceDate && currentQuote.value?.has_quote) {
      // When a quote gets accepted, fetch revisions to check if edits should be blocked
      fetchQuoteRevisions()
    }
  },
  { immediate: true },
)

async function refreshQuoteData() {
  if (!props.jobId) return
  isLoading.value = true
  try {
    const response: JobDetailResponse = await api.job_rest_jobs_retrieve({
      params: { job_id: props.jobId },
    })

    if (response.success && response.data) {
      const jobData = response.data
      if (props.jobData) {
        // Update props.jobData with API response directly - NO CONVERSIONS
        Object.assign(props.jobData, jobData)
      }

      // Accept latest_quote exactly as the API returns it - NO CONVERSIONS
      if (jobData.latest_quote) {
        const latestQuote = jobData.latest_quote as CostSet
        if (latestQuote.cost_lines && Array.isArray(latestQuote.cost_lines)) {
          costLines.value = latestQuote.cost_lines
        } else {
          // If cost_lines is empty or null after revision, clear it
          costLines.value = []
        }
      } else {
        // If no latest_quote, clear cost lines
        costLines.value = []
      }
    }
  } catch (error) {
    toast.error('Failed to refresh quote data')
    debugLog('Failed to refresh quote data:', error)
  } finally {
    isLoading.value = false
  }
}

async function onApplySpreadsheetChanges() {
  if (!props.jobData?.id) return
  toast.info('Applying changes...', { id: 'quote-apply' })
  try {
    const result = await quoteService.applyQuote(props.jobId)
    if (result.success) {
      toast.success('Changes applied successfully!')
      await refreshQuoteData()
      showPreviewModal.value = false
    } else {
      toast.error('Failed to apply changes')
    }
  } catch {
    toast.error('Error applying changes', { id: 'quote-apply' })
  } finally {
    toast.dismiss('quote-apply')
  }
}

async function onRefreshSpreadsheet() {
  if (!props.jobData?.id) return
  isRefreshing.value = true
  toast.info('Checking for updates...', { id: 'quote-refresh' })
  try {
    const preview = await quoteService.previewQuote(props.jobId)
    previewData.value = preview
    showPreviewModal.value = true
    toast.dismiss('quote-refresh')
  } catch {
    toast.error('Error checking for updates', { id: 'quote-refresh' })
  } finally {
    isRefreshing.value = false
  }
}

async function onLinkQuote() {
  if (!props.jobId) return
  isLoading.value = true
  toast.info('Linking spreadsheet...')
  try {
    await quoteService.linkQuote(props.jobId)
    toast.success('Spreadsheet linked successfully!')
    const jobsStore = useJobsStore()
    await jobsStore.fetchJob(props.jobId)
    await refreshQuoteData()
  } catch (error) {
    toast.error('Error linking spreadsheet')
    debugLog('Error linking spreadsheet:', error)
  } finally {
    isLoading.value = false
  }
}

function onGoToSpreadsheet() {
  if (!props.jobData?.quote_sheet?.sheet_url) return
  window.open(props.jobData.quote_sheet.sheet_url, '_blank')
}

function onShowQuoteRevisions() {
  showQuoteRevisionsModal.value = true
  fetchQuoteRevisions()
}

async function fetchQuoteRevisions() {
  if (!props.jobId) return
  console.log('fetchQuoteRevisions jobId:', props.jobId)
  isLoading.value = true
  try {
    const response = await api.job_rest_jobs_cost_sets_quote_revise_retrieve({
      params: { job_id: props.jobId },
    })
    quoteRevisionsData.value = response
  } catch (error) {
    toast.error('Failed to fetch quote revisions')
    debugLog('Failed to fetch quote revisions:', error)
  } finally {
    isLoading.value = false
  }
}

async function onCreateNewRevision() {
  if (!props.jobId) return
  console.log('onCreateNewRevision jobId:', props.jobId)
  isCreatingRevision.value = true
  toast.info('Creating new quote revision...', { id: 'create-revision' })
  try {
    const response = await api.job_rest_jobs_cost_sets_quote_revise_create(
      { reason: 'Manual revision creation' },
      {
        params: { job_id: props.jobId },
      },
    )

    if (response.success) {
      toast.success(`Quote revision ${response.quote_revision} created successfully!`)
      // Force reactivity update
      quoteKey.value++
      // Refresh data
      await Promise.all([fetchQuoteRevisions(), refreshQuoteData()])
    } else {
      toast.error('Failed to create quote revision')
    }
  } catch (error) {
    toast.error('Error creating quote revision')
    debugLog('Error creating quote revision:', error)
  } finally {
    isCreatingRevision.value = false
    toast.dismiss('create-revision')
  }
}

async function handleAddMaterial(payload: CostLine) {
  if (!payload || payload.kind !== 'material') return
  isLoading.value = true
  toast.info('Adding material cost line...')

  try {
    const createPayload = {
      kind: 'material' as const,
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
      meta: (payload.meta as Record<string, unknown>) || {},
    }
    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
    costLines.value = [...costLines.value, created]
    toast.success('Material cost line added!')
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to add material cost line.')
    debugLog('Failed to add material:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleAddTime(payload: CostLine) {
  if (!payload || payload.kind !== 'time') return
  isLoading.value = true
  toast.info('Adding time cost line...')
  try {
    const createPayload = {
      kind: 'time' as const,
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
      meta: (payload.meta as Record<string, unknown>) || {},
    }
    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
    // Accept the response exactly as returned by API - NO CONVERSIONS
    costLines.value = [...costLines.value, created]
    toast.success('Time cost line added!')
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to add time cost line.')
    debugLog('Failed to add time:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleAddAdjustment(payload: CostLine) {
  if (!payload || payload.kind !== 'adjust') return
  isLoading.value = true
  toast.info('Adding adjustment cost line...')
  try {
    const createPayload = {
      kind: 'adjust' as const,
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
      meta: (payload.meta as Record<string, unknown>) || {},
    }
    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
    // Accept the response exactly as returned by API - NO CONVERSIONS
    costLines.value = [...costLines.value, created]
    toast.success('Adjustment cost line added!')
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to add adjustment cost line.')
    debugLog('Failed to add adjustment:', error)
  } finally {
    isLoading.value = false
  }
}

function closeEditModal() {
  showEditModal.value = false
  editingCostLine.value = null
}

async function submitEditCostLine(payload: CostLine) {
  if (!payload || !payload.id) return
  isLoading.value = true
  toast.info('Updating cost line...')
  try {
    // Convert payload to ensure proper types for API
    const updatePayload = {
      ...payload,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
      meta: (payload.meta as Record<string, unknown>) || {},
    }
    const updated = await costlineService.updateCostLine(payload.id, updatePayload)
    costLines.value = costLines.value.map((l) => (l.id === updated.id ? { ...updated } : l))
    toast.success('Cost line updated!')
    closeEditModal()
  } catch (error) {
    toast.error('Failed to update cost line.')
    debugLog('Failed to update cost line:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleDeleteCostLine(line: CostLine) {
  if (!line.id) return
  isLoading.value = true
  toast.info('Deleting cost line...')
  try {
    await costlineService.deleteCostLine(line.id)
    costLines.value = costLines.value.filter((l) => l.id !== line.id)
    toast.success('Cost line deleted successfully!')
  } catch (error) {
    toast.error('Failed to delete cost line.')
    debugLog('Failed to delete cost line:', error)
  } finally {
    isLoading.value = false
  }
}

// Bridge for SmartCostLinesTable delete event (id or index)
function handleSmartDelete(idOrIndex: string | number) {
  const line =
    typeof idOrIndex === 'string'
      ? (costLines.value.find((l) => l.id === idOrIndex) ?? null)
      : (costLines.value[idOrIndex] ?? null)

  if (line) {
    void handleDeleteCostLine(line as CostLine)
  }
}

// Helper functions for formatting
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Add empty line to the grid (UI-only, not persisted until user fills baseline data)
function handleAddEmptyLine() {
  const newLine: CostLine = {
    id: '', // empty ID indicates unsaved line
    kind: 'material',
    desc: '',
    quantity: 1,
    unit_cost: 0,
    unit_rev: 0,
    total_cost: 0,
    total_rev: 0,
    ext_refs: {},
    meta: {},
  }
  costLines.value = [...costLines.value, newLine]
}

// Handle creating a new line from an empty line that meets baseline criteria
async function handleCreateFromEmpty(line: CostLine) {
  console.log('Creating cost line from empty line:', line)

  try {
    const createPayload = {
      kind: line.kind as 'material' | 'time' | 'adjust',
      desc: line.desc || '',
      quantity: line.quantity || 1,
      unit_cost: line.unit_cost ?? 0,
      unit_rev: line.unit_rev ?? 0,
      ext_refs: (line.ext_refs as Record<string, unknown>) || {},
      meta: (line.meta as Record<string, unknown>) || {},
    }

    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)

    // Replace the empty line with the created one
    const index = costLines.value.findIndex((l) => l === line)
    if (index !== -1) {
      costLines.value[index] = created
    }

    emit('cost-line-changed')
    toast.success('Cost line created!')
    console.log('✅ Successfully created cost line:', created)
  } catch (error) {
    toast.error('Failed to create cost line.')
    console.error('❌ Failed to create cost line:', error)
  }
}

// Copy all cost lines from estimate to quote
async function onCopyFromEstimate() {
  if (!props.jobData?.latest_estimate?.cost_lines?.length) {
    toast.error('No estimate data available to copy')
    return
  }

  const estimateLines = props.jobData.latest_estimate.cost_lines
  isLoading.value = true
  toast.info('Copying from estimate...', { id: 'copy-estimate' })

  try {
    // Clear existing quote lines first
    if (costLines.value.length > 0) {
      for (const line of costLines.value) {
        if (line.id) {
          await costlineService.deleteCostLine(line.id)
        }
      }
    }

    // Copy each estimate line to quote
    const createdLines: CostLine[] = []
    for (const estimateLine of estimateLines) {
      const createPayload = {
        kind: estimateLine.kind as 'material' | 'time' | 'adjust',
        desc: estimateLine.desc || '',
        quantity: estimateLine.quantity || 0,
        unit_cost: estimateLine.unit_cost ?? 0,
        unit_rev: estimateLine.unit_rev ?? 0,
        ext_refs: (estimateLine.ext_refs as Record<string, unknown>) || {},
        meta: (estimateLine.meta as Record<string, unknown>) || {},
      }

      const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
      createdLines.push(created)
    }

    // Update local state
    costLines.value = createdLines

    // Refresh quote data to get updated summary
    await refreshQuoteData()

    toast.success(`Copied ${createdLines.length} lines from estimate!`)
    emit('cost-line-changed')
  } catch (error) {
    toast.error('Failed to copy from estimate.')
    debugLog('Failed to copy from estimate:', error)
  } finally {
    isLoading.value = false
    toast.dismiss('copy-estimate')
  }
}
</script>
