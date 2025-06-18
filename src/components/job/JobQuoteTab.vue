<template>
  <div class="job-quote-tab h-full flex flex-col">
    <!-- Header -->
    <div class="flex-shrink-0 mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Quote Management</h2>
      <p class="text-gray-600">
        Import quote spreadsheets and manage quote revisions for this job.
      </p>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto space-y-6">
      <!-- Current Quote Status -->
      <div class="bg-white border border-gray-200 rounded-lg">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Current Quote Status</h3>
          <QuoteStatus
            :job-id="jobId"
            :auto-refresh="true"
            @quote-updated="handleQuoteUpdated"
          />
        </div>
      </div>

      <!-- Import New Quote -->
      <div class="bg-white border border-gray-200 rounded-lg">
        <div class="p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Import New Quote</h3>
            <div class="flex items-center space-x-2 text-sm text-gray-500">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Upload .xlsx or .xls files</span>
            </div>
          </div>

          <QuoteImportDialog
            :job-id="jobId"
            @success="handleImportSuccess"
            @cancel="handleImportCancel"
          />
        </div>
      </div>

      <!-- Recent Import History (Optional - can be implemented later) -->
      <div v-if="showImportHistory" class="bg-white border border-gray-200 rounded-lg">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Imports</h3>
          <div class="text-gray-500 text-center py-8">
            <svg class="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>Import history will be displayed here</p>
            <p class="text-sm mt-1">Feature coming soon</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import QuoteStatus from '@/components/QuoteStatus.vue'
import QuoteImportDialog from '@/components/QuoteImportDialog.vue'

interface Props {
  jobId: string
}

interface Emits {
  quoteImported: [result: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Feature flags
const showImportHistory = ref(false) // Set to true when we implement import history

// Event handlers
function handleQuoteUpdated() {
  // Quote status component handles its own updates
  console.log('Quote status updated')
}

function handleImportSuccess(result: any) {
  console.log('Quote import successful:', result)
  emit('quoteImported', result)
}

function handleImportCancel() {
  console.log('Quote import cancelled')
}
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
