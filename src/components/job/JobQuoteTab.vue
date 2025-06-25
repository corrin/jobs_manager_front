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
            @open-material-modal="showMaterialModal = true"
            @open-time-modal="showTimeModal = true"
          />
        </div>
      </div>
    </div>

    <div v-if="currentQuote?.has_quote" class="flex-1 flex gap-6 min-h-0">
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
              v-if="previewData.diff_preview.total_changes > 0"
              class="grid grid-cols-3 gap-4 text-sm"
            >
              <div class="text-center">
                <div class="text-lg font-bold text-green-600">
                  {{ previewData.diff_preview.additions_count }}
                </div>
                <div class="text-gray-600">Additions</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-blue-600">
                  {{ previewData.diff_preview.updates_count }}
                </div>
                <div class="text-gray-600">Updates</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-red-600">
                  {{ previewData.diff_preview.deletions_count }}
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
            :disabled="!previewData || previewData.diff_preview.total_changes === 0 || isRefreshing"
            @click="onApplySpreadsheetChanges"
          >
            {{
              previewData?.diff_preview.total_changes === 0
                ? 'No Changes to Apply'
                : `Apply ${previewData?.diff_preview.total_changes} Changes`
            }}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <CostLineMaterialModal
      v-if="showMaterialModal"
      :materialsMarkup="materialsMarkup"
      @close="showMaterialModal = false"
      @submit="handleAddMaterial"
    />
    <CostLineTimeModal
      v-if="showTimeModal"
      :wageRate="wageRate"
      :chargeOutRate="chargeOutRate"
      @close="showTimeModal = false"
      @submit="handleAddTime"
    />
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
import { ref, computed, watch } from 'vue'
import { Link2, ExternalLink, RefreshCw } from 'lucide-vue-next'
import CostLineDropdown from './CostLineDropdown.vue'
import CostLinesGrid from '@/components/shared/CostLinesGrid.vue'
import CostSetSummaryCard from '../shared/CostSetSummaryCard.vue'
import {
  quoteService,
  type QuotePreview,
  type QuoteApplyResult,
} from '../../services/quote.service'
import { toast } from 'vue-sonner'
import type { Job } from '../../types/costing.types'
import type { CostLine } from '../../types/costing.types'
import { useCompanyDefaultsStore } from '@/stores/companyDefaults'
import { costlineService } from '@/services/costline.service'
import CostLineMaterialModal from './CostLineMaterialModal.vue'
import CostLineTimeModal from './CostLineTimeModal.vue'
import { useJobsStore } from '../../stores/jobs'

interface Props {
  jobId: string
  jobData?: Job
}

const props = defineProps<Props>()

const currentQuote = computed(() => {
  const jobData = props.jobData as unknown

  type QuoteData = {
    id: string
    kind: 'quote'
    rev: number
    created: string
    summary: { cost: number; rev: number; hours: number }
    cost_lines: CostLine[]
  }
  type JobData = { latest_quote?: QuoteData; latest_quote_pricing?: { id: string } }
  const isJobData = (data: unknown): data is JobData => typeof data === 'object' && data !== null

  if (!isJobData(jobData)) {
    return { has_quote: false, quote: null }
  }

  if (!jobData.latest_quote) {
    return { has_quote: false, quote: null }
  }

  const quoteData = jobData.latest_quote
  return {
    has_quote: true,
    quote: {
      id: String(quoteData.id),
      kind: 'quote' as const,
      rev: Number(quoteData.rev),
      created: String(quoteData.created),
      summary: quoteData.summary ?? { cost: 0, rev: 0, hours: 0 },
      cost_lines: (quoteData.cost_lines || []).map((line) => ({
        ...line,
        quantity: typeof line.quantity === 'string' ? Number(line.quantity) : line.quantity,
        unit_cost: typeof line.unit_cost === 'string' ? Number(line.unit_cost) : line.unit_cost,
        unit_rev: typeof line.unit_rev === 'string' ? Number(line.unit_rev) : line.unit_rev,
      })),
    },
  }
})

const isLoading = ref(false)
const isRefreshing = ref(false)
const showPreviewModal = ref(false)
const previewData = ref<QuotePreview | null>(null)
const showMaterialModal = ref(false)
const showTimeModal = ref(false)
const editingCostLine = ref<CostLine | null>(null)
const showEditModal = ref(false)
const costLines = ref<CostLine[]>([])

