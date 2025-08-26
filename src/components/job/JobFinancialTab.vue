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
      <div
        v-if="jobData?.pricing_methodology !== 'time_materials'"
        class="bg-white rounded-lg border border-gray-200 p-6"
      >
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Quotes</h3>

        <div v-if="!jobData?.quoted || isQuoteDeleted" class="text-center py-8">
          <div class="text-gray-500 mb-4">No quotes for this project</div>
          <button
            @click="createQuote"
            :disabled="isCreatingQuote"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              v-if="isCreatingQuote"
              class="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isCreatingQuote ? 'Creating...' : 'Quote Job' }}
          </button>
        </div>

        <div v-else-if="!isQuoteDeleted" class="space-y-4">
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
              :disabled="isDeletingQuote"
              class="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg
                v-if="isDeletingQuote"
                class="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isDeletingQuote ? 'Deleting...' : 'Delete Quote on Xero' }}
            </button>
            <button
              @click="acceptQuote"
              v-if="!jobData?.quote_acceptance_date"
              :disabled="isAcceptingQuote"
              class="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg
                v-if="isAcceptingQuote"
                class="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {{ isAcceptingQuote ? 'Accepting...' : 'Accept Quote' }}
            </button>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Manage invoices for this job.</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="invoices.length === 0" class="text-center py-8">
            <div class="text-gray-500 mb-4">No invoices for this project</div>
          </div>
          <Table v-else>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">Total</TableHead>
                <TableHead class="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="invoice in invoices" :key="invoice.id">
                <TableCell class="font-medium">{{ invoice.number }}</TableCell>
                <TableCell>{{ formatDate(invoice.date) }}</TableCell>
                <TableCell>
                  <Badge :variant="invoice.status === 'PAID' ? 'default' : 'secondary'">{{
                    invoice.status
                  }}</Badge>
                </TableCell>
                <TableCell class="text-right">{{
                  formatCurrency(invoice.total_incl_tax)
                }}</TableCell>
                <TableCell class="text-right">
                  <div class="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      @click="goToInvoiceOnXero(invoice.online_url)"
                      :disabled="!invoice.online_url"
                    >
                      <ExternalLink class="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      @click="deleteInvoiceOnXero(invoice.xero_id)"
                      :disabled="!!deletingInvoiceId"
                    >
                      <svg
                        v-if="deletingInvoiceId === invoice.xero_id"
                        class="animate-spin h-4 w-4"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          class="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          stroke-width="4"
                        ></circle>
                        <path
                          class="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <Trash2 v-else class="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter class="flex justify-center border-t pt-6" v-if="!jobData?.fully_invoiced">
          <button
            @click="createInvoice"
            :disabled="isCreatingInvoice"
            class="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg
              v-if="isCreatingInvoice"
              class="animate-spin -ml-1 mr-1 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {{ isCreatingInvoice ? 'Creating...' : 'Create Invoice' }}
          </button>
        </CardFooter>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { api } from '@/api/client'
import { schemas } from '@/api/generated/api'
import { AxiosError } from 'axios'
import { debugLog } from '../../utils/debug'

// ShadCN component imports (assuming this is your setup)
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ExternalLink, Trash2 } from 'lucide-vue-next'

type Job = z.infer<typeof schemas.Job>
type Invoice = z.infer<typeof schemas.Invoice>

interface Props {
  jobData: Job | null
  latestPricings?: Record<string, unknown>
  jobId?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'quote-created': []
  'quote-accepted': []
  'invoice-created': []
  'quote-deleted': []
  'invoice-deleted': []
}>()

// --- STATE MANAGEMENT ---
// Local state for quotes
const isQuoteDeleted = ref(false)
const isDeletingQuote = ref(false)
const isCreatingQuote = ref(false)
const isAcceptingQuote = ref(false)

// Local state for invoices
const isCreatingInvoice = ref(false)
const deletingInvoiceId = ref<string | null>(null) // Track which invoice is being deleted

// --- COMPUTED PROPERTIES ---
const invoices = ref<Array<Invoice>>([])
const estimateTotal = computed(() => props.jobData?.latest_estimate?.summary?.rev || 0)
const timeAndExpenses = computed(() => {
  const costLines = props.jobData?.latest_actual?.cost_lines
  return costLines?.reduce((sum, line) => sum + (line.total_rev || 0), 0) || 0
})

const invoiceTotal = computed(() => {
  if (!invoices.value.length) return 0
  return invoices.value.reduce((sum, invoice) => sum + (invoice.total_excl_tax || 0), 0)
})

const toBeInvoiced = computed(() => {
  const actualTotal = props.jobData?.latest_actual?.summary?.rev || 0
  return Math.max(0, actualTotal - invoiceTotal.value)
})

const quoteTotal = computed(() => {
  if (isQuoteDeleted.value) return 0
  return props.jobData?.quote?.total_excl_tax || 0
})

