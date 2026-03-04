/**
 * Process Documents Store
 * Manages state for process documents (procedures, forms, registers, references)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { toast } from 'vue-sonner'
import { processDocumentsService } from '@/services/processDocuments.service'
import type {
  ProcessDocumentListItem,
  ProcessDocument,
  ProcessDocumentEntry,
  ProcessDocumentCreateRequest,
  ProcessDocumentUpdateRequest,
  ProcessDocumentEntryRequest,
  ProcessDocumentFilters,
  FormSchema,
} from '@/types/processDocument.types'

export const useProcessDocumentsStore = defineStore('processDocuments', () => {
  // ============================================================
  // State
  // ============================================================

  // Library list
  const documents = ref<ProcessDocumentListItem[]>([])

  // Detail view
  const currentDocument = ref<ProcessDocument | null>(null)

  // Form entries for the current document
  const entries = ref<ProcessDocumentEntry[]>([])

  // Form templates for nav population
  const formTemplates = ref<ProcessDocumentListItem[]>([])

  // Loading states
  const isLoading = ref(false)
  const isLoadingDocument = ref(false)
  const isLoadingEntries = ref(false)
  const isSaving = ref(false)

  // Error state
  const error = ref<string | null>(null)

  // Filters with defaults
  const filters = ref<ProcessDocumentFilters>({
    type: null,
    tags: [],
    status: 'active',
    isTemplate: null,
    search: '',
  })

  // ============================================================
  // Getters
  // ============================================================

  /** Checks if currentDocument has a non-empty form_schema with fields */
  const hasFormSchema = computed<boolean>(() => {
    if (!currentDocument.value?.form_schema) return false
    const schema = currentDocument.value.form_schema as FormSchema
    return Array.isArray(schema.fields) && schema.fields.length > 0
  })

  /** Checks if currentDocument is a template */
  const isTemplate = computed<boolean>(() => {
    return currentDocument.value?.is_template === true
  })

  /** Inverse of hasFormSchema — a prose-based document */
  const isProse = computed<boolean>(() => {
    return !hasFormSchema.value
  })

  // ============================================================
  // Actions - Document Loading
  // ============================================================

  /**
   * Load documents list with current filters.
   */
  async function loadDocuments(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      documents.value = await processDocumentsService.listProcessDocuments(filters.value)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load process documents'
      error.value = message
      toast.error(message)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load a single document by ID.
   */
  async function loadDocument(id: string): Promise<void> {
    isLoadingDocument.value = true
    error.value = null

    try {
      currentDocument.value = await processDocumentsService.getProcessDocument(id)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load document'
      error.value = message
      toast.error(message)
    } finally {
      isLoadingDocument.value = false
    }
  }

  /**
   * Load form templates for nav (type=form, is_template=true, status=active).
   * Silent on error — nav just won't show items.
   */
  async function loadFormTemplates(): Promise<void> {
    try {
      formTemplates.value = await processDocumentsService.listProcessDocuments({
        type: 'form',
        isTemplate: true,
        status: 'active',
        tags: [],
        search: '',
      })
    } catch (e) {
      console.error('Failed to load form templates for nav:', e)
    }
  }

  // ============================================================
  // Actions - Document CRUD
  // ============================================================

  /**
   * Create a new process document.
   */
  async function createDocument(
    payload: ProcessDocumentCreateRequest,
  ): Promise<ProcessDocument | null> {
    isSaving.value = true
    error.value = null

    try {
      const doc = await processDocumentsService.createProcessDocument(payload)
      toast.success('Document created')
      await loadDocuments()
      return doc
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create document'
      error.value = message
      toast.error(message)
      return null
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Update an existing process document.
   */
  async function updateDocument(id: string, payload: ProcessDocumentUpdateRequest): Promise<void> {
    isSaving.value = true
    error.value = null

    try {
      const updated = await processDocumentsService.updateProcessDocument(id, payload)
      currentDocument.value = updated
      toast.success('Document updated')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update document'
      error.value = message
      toast.error(message)
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Delete a process document.
   */
  async function deleteDocument(id: string): Promise<void> {
    isSaving.value = true
    error.value = null

    try {
      await processDocumentsService.deleteProcessDocument(id)
      documents.value = documents.value.filter((d) => d.id !== id)

      // Clear current if it was the deleted one
      if (currentDocument.value?.id === id) {
        currentDocument.value = null
        entries.value = []
      }

      toast.success('Document deleted')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete document'
      error.value = message
      toast.error(message)
    } finally {
      isSaving.value = false
    }
  }

  // ============================================================
  // Actions - Template Operations
  // ============================================================

  /**
   * Fill a template, creating a new record from it.
   */
  async function fillTemplate(id: string, jobId?: string): Promise<ProcessDocument | null> {
    isSaving.value = true
    error.value = null

    try {
      const doc = await processDocumentsService.fillTemplate(id, jobId)
      toast.success('Template filled — new document created')
      return doc
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to fill template'
      error.value = message
      toast.error(message)
      return null
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Mark a document as completed (read-only).
   */
  async function completeDocument(id: string): Promise<void> {
    isSaving.value = true
    error.value = null

    try {
      const updated = await processDocumentsService.completeDocument(id)
      currentDocument.value = updated
      toast.success('Document marked as completed')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to complete document'
      error.value = message
      toast.error(message)
    } finally {
      isSaving.value = false
    }
  }

  // ============================================================
  // Actions - Entries
  // ============================================================

  /**
   * Load entries for a document.
   */
  async function loadEntries(documentId: string): Promise<void> {
    isLoadingEntries.value = true
    error.value = null

    try {
      entries.value = await processDocumentsService.listEntries(documentId)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load entries'
      error.value = message
      toast.error(message)
    } finally {
      isLoadingEntries.value = false
    }
  }

  /**
   * Add a new entry to a document. Prepends to the entries array.
   */
  async function addEntry(documentId: string, payload: ProcessDocumentEntryRequest): Promise<void> {
    isSaving.value = true
    error.value = null

    try {
      const entry = await processDocumentsService.createEntry(documentId, payload)
      entries.value = [entry, ...entries.value]
      toast.success('Entry added')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to add entry'
      error.value = message
      toast.error(message)
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Update an existing entry. Replaces it in the entries array.
   */
  async function updateEntry(
    documentId: string,
    entryId: string,
    payload: ProcessDocumentEntryRequest,
  ): Promise<void> {
    isSaving.value = true
    error.value = null

    try {
      const updated = await processDocumentsService.updateEntry(documentId, entryId, payload)
      entries.value = entries.value.map((e) => (e.id === entryId ? updated : e))
      toast.success('Entry updated')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update entry'
      error.value = message
      toast.error(message)
    } finally {
      isSaving.value = false
    }
  }

  // ============================================================
  // Actions - Filters & Cleanup
  // ============================================================

  /**
   * Merge new filters and reload documents.
   */
  async function setFilters(newFilters: Partial<ProcessDocumentFilters>): Promise<void> {
    filters.value = { ...filters.value, ...newFilters }
    await loadDocuments()
  }

  /**
   * Reset current document and entries.
   */
  function clearCurrentDocument(): void {
    currentDocument.value = null
    entries.value = []
  }

  // ============================================================
  // Return
  // ============================================================

  return {
    // State
    documents,
    currentDocument,
    entries,
    formTemplates,
    isLoading,
    isLoadingDocument,
    isLoadingEntries,
    isSaving,
    error,
    filters,

    // Getters
    hasFormSchema,
    isTemplate,
    isProse,

    // Actions
    loadDocuments,
    loadDocument,
    loadFormTemplates,
    createDocument,
    updateDocument,
    deleteDocument,
    fillTemplate,
    completeDocument,
    loadEntries,
    addEntry,
    updateEntry,
    setFilters,
    clearCurrentDocument,
  }
})
