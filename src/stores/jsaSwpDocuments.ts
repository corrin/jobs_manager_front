/**
 * JSA/SWP Documents Store
 * Manages state for JSA/SWP safety documents
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { processDocumentsService } from '@/services/processDocuments.service'
import type {
  ProcessDocument,
  ProcessDocumentListItem,
  SafetyDocumentContent,
  SafetyDocumentType,
  SWPGenerateRequest,
} from '@/types/processDocument.types'

export const useJsaSwpStore = defineStore('jsaSwpDocuments', () => {
  // ============================================================
  // State
  // ============================================================

  // Documents by job ID (for JSAs)
  const documentsByJobId = ref<Record<string, ProcessDocumentListItem[]>>({})

  // All JSAs (for listing page)
  const jsaDocuments = ref<ProcessDocumentListItem[]>([])

  // All SWPs (standalone documents)
  const swpDocuments = ref<ProcessDocumentListItem[]>([])

  // Currently loaded document (full metadata)
  const currentDocument = ref<ProcessDocument | null>(null)

  // Currently loaded document content (from Google Doc)
  const currentContent = ref<SafetyDocumentContent | null>(null)

  // Loading states
  const isLoading = ref(false)
  const isGenerating = ref(false)
  const isSaving = ref(false)

  // Error state
  const error = ref<string | null>(null)

  // ============================================================
  // Getters
  // ============================================================

  const getDocumentsByJobId = computed(() => {
    return (jobId: string): ProcessDocumentListItem[] => {
      return documentsByJobId.value[jobId] || []
    }
  })

  const hasDocumentsForJob = computed(() => {
    return (jobId: string): boolean => {
      return (documentsByJobId.value[jobId]?.length ?? 0) > 0
    }
  })

  // ============================================================
  // Actions - Document Loading
  // ============================================================

  /**
   * Load JSAs for a specific job
   */
  async function loadJobJSAs(jobId: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const docs = await processDocumentsService.listJobJSAs(jobId)
      documentsByJobId.value = { ...documentsByJobId.value, [jobId]: docs }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load JSAs'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load all JSAs across all jobs
   */
  async function loadAllJSAs(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      // JSA/SWP document types exist at runtime but aren't in the schema enum.
      // Use the dedicated JSA list endpoint instead of filtering by type.
      const allDocs = await processDocumentsService.listProcessDocuments()
      jsaDocuments.value = allDocs.filter((d) => (d.document_type as string) === 'jsa')
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load JSAs'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load all SWPs
   */
  async function loadSWPs(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      swpDocuments.value = await processDocumentsService.listSWPs()
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load SWPs'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load a specific document's metadata
   */
  async function loadDocument(docId: string): Promise<ProcessDocument> {
    isLoading.value = true
    error.value = null

    try {
      currentDocument.value = await processDocumentsService.getProcessDocument(docId)
      return currentDocument.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load document'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Load document content from Google Doc
   */
  async function loadDocumentContent(docId: string): Promise<SafetyDocumentContent> {
    isLoading.value = true
    error.value = null

    try {
      currentContent.value = await processDocumentsService.getDocumentContent(docId)
      return currentContent.value
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load document content'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================
  // Actions - Document Generation
  // ============================================================

  /**
   * Generate a new JSA for a job
   */
  async function generateJobJSA(jobId: string): Promise<ProcessDocument> {
    isGenerating.value = true
    error.value = null

    try {
      const doc = await processDocumentsService.generateJobJSA(jobId)

      // Add to the job's document list
      const existingDocs = documentsByJobId.value[jobId] || []
      documentsByJobId.value = {
        ...documentsByJobId.value,
        [jobId]: [
          {
            id: doc.id,
            document_type: doc.document_type,
            job_number: doc.job_number,
            created_at: doc.created_at,
            updated_at: doc.updated_at,
            title: doc.title,
            site_location: doc.site_location,
            google_doc_url: doc.google_doc_url,
          },
          ...existingDocs,
        ],
      }

      currentDocument.value = doc
      return doc
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to generate JSA'
      throw e
    } finally {
      isGenerating.value = false
    }
  }

  /**
   * Generate a new SWP
   */
  async function generateSWP(request: SWPGenerateRequest): Promise<ProcessDocument> {
    isGenerating.value = true
    error.value = null

    try {
      const doc = await processDocumentsService.generateSWP(request)

      // Add to SWP list
      swpDocuments.value = [
        {
          id: doc.id,
          document_type: doc.document_type,
          job_number: null,
          created_at: doc.created_at,
          updated_at: doc.updated_at,
          title: doc.title,
          site_location: doc.site_location,
          google_doc_url: doc.google_doc_url,
        },
        ...swpDocuments.value,
      ]

      currentDocument.value = doc
      return doc
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to generate SWP'
      throw e
    } finally {
      isGenerating.value = false
    }
  }

  // ============================================================
  // Actions - Document Updates
  // ============================================================

  /**
   * Save document content back to Google Doc
   */
  async function saveDocumentContent(
    docId: string,
    content: Partial<SafetyDocumentContent>,
  ): Promise<ProcessDocument> {
    isSaving.value = true
    error.value = null

    try {
      const doc = await processDocumentsService.updateDocumentContent(docId, content)
      currentDocument.value = doc

      // Update timestamp in lists
      updateDocumentInLists(doc)

      return doc
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to save document'
      throw e
    } finally {
      isSaving.value = false
    }
  }

  /**
   * Delete a document
   */
  async function deleteDocument(
    docId: string,
    documentType: SafetyDocumentType,
    jobId?: string,
  ): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await processDocumentsService.deleteProcessDocument(docId)

      // Remove from appropriate list
      if (documentType === 'jsa' && jobId) {
        const existingDocs = documentsByJobId.value[jobId] || []
        documentsByJobId.value = {
          ...documentsByJobId.value,
          [jobId]: existingDocs.filter((d) => d.id !== docId),
        }
      } else {
        swpDocuments.value = swpDocuments.value.filter((d) => d.id !== docId)
      }

      // Clear current if it was the deleted one
      if (currentDocument.value?.id === docId) {
        currentDocument.value = null
        currentContent.value = null
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to delete document'
      throw e
    } finally {
      isLoading.value = false
    }
  }

  // ============================================================
  // Helper Functions
  // ============================================================

  function updateDocumentInLists(doc: ProcessDocument): void {
    // Update in job documents
    if (doc.job_id) {
      const jobDocs = documentsByJobId.value[doc.job_id]
      if (jobDocs) {
        documentsByJobId.value = {
          ...documentsByJobId.value,
          [doc.job_id]: jobDocs.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  title: doc.title,
                  site_location: doc.site_location,
                  updated_at: doc.updated_at,
                }
              : d,
          ),
        }
      }
    }

    // Update in SWP list
    if ((doc.document_type as string) === 'swp') {
      swpDocuments.value = swpDocuments.value.map((d) =>
        d.id === doc.id
          ? {
              ...d,
              title: doc.title,
              site_location: doc.site_location,
              updated_at: doc.updated_at,
            }
          : d,
      )
    }
  }

  function clearError(): void {
    error.value = null
  }

  function clearCurrentDocument(): void {
    currentDocument.value = null
    currentContent.value = null
  }

  // ============================================================
  // Return
  // ============================================================

  return {
    // State
    documentsByJobId,
    jsaDocuments,
    swpDocuments,
    currentDocument,
    currentContent,
    isLoading,
    isGenerating,
    isSaving,
    error,

    // Getters
    getDocumentsByJobId,
    hasDocumentsForJob,

    // Actions
    loadJobJSAs,
    loadAllJSAs,
    loadSWPs,
    loadDocument,
    loadDocumentContent,
    generateJobJSA,
    generateSWP,
    saveDocumentContent,
    deleteDocument,
    clearError,
    clearCurrentDocument,
  }
})
