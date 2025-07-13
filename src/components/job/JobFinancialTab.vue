<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div class="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div class="text-sm font-medium text-blue-800">Estimate</div>
        <div class="text-2xl font-bold text-blue-900">{{ formatCurrency(estimateTotal) }}</div>
      </div>

      <div class="bg-green-50 rounded-lg p-4 border border-green-200">
        <div class="text-sm font-medium text-green-800">Time & Expenses</div>
        <div class="text-2xl font-bold text-green-900">{{ formatCurrency(timeAndExpenses) }}</div>
      </div>

      <div class="bg-orange-50 rounded-lg p-4 border border-orange-200">
        <div class="text-sm font-medium text-orange-800">Invoiced (Excl. Taxes)</div>
        <div class="text-2xl font-bold text-orange-900">{{ formatCurrency(invoiceTotal) }}</div>
      </div>

      <div class="bg-purple-50 rounded-lg p-4 border border-purple-200">
        <div class="text-sm font-medium text-purple-800">To Be Invoiced (Excl. Taxes)</div>
        <div class="text-2xl font-bold text-purple-900">{{ formatCurrency(toBeInvoiced) }}</div>
      </div>

      <div class="bg-red-50 rounded-lg p-4 border border-red-200" v-if="jobData?.delivery_date">
        <div class="text-sm font-medium text-red-800">Deadline</div>
        <div class="text-lg font-bold text-red-900">{{ formatDate(jobData.delivery_date) }}</div>
        <div class="text-sm text-red-600">{{ daysUntilDeadline }} days left</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Only show Quotes section for Fixed Price jobs -->
      <div
        v-if="jobData?.pricing_methodology !== 'time_materials'"
        class="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quotes</h3>

        <div v-if="!jobData?.quoted" class="text-center py-8">
          <div class="text-gray-500 mb-4">No quotes for this project</div>
          <button
            @click="createQuote"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Quote Job
          </button>
        </div>

        <div v-else class="space-y-4">
          <div class="border-l-4 border-blue-400 pl-4">
            <div class="text-sm text-gray-600">Quote Total</div>
            <div class="text-xl font-semibold text-gray-900">{{ formatCurrency(quoteTotal) }}</div>
            <div class="text-sm text-gray-500" v-if="jobData?.quote_acceptance_date">
              Accepted: {{ formatDate(jobData.quote_acceptance_date) }}
            </div>
          </div>

          <div class="flex space-x-2">
            <button
              @click="goToQuoteOnXero"
              v-if="quoteUrl"
              class="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Quote on Xero
            </button>

            <button
              @click="deleteQuoteOnXero"
              v-if="quoteUrl"
              class="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Quote on Xero
            </button>

            <button
              @click="acceptQuote"
              v-if="!jobData?.quote_acceptance_date"
              class="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              Accept Quote
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Invoices</h3>

        <div v-if="!jobData?.invoiced" class="text-center py-8">
          <div class="text-gray-500 mb-4">No invoices for this project</div>
          <button
            @click="createInvoice"
            class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Create Invoice
          </button>
        </div>

        <div v-else class="space-y-4">
          <div class="border-l-4 border-orange-400 pl-4">
            <div class="text-sm text-gray-600">Invoice Total (Excl. Taxes)</div>
            <div class="text-xl font-semibold text-gray-900">
              {{ formatCurrency(invoiceTotal) }}
            </div>
            <div class="text-sm text-gray-500">Status: {{ jobData?.paid ? 'Paid' : 'Unpaid' }}</div>
          </div>

          <div class="flex space-x-2">
            <button
              @click="goToInvoiceOnXero"
              v-if="invoiceUrl"
              class="px-3 py-2 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Go to Invoice on Xero
            </button>

            <button
              @click="deleteInvoiceOnXero"
              v-if="invoiceUrl"
              class="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete Invoice on Xero
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { debugLog } from '../../utils/debug'
import { computed } from 'vue'
import axios from 'axios'
import { toast } from 'vue-sonner'
import { XeroSyncResponseSchema, type JobWithFinancialData } from '../../api/local/schemas'

