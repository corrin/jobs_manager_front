<template>
  <div class="job-quote-tab h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            Quote Management{{ currentQuote?.has_quote ? ` - Revision ${currentQuote.quote?.rev}` : '' }}
          </h2>
          <p class="text-gray-600">
            Manage quote details and cost breakdown for this job.
          </p>
        </div>
        <button
          @click="showImportModal = true"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Import Quote
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="currentQuote?.has_quote" class="flex-1 flex gap-6 min-h-0">
      <!-- Left Column: Cost Lines Grid (50%) -->
      <div class="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div class="flex-shrink-0 p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Quote Details</h3>
        </div>
        <div class="flex-1 overflow-hidden">
          <QuoteCostLinesGrid 
            :cost-lines="quoteCostLines"
            :is-loading="isLoading"
          />
        </div>
      </div>

      <!-- Right Column: Summary (50%) -->
      <div class="flex-1">
        <QuoteSummaryCard 
          :quote-data="currentQuote.quote" 
          :is-loading="isLoading"
          class="h-full"
        />
      </div>
    </div>

    <!-- No Quote State -->
    <div v-else class="flex-1 flex items-center justify-center">
      <div class="text-center py-12">
        <div class="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Quote Available</h3>
        <p class="text-sm text-gray-600 mb-6">
          This job doesn't have a quote yet. Import a quote spreadsheet to get started.
        </p>
        <button
          @click="showImportModal = true"
          class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Import First Quote
        </button>
      </div>
    </div>

    <!-- Import Modal -->
    <Dialog :open="showImportModal" @update:open="(open) => !open && (showImportModal = false)">
      <DialogContent class="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import Quote</DialogTitle>
          <DialogDescription>
            Import a new quote revision from an Excel spreadsheet
          </DialogDescription>
        </DialogHeader>
        
        <QuoteImportDialog
          :job-id="jobId"
          @success="handleImportSuccess"
          @cancel="handleImportCancel"
        />
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuoteImport } from '@/composables/useQuoteImport'
import QuoteImportDialog from '@/components/QuoteImportDialog.vue'
import QuoteCostLinesGrid from '@/components/quote/QuoteCostLinesGrid.vue'
import QuoteSummaryCard from '@/components/quote/QuoteSummaryCard.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Props {
  jobId: string
}

interface Emits {
  quoteImported: [result: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Modal state
const showImportModal = ref(false)

// Quote data management
const {
  isLoading,
  currentQuote,
  error,
  loadQuoteStatus
} = useQuoteImport()

// Computed properties
const quoteCostLines = computed(() => {
  return currentQuote.value?.quote?.cost_lines || []
})

// Event handlers
function handleImportSuccess(result: any) {
  console.log('Quote import successful:', result)
  showImportModal.value = false
  emit('quoteImported', result)
  // Reload quote status after successful import
  loadQuoteStatus(props.jobId)
}

function handleImportCancel() {
  console.log('Quote import cancelled')
  showImportModal.value = false
}

// Load initial data
onMounted(() => {
  loadQuoteStatus(props.jobId)
})

// Watch for job ID changes
watch(() => props.jobId, (newJobId) => {
  if (newJobId) {
    loadQuoteStatus(newJobId)
  }
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
