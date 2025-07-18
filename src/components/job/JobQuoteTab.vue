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
          <p class="text-gray-600">Manage quote details and cost breakdown for this job.</p>
        </div>
        <div v-if="currentQuote?.has_quote" class="flex items-center gap-2">
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
            :disabled="isLoading"
            :wageRate="wageRate"
            :chargeOutRate="chargeOutRate"
            :materialsMarkup="materialsMarkup"
            @add-material="handleAddMaterial"
            @add-time="handleAddTime"
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
            <CostLinesGrid
              :costLines="costLines"
              :showActions="true"
              @edit="openEditModal"
              @delete="handleDeleteCostLine"
            />
          </div>
        </div>
        <div class="flex-1 flex flex-col min-h-0">
          <CostSetSummaryCard
            class="h-full min-h-0 flex-1"
            title="Quote Summary"
            :summary="currentQuote.quote?.summary"
            :costLines="quoteCostLines"
            :isLoading="isLoading"
            :revision="currentQuote.quote?.rev"
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
      <CostLinesGrid :costLines="quoteCostLines" :showActions="true" />
      <CostSetSummaryCard
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
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '../../utils/debug'

import { ref, computed, watch } from 'vue'
import { Link2, ExternalLink, RefreshCw } from 'lucide-vue-next'
import CostLineDropdown from './CostLineDropdown.vue'
import CostLinesGrid from '../shared/CostLinesGrid.vue'
import CostSetSummaryCard from '../shared/CostSetSummaryCard.vue'
import { quoteService } from '../../services/quote.service'
import { toast } from 'vue-sonner'
import { api, schemas } from '../../api/generated/api'
import { z } from 'zod'
import { useCompanyDefaultsStore } from '../../stores/companyDefaults'
import { costlineService } from '../../services/costline.service'
import CostLineMaterialModal from './CostLineMaterialModal.vue'
import CostLineTimeModal from './CostLineTimeModal.vue'
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

const props = defineProps<{
  jobId: string
  jobData?: Job
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
const previewData = ref<PreviewQuoteResponse | null>(null)
const editingCostLine = ref<CostLine | null>(null)
const showEditModal = ref(false)
const costLines = ref<CostLine[]>([])

const companyDefaultsStore = useCompanyDefaultsStore()
const companyDefaults = computed(() => companyDefaultsStore.companyDefaults)
const wageRate = computed(() => {
  const rate = companyDefaults.value?.wage_rate
  return rate ? parseFloat(rate) : 0
})
const chargeOutRate = computed(() => {
  const rate = companyDefaults.value?.charge_out_rate
  return rate ? parseFloat(rate) : 0
})
const materialsMarkup = computed(() => {
  const markup = companyDefaults.value?.materials_markup
  return markup ? parseFloat(markup) : 0
})

const quoteCostLines = computed(() => {
  const lines = currentQuote.value?.quote?.cost_lines || []
  return lines
})

watch(
  () => currentQuote.value.quote?.cost_lines,
  (lines) => {
    if (lines) costLines.value = lines
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
        }
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
  toast.loading('Applying changes...', { id: 'quote-apply' })
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
  toast.loading('Checking for updates...', { id: 'quote-refresh' })
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
  toast.loading('Linking spreadsheet...')
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

async function handleAddMaterial(payload: CostLine) {
  if (!payload || payload.kind !== 'material') return
  isLoading.value = true
  toast.loading('Adding material cost line...')
  try {
    const createPayload = {
      kind: 'material' as const,
      desc: payload.desc,
      quantity: String(payload.quantity || 0),
      unit_cost: String(payload.unit_cost || 0),
      unit_rev: String(payload.unit_rev || 0),
      ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
      meta: (payload.meta as Record<string, unknown>) || {},
    }
    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
    // Accept the response exactly as returned by API - NO CONVERSIONS
    costLines.value = [...costLines.value, created]
    toast.success('Material cost line added!')
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
  toast.loading('Adding time cost line...')
  try {
    const createPayload = {
      kind: 'time' as const,
      desc: payload.desc,
      quantity: String(payload.quantity || 0),
      unit_cost: String(payload.unit_cost || 0),
      unit_rev: String(payload.unit_rev || 0),
      ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
      meta: (payload.meta as Record<string, unknown>) || {},
    }
    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
    // Accept the response exactly as returned by API - NO CONVERSIONS
    costLines.value = [...costLines.value, created]
    toast.success('Time cost line added!')
  } catch (error) {
    toast.error('Failed to add time cost line.')
    debugLog('Failed to add time:', error)
  } finally {
    isLoading.value = false
  }
}

function openEditModal(line: CostLine) {
  editingCostLine.value = line
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingCostLine.value = null
}

async function submitEditCostLine(payload: CostLine) {
  if (!payload || !payload.id) return
  isLoading.value = true
  toast.loading('Updating cost line...')
  try {
    // Convert payload to ensure proper types for API
    const updatePayload = {
      ...payload,
      quantity: String(payload.quantity || 0),
      unit_cost: String(payload.unit_cost || 0),
      unit_rev: String(payload.unit_rev || 0),
      ext_refs: (payload.ext_refs as Record<string, unknown>) || {},
      meta: (payload.meta as Record<string, unknown>) || {},
    }
    const updated = await costlineService.updateCostLine(Number(payload.id), updatePayload)
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
  toast.loading('Deleting cost line...')
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
</script>
