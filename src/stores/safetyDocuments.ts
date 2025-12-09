/**
 * Safety Documents Store
 * Manages state for JSA/SWP safety documents
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { safetyService } from '@/services/safety.service'
import type {
  SafetyDocument,
  SafetyDocumentList,
  SafetyDocumentContent,
  DocumentType,
  SWPGenerateRequest,
} from '@/types/safety.types'

export const useSafetyDocumentsStore = defineStore('safetyDocuments', () => {
  // ============================================================
  // State
  // ============================================================

  // Documents by job ID (for JSAs)
  const documentsByJobId = ref<Record<string, SafetyDocumentList[]>>({})

  // All JSAs (for listing page)
  const jsaDocuments = ref<SafetyDocumentList[]>([])

  // All SWPs (standalone documents)
  const swpDocuments = ref<SafetyDocumentList[]>([])

  // Currently loaded document (full metadata)
  const currentDocument = ref<SafetyDocument | null>(null)

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
    return (jobId: string): SafetyDocumentList[] => {
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
      const docs = await safetyService.listJobJSAs(jobId)
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
      jsaDocuments.value = await safetyService.listDocuments('jsa')
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
      swpDocuments.value = await safetyService.listSWPs()
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
  async function loadDocument(docId: string): Promise<SafetyDocument> {
    isLoading.value = true
    error.value = null

    try {
      currentDocument.value = await safetyService.getDocument(docId)
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
      currentContent.value = await safetyService.getDocumentContent(docId)
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
  async function generateJobJSA(jobId: string): Promise<SafetyDocument> {
    isGenerating.value = true
    error.value = null

    try {
      const doc = await safetyService.generateJobJSA(jobId)

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
  async function generateSWP(request: SWPGenerateRequest): Promise<SafetyDocument> {
    isGenerating.value = true
    error.value = null

    try {
      const doc = await safetyService.generateSWP(request)

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
  ): Promise<SafetyDocument> {
    isSaving.value = true
    error.value = null

    try {
      const doc = await safetyService.updateDocumentContent(docId, content)
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
  async function deleteDocument(docId: string, documentType: DocumentType, jobId?: string): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      await safetyService.deleteDocument(docId)

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

  function updateDocumentInLists(doc: SafetyDocument): void {
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
    if (doc.document_type === 'swp') {
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
