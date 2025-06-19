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
          :job="jobData"
          @quote-refreshed="handleQuoteRefreshed"
          class="h-full"
        />
      </div>
    </div>

    <!-- No Quote State -->
    <div v-else class="flex-1">
      <QuoteSummaryCard 
        :quote-data="null" 
        :is-loading="isLoading"
        :job="jobData"
        @quote-refreshed="handleQuoteRefreshed"
        class="h-full"
      />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useQuoteImport } from '@/composables/useQuoteImport'
import QuoteCostLinesGrid from '@/components/quote/QuoteCostLinesGrid.vue'
import QuoteSummaryCard from '@/components/quote/QuoteSummaryCard.vue'

interface Props {
  jobId: string
  jobData?: any // Add jobData prop
}

interface Emits {
  quoteImported: [result: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

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
function handleQuoteRefreshed(result: any) {
  console.log('Quote refreshed:', result)
  // Reload quote status after successful refresh
  loadQuoteStatus(props.jobId)
  emit('quoteImported', result)
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
