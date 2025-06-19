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

// Use jobData directly instead of separate API call for basic quote info
const currentQuote = computed(() => {
  if (!props.jobData?.latest_quote_pricing) {
    console.log('📊 [JobQuoteTab] No quote pricing data in jobData')
    return { has_quote: false, quote: null }
  }
  
  const quoteData = props.jobData.latest_quote_pricing
  console.log('📊 [JobQuoteTab] Using quote data from jobData:', quoteData)
  
  return {
    has_quote: true,
    quote: {
      id: quoteData.id,
      kind: 'quote' as const,
      rev: quoteData.revision_number || 1,
      created: quoteData.created_at,
      summary: {
        cost: quoteData.total_cost || 0,
        rev: quoteData.total_revenue || 0,
        hours: quoteData.total_hours || 0
      },
      cost_lines: quoteData.cost_lines || []
    }
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
function handleQuoteRefreshed(result: any) {
  console.log('🔄 [JobQuoteTab] Quote refreshed:', result)
  emit('quoteImported', result)
}

// Load initial data
onMounted(() => {
  console.log('🚀 [JobQuoteTab] Component mounted, jobId:', props.jobId)
  console.log('📊 [JobQuoteTab] Initial jobData:', props.jobData)
})

// Watch for job data changes
watch(() => props.jobData, (newJobData) => {
  console.log('👀 [JobQuoteTab] Job data changed:', newJobData)
}, { deep: true })

// Watch for currentQuote changes
watch(currentQuote, (newQuote) => {
  console.log('📊 [JobQuoteTab] currentQuote updated:', newQuote)
}, { deep: true })
</script>

<style scoped>
/* Additional custom styles if needed */
</style>
