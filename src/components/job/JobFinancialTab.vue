<template>
  <div class="space-y-6">
    <!-- Financial Overview Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <!-- Estimate -->
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div class="text-sm font-medium text-blue-800">Estimate</div>
        <div class="text-2xl font-bold text-blue-900">{{ formatCurrency(estimateTotal) }}</div>
      </div>

      <!-- Time & Expenses -->
      <div class="bg-green-50 rounded-lg p-4 border border-green-200">
        <div class="text-sm font-medium text-green-800">Time & Expenses</div>
        <div class="text-2xl font-bold text-green-900">{{ formatCurrency(timeAndExpenses) }}</div>
      </div>

      <!-- Invoiced -->
      <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div class="text-sm font-medium text-orange-800">Invoiced</div>
        <div class="text-2xl font-bold text-orange-900">{{ formatCurrency(invoicedAmount) }}</div>
      </div>

      <!-- To Be Invoiced -->
      <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div class="text-sm font-medium text-purple-800">To Be Invoiced</div>
        <div class="text-2xl font-bold text-purple-900">{{ formatCurrency(toBeInvoiced) }}</div>
      </div>

      <!-- Deadline -->
      <div class="bg-red-50 rounded-lg p-4 border border-red-200" v-if="jobData?.delivery_date">
        <div class="text-sm font-medium text-red-800">Deadline</div>
        <div class="text-lg font-bold text-red-900">{{ formatDate(jobData.delivery_date) }}</div>
        <div class="text-sm text-red-600">{{ daysUntilDeadline }} days left</div>
      </div>
    </div>

    <!-- Quotes and Invoices Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Quotes Section -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quotes</h3>
        
        <div v-if="!jobData?.quoted" class="text-center py-8">
          <div class="text-gray-500 mb-4">No quotes for this project</div>
          <button @click="createQuote" 
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
            Quote Job
          </button>
        </div>

        <div v-else class="space-y-4">
          <!-- Quote Information -->
          <div class="border-l-4 border-blue-400 pl-4">
            <div class="text-sm text-gray-600">Quote Total</div>
            <div class="text-xl font-semibold text-gray-900">{{ formatCurrency(quoteTotal) }}</div>
            <div class="text-sm text-gray-500" v-if="jobData?.quote_acceptance_date">
              Accepted: {{ formatDate(jobData.quote_acceptance_date) }}
            </div>
          </div>

          <!-- Quote Actions -->
          <div class="flex space-x-2">
            <button @click="goToQuoteOnXero" v-if="quoteUrl"
              class="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Go to Quote on Xero
            </button>
            
            <button @click="deleteQuoteOnXero" v-if="quoteUrl"
              class="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">
              Delete Quote on Xero
            </button>

            <button @click="acceptQuote" v-if="!jobData?.quote_acceptance_date"
              class="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700">
              Accept Quote
            </button>
          </div>
        </div>
      </div>

      <!-- Invoices Section -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Invoices</h3>
        
        <div v-if="!jobData?.invoiced" class="text-center py-8">
          <div class="text-gray-500 mb-4">No invoices for this project</div>
          <button @click="createInvoice" 
            class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500">
            Create Invoice
          </button>
        </div>

        <div v-else class="space-y-4">
          <!-- Invoice Information -->
          <div class="border-l-4 border-orange-400 pl-4">
            <div class="text-sm text-gray-600">Invoice Total</div>
            <div class="text-xl font-semibold text-gray-900">{{ formatCurrency(invoiceTotal) }}</div>
            <div class="text-sm text-gray-500">
              Status: {{ jobData?.paid ? 'Paid' : 'Unpaid' }}
            </div>
          </div>

          <!-- Invoice Actions -->
          <div class="flex space-x-2">
            <button @click="goToInvoiceOnXero" v-if="invoiceUrl"
              class="px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700">
              Go to Invoice on Xero
            </button>
            
            <button @click="deleteInvoiceOnXero" v-if="invoiceUrl"
              class="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700">
              Delete Invoice on Xero
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { JobData } from '@/services/jobRestService'

// Props
interface Props {
  jobData: JobData | null
  latestPricings?: any // TODO: Add proper typing for pricing data
}

const props = defineProps<Props>()

// Events
const emit = defineEmits<{
  'quote-created': []
  'quote-accepted': []
  'invoice-created': []
  'workflow-updated': [data: Partial<JobData>]
}>()

// Computed properties for financial data
const estimateTotal = computed(() => {
  // TODO: Calculate from latest_pricings.estimate_pricing
  return 0
})

const timeAndExpenses = computed(() => {
  // TODO: Calculate sum of time entries and material entries from reality pricing
  return 0
})

const invoicedAmount = computed(() => {
  // TODO: Get actual invoiced amount from Xero integration
  return 0
})

const toBeInvoiced = computed(() => {
  return timeAndExpenses.value - invoicedAmount.value
})

const quoteTotal = computed(() => {
  // TODO: Calculate from latest_pricings.quote_pricing
  return 0
})

const invoiceTotal = computed(() => {
  // TODO: Get actual invoice total from Xero integration
  return 0
})

const daysUntilDeadline = computed(() => {
  if (!props.jobData?.delivery_date) return 0
  
  const deliveryDate = new Date(props.jobData.delivery_date)
  const today = new Date()
  const diffTime = deliveryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays
})

// Placeholder URLs - these would come from the job data
const quoteUrl = computed(() => {
  // TODO: Get from job data or API
  return props.jobData?.quoted ? '#' : null
})

const invoiceUrl = computed(() => {
  // TODO: Get from job data or API
  return props.jobData?.invoiced ? '#' : null
})

// Helper functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD'
  }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Action methods
const createQuote = () => {
  // TODO: Integrate with Xero API to create quote
  console.log('Creating quote...')
  emit('quote-created')
}

const acceptQuote = () => {
  if (props.jobData) {
    const updatedData = {
      ...props.jobData,
      quote_acceptance_date: new Date().toISOString()
    }
    emit('workflow-updated', updatedData)
    emit('quote-accepted')
  }
}

const createInvoice = () => {
  // TODO: Integrate with Xero API to create invoice
  console.log('Creating invoice...')
  emit('invoice-created')
}

const goToQuoteOnXero = () => {
  if (quoteUrl.value && quoteUrl.value !== '#') {
    window.open(quoteUrl.value, '_blank')
  }
}

const deleteQuoteOnXero = () => {
  // TODO: Integrate with Xero API to delete quote
  console.log('Deleting quote...')
}

const goToInvoiceOnXero = () => {
  if (invoiceUrl.value && invoiceUrl.value !== '#') {
    window.open(invoiceUrl.value, '_blank')
  }
}

const deleteInvoiceOnXero = () => {
  // TODO: Integrate with Xero API to delete invoice
  console.log('Deleting invoice...')
}
</script>
