import { ref, computed } from 'vue'
import { quoteService } from '@/services/quote.service'
import { debugLog } from '@/utils/debug'
import { z } from 'zod'
import { schemas } from '@/api/generated/api'

type PreviewQuoteResponse = z.infer<typeof schemas.PreviewQuoteResponse>
type ApplyQuoteResponse = z.infer<typeof schemas.ApplyQuoteResponse>
type QuoteImportStatusResponse = z.infer<typeof schemas.QuoteImportStatusResponse>

type ValidationIssue = {
  severity?: string | null
}

type QuotePreviewValidation = {
  issues?: ValidationIssue[] | null
} | null

type QuotePreviewDiff = {
  total_changes?: number | null
  next_revision?: number | null
} | null

type QuotePreviewDetails = {
  can_proceed?: boolean
  validation_report?: QuotePreviewValidation
  diff_preview?: QuotePreviewDiff
  error?: string | null
} | null

type PreviewQuoteResponseWithDetails = PreviewQuoteResponse & {
  preview?: QuotePreviewDetails
}

function toValidationIssues(value: QuotePreviewValidation): ValidationIssue[] {
  if (Array.isArray(value?.issues)) {
    return value?.issues ?? []
  }
  return []
}

export function useQuoteImport() {
  const isLoading = ref(false)
  const previewData = ref<PreviewQuoteResponseWithDetails | null>(null)
  const importResult = ref<ApplyQuoteResponse | null>(null)
  const currentQuote = ref<QuoteImportStatusResponse | null>(null)
  const error = ref<string | null>(null)

  const previewDetails = computed(() => previewData.value?.preview ?? null)
  const validationIssues = computed(() =>
    toValidationIssues(previewDetails.value?.validation_report ?? null),
  )
  const diffPreview = computed(() => previewDetails.value?.diff_preview ?? null)

  const canProceed = computed(() => {
    return previewDetails.value?.can_proceed === true
  })

  const hasValidationIssues = computed(() => {
    return validationIssues.value.length > 0
  })

  const hasErrors = computed(() => {
    return validationIssues.value.some((issue) => issue.severity === 'error')
  })

  const hasWarnings = computed(() => {
    return validationIssues.value.some((issue) => issue.severity === 'warning')
  })

  const totalChanges = computed(() => {
    return diffPreview.value?.total_changes ?? 0
  })

  const nextRevision = computed(() => {
    return diffPreview.value?.next_revision ?? 1
  })

  const importWasSuccessful = computed(() => {
    return importResult.value?.success === true
  })

  async function loadQuoteStatus(jobId: string) {
    isLoading.value = true
    error.value = null

    try {
      debugLog('🔍 [useQuoteImport] Loading quote status for jobId:', jobId)
      currentQuote.value = await quoteService.getQuoteStatus(jobId)
      debugLog('✅ [useQuoteImport] Quote status loaded:', currentQuote.value)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load quote status'
      debugLog('❌ [useQuoteImport] Failed to load quote status:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function previewImport(jobId: string, file: File) {
    isLoading.value = true
    error.value = null
    previewData.value = null

    try {
      previewData.value = (await quoteService.previewQuoteImport(
        jobId,
        file,
      )) as PreviewQuoteResponseWithDetails

      const preview = previewDetails.value
      if (preview?.error) {
        error.value = preview.error
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Preview failed'
      previewData.value = null
      debugLog('Preview import failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function executeImport(jobId: string, file: File, skipValidation = false) {
    isLoading.value = true
    error.value = null
    importResult.value = null

    try {
      importResult.value = await quoteService.importQuote(jobId, file, skipValidation)

      if (!importResult.value.success && importResult.value.error) {
        error.value = importResult.value.error
      }

      if (importResult.value.success) {
        await loadQuoteStatus(jobId)
      }
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Import failed'
      importResult.value = null
      debugLog('Execute import failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  function reset() {
    previewData.value = null
    importResult.value = null
    error.value = null
    isLoading.value = false
  }

  function clearError() {
    error.value = null
  }

  return {
    isLoading,
    previewData,
    importResult,
    currentQuote,
    error,

    canProceed,
    hasValidationIssues,
    hasErrors,
    hasWarnings,
    totalChanges,
    nextRevision,
    importWasSuccessful,

    loadQuoteStatus,
    previewImport,
    executeImport,
    reset,
    clearError,
  }
}