const daysUntilDeadline = computed(() => {
  if (!props.jobData?.delivery_date) return 0
  const deliveryDate = new Date(props.jobData.delivery_date)
  const today = new Date()
  const diffTime = deliveryDate.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

const quoteUrl = computed(() => {
  if (isQuoteDeleted.value) return null
  return props.jobData?.quote?.online_url || null
})

// --- FORMATTING FUNCTIONS ---
const formatCurrency = (amount: number | undefined | null): string => {
  if (amount === null || amount === undefined) {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(0)
  }
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(amount)
}

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// --- QUOTE METHODS ---
const createQuote = async () => {
  if (!props.jobData?.id || isCreatingQuote.value) return
  isCreatingQuote.value = true
  try {
    const response = await api.api_xero_create_quote_create(undefined, {
      params: { job_id: props.jobData.id },
    })
    if (!response.success) {
      debugLog(response.error || 'Failed to create quote')
      return
    }
    toast.success('Quote created successfully!')
    isQuoteDeleted.value = false
    emit('quote-created')
  } catch (err) {
    debugLog('Error creating quote:', err)
    toast.error('Failed to create quote.')
  } finally {
    isCreatingQuote.value = false
  }
}

const acceptQuote = async () => {
  if (!props.jobData?.id || isAcceptingQuote.value) return
  isAcceptingQuote.value = true
  try {
    const response = await api.job_rest_jobs_quote_accept_create(undefined, {
      params: { job_id: props.jobData.id },
    })
    if (response.success) {
      toast.success('Quote accepted successfully!')
      emit('quote-accepted')
    } else {
      toast.error('Failed to accept quote')
    }
  } catch (err) {
    debugLog('Error accepting quote:', err)
    toast.error('Failed to accept quote.')
  } finally {
    isAcceptingQuote.value = false
  }
}

const goToQuoteOnXero = () => {
  if (quoteUrl.value && quoteUrl.value !== '#') {
    window.open(quoteUrl.value, '_blank')
  }
}

const deleteQuoteOnXero = async () => {
  if (!props.jobData?.id || isDeletingQuote.value) return
  isDeletingQuote.value = true
  try {
    const response = await api.api_xero_delete_quote_destroy(undefined, {
      params: { job_id: props.jobData.id },
    })
    if (!response.success) {
      debugLog(response.error || 'Failed to delete quote')
      return
    }
    isQuoteDeleted.value = true
    toast.success('Quote deleted successfully!')
    emit('quote-deleted')
  } catch (err) {
    debugLog('Error deleting quote:', err)
    toast.error('Failed to delete quote.')
  } finally {
    isDeletingQuote.value = false
  }
}

// --- INVOICE METHODS ---
const createInvoice = async () => {
  if (!props.jobData?.id || isCreatingInvoice.value) return
  isCreatingInvoice.value = true
  try {
    const response = await api.api_xero_create_invoice_create(undefined, {
      params: { job_id: props.jobData.id },
    })
    if (!response.success) {
      debugLog(response.error || 'Failed to create invoice')
      return
    }
    toast.success('Invoice created successfully!')
    emit('invoice-created')
  } catch (err: unknown) {
    let msg = 'Unexpected error while trying to create invoice.'
    debugLog('Error creating invoice:', err)
    if ((err as AxiosError).isAxiosError) {
      const axiosErr = err as AxiosError<{ message: string }>
      msg = axiosErr.response?.data?.message ?? msg
    }
    toast.error(`Failed to create invoice: ${msg}`)
  } finally {
    isCreatingInvoice.value = false
  }
}

const goToInvoiceOnXero = (url: string | null | undefined) => {
  if (url && url !== '#') {
    window.open(url, '_blank')
  } else {
    toast.error('No online URL available for this invoice.')
  }
}

const deleteInvoiceOnXero = async (invoiceXeroId: string) => {
  if (!props.jobData?.id || deletingInvoiceId.value) return
  deletingInvoiceId.value = invoiceXeroId
  try {
    const response = await api.api_xero_delete_invoice_destroy(undefined, {
      params: { job_id: props.jobData.id },
      queries: { xero_invoice_id: invoiceXeroId },
    })
    toast.success('Invoice deleted successfully!')
    emit('invoice-deleted')
    invoices.value = invoices.value.filter((invoice) => invoice.xero_id !== response.xero_id)
  } catch (err) {
    debugLog('Error deleting invoice:', err)
    toast.error('Failed to delete invoice.')
  } finally {
    deletingInvoiceId.value = null
  }
}

// --- WATCHERS ---
watch(
  () => props.jobData?.id,
  (newJobId) => {
    if (newJobId) {
      isQuoteDeleted.value = false
      deletingInvoiceId.value = null
    }
  },
)

watch(
  () => props.jobData?.invoices,
  (newInvoices) => {
    // Create a copy of the array to ensure we don't mutate the prop
    invoices.value = newInvoices ? [...newInvoices] : []
  },
  { immediate: true, deep: true }, // immediate: true runs the watcher on component mount
)

watch(
  () => props.jobData?.quoted,
  (isQuoted) => {
    if (isQuoted && isQuoteDeleted.value) {
      isQuoteDeleted.value = false
    }
  },
)
</script>