const companyDefaultsStore = useCompanyDefaultsStore()
const companyDefaults = computed(() => companyDefaultsStore.companyDefaults)
const wageRate = computed(() => companyDefaults.value?.wage_rate || 0)
const chargeOutRate = computed(() => companyDefaults.value?.charge_out_rate || 0)
const materialsMarkup = computed(() => companyDefaults.value?.materials_markup || 0)

const quoteCostLines = computed(() => {
  const lines = currentQuote.value?.quote?.cost_lines || []
  return lines
})

const quoteData = ref(currentQuote.value.quote)
watch(
  () => currentQuote.value.quote,
  (val) => {
    quoteData.value = val
  },
  { immediate: true, deep: true },
)

watch(
  () => currentQuote.value.quote?.cost_lines,
  (lines) => {
    if (lines) costLines.value = [...lines]
  },
  { immediate: true },
)

async function refreshQuoteData() {
  if (!props.jobId) return
  isLoading.value = true
  try {
    const response = await fetch(`/api/job/${props.jobId}`)
    const updatedJob = await response.json()
    if (updatedJob && updatedJob.latest_quote) {
      if (props.jobData) {
        Object.assign(props.jobData, updatedJob)
      }
      quoteData.value = updatedJob.latest_quote
      costLines.value = [...(updatedJob.latest_quote.cost_lines || [])]
    }
  } catch (error) {
    toast.error('Failed to refresh quote data')
    console.error('Failed to refresh quote data:', error)
  } finally {
    isLoading.value = false
  }
}

async function onApplySpreadsheetChanges() {
  if (!props.jobData?.id) return
  toast.loading('Applying changes...', { id: 'quote-apply' })
  try {
    const result: QuoteApplyResult = await quoteService.applyQuote(props.jobId)
    if (result.success) {
      toast.success('Changes applied successfully!')
      await refreshQuoteData()
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
    const jobsStore = useJobsStore()
    await jobsStore.linkQuote(props.jobId)
    toast.success('Spreadsheet linked successfully!')
    await jobsStore.fetchJob(props.jobId)
    await refreshQuoteData()
  } catch (error) {
    toast.error('Error linking spreadsheet')
    console.error('Error linking spreadsheet:', error)
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
      kind: 'material',
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: payload.ext_refs,
      meta: payload.meta,
    }
    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
    costLines.value = [
      ...costLines.value,
      {
        ...created,
        quantity:
          typeof created.quantity === 'string' ? Number(created.quantity) : created.quantity,
        unit_cost:
          typeof created.unit_cost === 'string' ? Number(created.unit_cost) : created.unit_cost,
        unit_rev:
          typeof created.unit_rev === 'string' ? Number(created.unit_rev) : created.unit_rev,
      },
    ]
    toast.success('Material cost line added!')
  } catch (error) {
    toast.error('Failed to add material cost line.')
    console.error('Failed to add material:', error)
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
      kind: 'time',
      desc: payload.desc,
      quantity: payload.quantity,
      unit_cost: payload.unit_cost,
      unit_rev: payload.unit_rev,
      ext_refs: payload.ext_refs,
      meta: payload.meta,
    }
    const created = await costlineService.createCostLine(props.jobId, 'quote', createPayload)
    costLines.value = [
      ...costLines.value,
      {
        ...created,
        quantity:
          typeof created.quantity === 'string' ? Number(created.quantity) : created.quantity,
        unit_cost:
          typeof created.unit_cost === 'string' ? Number(created.unit_cost) : created.unit_cost,
        unit_rev:
          typeof created.unit_rev === 'string' ? Number(created.unit_rev) : created.unit_rev,
      },
    ]
    toast.success('Time cost line added!')
  } catch (error) {
    toast.error('Failed to add time cost line.')
    console.error('Failed to add time:', error)
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
    const updated = await costlineService.updateCostLine(payload.id, payload)
    costLines.value = costLines.value.map((l) => (l.id === updated.id ? { ...updated } : l))
    toast.success('Cost line updated!')
    closeEditModal()
  } catch (error) {
    toast.error('Failed to update cost line.')
    console.error('Failed to update cost line:', error)
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
    console.error('Failed to delete cost line:', error)
  } finally {
    isLoading.value = false
  }
}
</script>
