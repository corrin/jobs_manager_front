import { ref, computed } from 'vue'
import { 
  quoteImportService, 
  type QuoteImportPreviewResponse, 
  type QuoteImportResponse,
  type QuoteStatusResponse 
} from '@/services/quoteImportService'

export function useQuoteImport() {
  const isLoading = ref(false)
  const previewData = ref<QuoteImportPreviewResponse | null>(null)
  const importResult = ref<QuoteImportResponse | null>(null)
  const currentQuote = ref<QuoteStatusResponse | null>(null)
  const error = ref<string | null>(null)

  // Computed properties
  const canProceed = computed(() => {
    return previewData.value?.preview?.can_proceed === true
  })

  const hasValidationIssues = computed(() => {
    const issues = previewData.value?.preview?.validation_report?.issues
    return issues && issues.length > 0
  })

  const hasErrors = computed(() => {
    const issues = previewData.value?.preview?.validation_report?.issues
    return issues && issues.some(issue => issue.severity === 'error')
  })

  const hasWarnings = computed(() => {
    const issues = previewData.value?.preview?.validation_report?.issues
    return issues && issues.some(issue => issue.severity === 'warning')
  })

  const totalChanges = computed(() => {
    return previewData.value?.preview?.diff_preview?.total_changes || 0
  })

  const nextRevision = computed(() => {
    return previewData.value?.preview?.diff_preview?.next_revision || 1
  })

  const importWasSuccessful = computed(() => {
    return importResult.value?.success === true
  })

  // Actions
  async function loadQuoteStatus(jobId: string) {
    isLoading.value = true
    error.value = null
    
    try {
      currentQuote.value = await quoteImportService.getQuoteStatus(jobId)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load quote status'
      console.error('Failed to load quote status:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function previewImport(jobId: string, file: File) {
    isLoading.value = true
    error.value = null
    previewData.value = null
    
    try {
      previewData.value = await quoteImportService.previewQuoteImport(jobId, file)
      
      // Check if preview has errors
      if (previewData.value.preview.error) {
        error.value = previewData.value.preview.error
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Preview failed'
      previewData.value = null
      console.error('Preview import failed:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function executeImport(jobId: string, file: File, skipValidation = false) {
    isLoading.value = true
    error.value = null
    importResult.value = null
    
    try {
      importResult.value = await quoteImportService.importQuote(jobId, file, skipValidation)
      
      // Check if import failed
      if (!importResult.value.success && importResult.value.error) {
        error.value = importResult.value.error
      }
      
      // Reload quote status if import was successful
      if (importResult.value.success) {
        await loadQuoteStatus(jobId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Import failed'
      importResult.value = null
      console.error('Execute import failed:', err)
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
    // State
    isLoading,
    previewData,
    importResult,
    currentQuote,
    error,
    
    // Computed
    canProceed,
    hasValidationIssues,
    hasErrors,
    hasWarnings,
    totalChanges,
    nextRevision,
    importWasSuccessful,
    
    // Actions
    loadQuoteStatus,
    previewImport,
    executeImport,
    reset,
    clearError
  }
}
