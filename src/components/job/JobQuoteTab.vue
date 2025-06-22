<template>
  <div class="job-quote-tab h-full flex flex-col">
    <!-- Header -->
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
          <QuoteCostLinesGrid :cost-lines="quoteCostLines" :is-loading="isLoading" />
        </div>
      </div>

      <!-- Right Column: Summary (50%) -->
      <div class="flex-1">
        <QuoteSummaryCard
          :quote-data="currentQuote.quote"
          :is-loading="isLoading"
          :job="jobData as any"
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
import QuoteCostLinesGrid from '@/components/quote/QuoteCostLinesGrid.vue'
import QuoteSummaryCard from '@/components/quote/QuoteSummaryCard.vue'
import type { Job, QuoteOperationResult } from '@/types'

interface Props {
  jobId: string
  jobData?: Job // Usar tipo Job central ao invés de Record
}

interface Emits {
  quoteImported: [result: QuoteOperationResult]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Use jobData directly instead of separate API call for basic quote info
const currentQuote = computed(() => {
  const jobData = props.jobData as unknown

  // Type guard para garantir que jobData tem a estrutura esperada
  type QuoteData = { id: string }
  type JobData = { latest_quote?: QuoteData; latest_quote_pricing?: { id: string } }
  const isJobData = (data: unknown): data is JobData => typeof data === 'object' && data !== null

  if (!isJobData(jobData)) {
    return { has_quote: false, quote: null }
  }

  console.log('🔍 [JobQuoteTab] Debug jobData structure:', {
    hasJobData: !!props.jobData,
    hasLatestQuote: !!jobData.latest_quote,
    hasLatestQuotePricing: !!jobData.latest_quote_pricing,
    latestQuoteId: jobData.latest_quote?.id,
    latestQuotePricingId: jobData.latest_quote_pricing?.id,
  })

  if (!jobData.latest_quote) {
    console.log('📊 [JobQuoteTab] No quote data in jobData')
    return { has_quote: false, quote: null }
  }

  const quoteData = jobData.latest_quote
  console.log('📊 [JobQuoteTab] Using quote data from jobData:', quoteData)

  return {
    has_quote: true,
    quote: {
      id: quoteData.id,
      kind: 'quote' as const,
      rev: quoteData.rev,
      created: quoteData.created,
      summary: quoteData.summary,
      cost_lines: quoteData.cost_lines || [],
    },
  }
})

const isLoading = ref(false)

// Computed properties
const quoteCostLines = computed(() => {
  const lines = currentQuote.value?.quote?.cost_lines || []
  console.log('💰 [JobQuoteTab] quoteCostLines computed:', lines)
  return lines
})

// Event handlers
function handleQuoteRefreshed(result: QuoteOperationResult) {
  console.log('🔄 [JobQuoteTab] Quote refreshed:', result)
  emit('quoteImported', result)
}

// Load initial data
onMounted(() => {
  console.log('🚀 [JobQuoteTab] Component mounted, jobId:', props.jobId)
  console.log('📊 [JobQuoteTab] Initial jobData:', props.jobData)
})

// Watch for job data changes
watch(
  () => props.jobData,
  (newJobData) => {
    console.log('👀 [JobQuoteTab] Job data changed:', newJobData)
  },
  { deep: true },
)

// Watch for currentQuote changes
watch(
  currentQuote,
  (newQuote) => {
    console.log('📊 [JobQuoteTab] currentQuote updated:', newQuote)
  },
  { deep: true },
)
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
