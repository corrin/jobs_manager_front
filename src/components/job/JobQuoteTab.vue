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
      </div>
    </div>

    <div v-if="currentQuote?.has_quote" class="flex-1 flex gap-6 min-h-0">
      <div class="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col">
        <div class="flex-shrink-0 p-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Quote Details</h3>
        </div>
        <div class="flex-1 overflow-hidden">
          <QuoteCostLinesGrid :cost-lines="quoteCostLines" :is-loading="isLoading" />
        </div>
      </div>

      <div class="flex-1">
        <QuoteSummaryCard
          :quote-data="currentQuote.quote"
          :is-loading="isLoading"
          :job="jobData as Job"
          @quote-refreshed="handleQuoteRefreshed"
          class="h-full"
        />
      </div>
    </div>

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
import type { Job, QuoteOperationResult, QuoteSheet } from '@/types'

interface Props {
  jobId: string
  jobData?: Job
}

interface Emits {
  quoteImported: [result: QuoteOperationResult]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentQuote = computed(() => {
  const jobData = props.jobData as unknown

  type QuoteData = {
    id: string
    kind: 'quote'
    rev: number
    created: string
    summary: { cost: number; rev: number; hours: number }
    cost_lines: import('@/schemas/costing.schemas').CostLine[]
  }
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

const quoteCostLines = computed(() => {
  const lines = currentQuote.value?.quote?.cost_lines || []
  console.log('💰 [JobQuoteTab] quoteCostLines computed:', lines)
  return lines
})

function handleQuoteRefreshed(
  data: QuoteOperationResult | (QuoteSheet & { shouldReloadJob: boolean }),
) {
  console.log('🔄 [JobQuoteTab] Quote refreshed:', data)
  emit('quoteImported', data as QuoteOperationResult)
}

onMounted(() => {
  console.log('🚀 [JobQuoteTab] Component mounted, jobId:', props.jobId)
  console.log('📊 [JobQuoteTab] Initial jobData:', props.jobData)
})

watch(
  () => props.jobData,
  (newJobData) => {
    console.log('👀 [JobQuoteTab] Job data changed:', newJobData)
  },
  { deep: true },
)

watch(
  currentQuote,
  (newQuote) => {
    console.log('📊 [JobQuoteTab] currentQuote updated:', newQuote)
  },
  { deep: true },
)
</script>

<style scoped></style>
