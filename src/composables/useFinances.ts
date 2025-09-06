import { computed, ref, watch } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'
import { api } from '../api/client'
import { schemas } from '../api/generated/api'
import { AxiosError } from 'axios'
import { debugLog } from '../utils/debug'

type Job = z.infer<typeof schemas.Job>
type Invoice = z.infer<typeof schemas.Invoice>

interface UseFinancesProps {
  jobData: Job | null
  jobId?: string
}

interface UseFinancesEmits {
  'quote-created': () => void
  'quote-accepted': () => void
  'invoice-created': () => void
  'quote-deleted': () => void
  'invoice-deleted': () => void
}

export function useFinances(props: UseFinancesProps, emit?: UseFinancesEmits) {
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
      return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(0)
    }
    return new Intl.NumberFormat('en-NZ', { style: 'currency', currency: 'NZD' }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-NZ', {
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
      emit?.['quote-created']?.()
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
        emit?.['quote-accepted']?.()
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
      emit?.['quote-deleted']?.()
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
      emit?.['invoice-created']?.()
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
      emit?.['invoice-deleted']?.()
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

  return {
    // Financial metrics
    estimateTotal,
    timeAndExpenses,
    invoiceTotal,
    toBeInvoiced,
    quoteTotal,
    daysUntilDeadline,
    quoteUrl,

    // Invoice management
    invoices,
    isCreatingInvoice,
    deletingInvoiceId,

    // Quote operations
    isQuoteDeleted,
    isDeletingQuote,
    isCreatingQuote,
    isAcceptingQuote,

    // Actions
    createQuote,
    acceptQuote,
    deleteQuoteOnXero,
    goToQuoteOnXero,

    createInvoice,
    goToInvoiceOnXero,
    deleteInvoiceOnXero,

    // Formatting
    formatCurrency,
    formatDate,
  }
}
