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
        <div class="flex gap-2">
          <button
            v-if="!currentQuote?.has_quote"
            class="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @click="onLinkQuote"
          >
            Link Quote
          </button>
          <template v-else>
            <button
              class="px-4 py-2 bg-gray-100 text-blue-700 border border-blue-300 rounded-md font-medium hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="onGoToSpreadsheet"
            >
              Go to Spreadsheet
            </button>
            <button
              class="px-4 py-2 bg-gray-100 text-blue-700 border border-blue-300 rounded-md font-medium hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              @click="onRefreshSpreadsheet"
              :disabled="isLoading || isRefreshing"
            >
              Refresh Spreadsheet
            </button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="currentQuote?.has_quote" class="flex-1 flex gap-6 min-h-0">
      <div class="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div class="flex-shrink-0 p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Quote Details</h3>
        </div>
        <div class="flex-1 overflow-hidden">
          <CostLinesGrid :costLines="quoteCostLines" :showActions="false" />
        </div>
      </div>
      <div class="flex-1">
        <CostSetSummaryCard
          title="Quote Summary"
          :summary="currentQuote.quote?.summary"
          :costLines="quoteCostLines"
          :isLoading="isLoading"
        />
      </div>
    </div>

    <div v-else class="flex-1">
      <AddCostLineDropdown
        :disabled="true"
        :wageRate="0"
        :chargeOutRate="0"
        :materialsMarkup="0"
      />
      <CostLinesGrid :costLines="quoteCostLines" :showActions="true" />
      <CostSetSummaryCard
        title="Quote Summary"
        :summary="null"
        :costLines="quoteCostLines"
        :isLoading="isLoading"
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
            <div v-if="previewData.diff_preview.total_changes > 0" class="grid grid-cols-3 gap-4 text-sm">
              <div class="text-center">
                <div class="text-lg font-bold text-green-600">{{ previewData.diff_preview.additions_count }}</div>
                <div class="text-gray-600">Additions</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-blue-600">{{ previewData.diff_preview.updates_count }}</div>
                <div class="text-gray-600">Updates</div>
              </div>
              <div class="text-center">
                <div class="text-lg font-bold text-red-600">{{ previewData.diff_preview.deletions_count }}</div>
                <div class="text-gray-600">Deletions</div>
              </div>
            </div>
            <div v-else class="text-center">
              <div class="text-lg font-bold text-gray-600">0</div>
              <div class="text-gray-600">No changes detected</div>
              <div class="text-sm text-gray-500 mt-1">The spreadsheet is in sync with the system</div>
            </div>
          </div>
          <!-- Adicione aqui detalhes dos itens, erros e warnings se necessário -->
        </div>
        <DialogFooter>
          <button class="px-4 py-2 bg-gray-200 rounded-md mr-2" @click="showPreviewModal = false">Cancel</button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-md font-medium"
            :disabled="!previewData || previewData.diff_preview.total_changes === 0 || isRefreshing"
            @click="onApplySpreadsheetChanges"
          >
            {{ previewData?.diff_preview.total_changes === 0 ? 'No Changes to Apply' : `Apply ${previewData?.diff_preview.total_changes} Changes` }}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import AddCostLineDropdown from './AddCostLineDropdown.vue'
import CostLinesGrid from '@/shared/CostLinesGrid.vue'
import CostSetSummaryCard from '../shared/CostSetSummaryCard.vue'
import { quoteService, type QuotePreview, type QuoteApplyResult } from '../../services/quote.service'
import { toast } from 'vue-sonner'
import type { Job } from '../../types/costing.types'
import type { CostLine } from '../../types/costing.types'

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

const quoteCostLines = computed(() => {
  const lines = currentQuote.value?.quote?.cost_lines || []
  return lines
})

function onLinkQuote() {
  // TODO: implementar lógica de linkar quote
  // Exemplo: abrir modal ou chamar service
  alert('Link Quote action triggered!')
}

function onGoToSpreadsheet() {
  // TODO: implementar navegação para a planilha vinculada
  // Exemplo: abrir URL em nova aba
  // window.open(sheetUrl, '_blank')
  alert('Go to Spreadsheet action triggered!')
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

async function onApplySpreadsheetChanges() {
  if (!props.jobData?.id) return
  toast.loading('Applying changes...', { id: 'quote-apply' })
  try {
    const result: QuoteApplyResult = await quoteService.applyQuote(props.jobId)
    if (result.success) {
      toast.success('Changes applied successfully!')
      // TODO: atualizar estado local com os novos dados da quote
    } else {
      toast.error('Failed to apply changes')
    }
  } catch {
    toast.error('Error applying changes', { id: 'quote-apply' })
  } finally {
    toast.dismiss('quote-apply')
  }
}
</script>

<style scoped>
/* Adicione estilos personalizados aqui, se necessário */
</style>