interface Props {
  jobData: JobWithFinancialData | null
  latestPricings?: Record<string, unknown>
  jobId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'quote-created': []
  'quote-accepted': []
  'invoice-created': []
}>()

const estimateTotal = computed(() => {
  return props.jobData?.latest_estimate?.summary?.rev || 0
})

const timeAndExpenses = computed(() => {
  const costLines = props.jobData?.latest_actual?.cost_lines
  return (
    costLines?.reduce((sum, line) => {
      return sum + (line.total_rev || 0)
    }, 0) || 0
  )
})

const toBeInvoiced = computed(() => {
  const actualTotal = props.jobData?.latest_actual?.summary?.rev || 0
  const invoiced = invoiceTotal.value
  return Math.max(0, actualTotal - invoiced)
})

const quoteTotal = computed(() => {
  return props.jobData?.quote?.total_excl_tax || 0
})

const invoiceTotal = computed(() => {
  return props.jobData?.invoice?.total_excl_tax || 0
})

const daysUntilDeadline = computed(() => {
  if (!props.jobData?.delivery_date) return 0

  const deliveryDate = new Date(props.jobData.delivery_date)
  const today = new Date()
  const diffTime = deliveryDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
})

const quoteUrl = computed(() => {
  return props.jobData?.quote?.online_url || null
})

const invoiceUrl = computed(() => {
  return props.jobData?.invoice?.online_url || null
})

const formatCurrency = (amount: number | undefined | null): string => {
  const numericAmount = Number(amount)
  if (isNaN(numericAmount) || amount === null || amount === undefined) {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(0)
  }
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(numericAmount)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const createQuote = async () => {
  if (!props.jobData?.id) return
  try {
    const response = await axios.post(`/api/xero/create_quote/${props.jobData.id}`)
    const validatedResponse = XeroSyncResponseSchema.parse(response.data)
    if (!validatedResponse.success) {
      debugLog(validatedResponse.error || 'Failed to create quote')
      return
    }
    toast.success('Quote created successfully!')
    emit('quote-created')
  } catch (err) {
    debugLog('Error creating quote:', err)
    toast.error('Failed to create quote.')
  }
}

const acceptQuote = () => {
  if (props.jobData) {
    emit('quote-accepted')
  }
}

const createInvoice = async () => {
  if (!props.jobData?.id) return
  try {
    const response = await axios.post(`/api/xero/create_invoice/${props.jobData.id}`)
    const validatedResponse = XeroSyncResponseSchema.parse(response.data)
    if (!validatedResponse.success) {
      debugLog(validatedResponse.error || 'Failed to create invoice')
      return
    }
    toast.success('Invoice created successfully!')
    emit('invoice-created')
  } catch (err) {
    debugLog('Error creating invoice:', err)
    toast.error('Failed to create invoice.')
  }
}

const goToQuoteOnXero = () => {
  if (quoteUrl.value && quoteUrl.value !== '#') {
    window.open(quoteUrl.value, '_blank')
  }
}

const deleteQuoteOnXero = async () => {
  if (!props.jobData?.id) return
  try {
    const response = await axios.post(`/api/xero/delete_quote/${props.jobData.id}`)
    const validatedResponse = XeroSyncResponseSchema.parse(response.data)
    if (!validatedResponse.success) {
      debugLog(validatedResponse.error || 'Failed to delete quote')
      return
    }
    toast.success('Quote deleted successfully!')
  } catch (err) {
    debugLog('Error deleting quote:', err)
    toast.error('Failed to delete quote.')
  }
}

const goToInvoiceOnXero = () => {
  if (invoiceUrl.value && invoiceUrl.value !== '#') {
    window.open(invoiceUrl.value, '_blank')
  }
}

const deleteInvoiceOnXero = async () => {
  if (!props.jobData?.id) return
  try {
    const response = await axios.post(`/api/xero/delete_invoice/${props.jobData.id}`)
    const validatedResponse = XeroSyncResponseSchema.parse(response.data)
    if (!validatedResponse.success) {
      debugLog(validatedResponse.error || 'Failed to delete invoice')
      return
    }
    toast.success('Invoice deleted successfully!')
  } catch (err) {
    debugLog('Error deleting invoice:', err)
    toast.error('Failed to delete invoice.')
  }
}
</script>
