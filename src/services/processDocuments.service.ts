/**
 * Process Documents Service
 * Handles API calls for process documents (procedures, forms, registers, references)
 */

import { api } from '@/api/client'
import type {
  ProcessDocumentListItem,
  ProcessDocument,
  ProcessDocumentEntry,
  ProcessDocumentCreateRequest,
  ProcessDocumentUpdateRequest,
  ProcessDocumentEntryRequest,
  ProcessDocumentFilters,
} from '@/types/processDocument.types'

class ProcessDocumentsService {
  // ============================================================
  // Document CRUD Operations
  // ============================================================

  /**
   * List process documents with optional filters.
   * Builds query params from the filters object.
   */
  async listProcessDocuments(
    filters?: Partial<ProcessDocumentFilters>,
  ): Promise<ProcessDocumentListItem[]> {
    const queries: Record<string, string | undefined> = {}

    if (filters) {
      if (filters.type) {
        queries.type = filters.type
      }
      if (filters.tags && filters.tags.length > 0) {
        queries.tags = filters.tags.join(',')
      }
      if (filters.status && filters.status !== 'all') {
        queries.status = filters.status
      }
      if (filters.isTemplate !== null && filters.isTemplate !== undefined) {
        queries.is_template = String(filters.isTemplate)
      }
      if (filters.search) {
        queries.q = filters.search
      }
    }

    return api.job_rest_process_documents_list({ queries })
  }

  /**
   * List process documents that are children of a given template.
   */
  async listProcessDocumentsByParent(parentTemplateId: string): Promise<ProcessDocumentListItem[]> {
    return api.job_rest_process_documents_list({
      queries: { parent_template_id: parentTemplateId },
    })
  }

  /**
   * Get a single process document by ID.
   */
  async getProcessDocument(id: string): Promise<ProcessDocument> {
    return api.job_rest_process_documents_retrieve({ params: { id } })
  }

  /**
   * Create a new process document.
   */
  async createProcessDocument(payload: ProcessDocumentCreateRequest): Promise<ProcessDocument> {
    return api.job_rest_process_documents_create(payload)
  }

  /**
   * Update an existing process document (PUT).
   */
  async updateProcessDocument(
    id: string,
    payload: ProcessDocumentUpdateRequest,
  ): Promise<ProcessDocument> {
    return api.job_rest_process_documents_update(payload, { params: { id } })
  }

  /**
   * Delete a process document.
   */
  async deleteProcessDocument(id: string): Promise<void> {
    await api.job_rest_process_documents_destroy(undefined, { params: { id } })
  }

  // ============================================================
  // Template Actions
  // ============================================================

  /**
   * Fill a template, creating a new record from it.
   * Optionally associates the new document with a job.
   */
  async fillTemplate(id: string, jobId?: string): Promise<ProcessDocument> {
    return api.job_rest_process_documents_fill_create({ job_id: jobId ?? null }, { params: { id } })
  }

  /**
   * Mark a document as completed (read-only).
   */
  async completeDocument(id: string): Promise<ProcessDocument> {
    return api.job_rest_process_documents_complete_create(undefined, {
      params: { id },
    })
  }

  // ============================================================
  // Entry CRUD Operations
  // ============================================================

  /**
   * List all entries for a process document.
   */
  async listEntries(documentId: string): Promise<ProcessDocumentEntry[]> {
    return api.job_rest_process_documents_entries_list({
      params: { document_pk: documentId },
    })
  }

  /**
   * Create a new entry on a process document.
   */
  async createEntry(
    documentId: string,
    payload: ProcessDocumentEntryRequest,
  ): Promise<ProcessDocumentEntry> {
    return api.job_rest_process_documents_entries_create(payload, {
      params: { document_pk: documentId },
    })
  }

  /**
   * Update an existing entry on a process document (PUT).
   */
  async updateEntry(
    documentId: string,
    entryId: string,
    payload: ProcessDocumentEntryRequest,
  ): Promise<ProcessDocumentEntry> {
    return api.job_rest_process_documents_entries_update(payload, {
      params: { document_pk: documentId, id: entryId },
    })
  }
}

export const processDocumentsService = new ProcessDocumentsService()
