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
  SafetyDocumentContent,
  SafetyDocumentType,
  ControlMeasure,
  SWPGenerateRequest,
  SectionType,
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

  // ============================================================
  // JSA/SWP Operations
  // ============================================================

  async listJobJSAs(jobId: string): Promise<ProcessDocumentListItem[]> {
    return api.job_rest_jobs_jsa_list({ params: { job_id: jobId } })
  }

  async listSWPs(): Promise<ProcessDocumentListItem[]> {
    return api.job_rest_swp_list()
  }

  async generateJobJSA(jobId: string): Promise<ProcessDocument> {
    return api.job_rest_jobs_jsa_generate_create(undefined, { params: { job_id: jobId } })
  }

  async generateSWP(request: SWPGenerateRequest): Promise<ProcessDocument> {
    return api.job_rest_swp_generate_create(request)
  }

  // ============================================================
  // Google Doc Content Read/Write
  // ============================================================

  async getDocumentContent(docId: string): Promise<SafetyDocumentContent> {
    const response = await api.job_rest_process_documents_content_retrieve({
      params: { id: docId },
    })
    return {
      ...response,
      document_type: response.document_type as SafetyDocumentType,
      tasks: response.tasks as unknown as SafetyDocumentContent['tasks'],
    }
  }

  async updateDocumentContent(
    docId: string,
    content: Partial<SafetyDocumentContent>,
  ): Promise<ProcessDocument> {
    return api.job_rest_process_documents_content_update(content, {
      params: { id: docId },
    })
  }

  // ============================================================
  // AI Generation Endpoints
  // ============================================================

  async generateHazards(taskDescription: string): Promise<string[]> {
    const response = await api.job_rest_safety_ai_generate_hazards_create({
      task_description: taskDescription,
    })
    return response.hazards
  }

  async generateControls(hazards: string[], taskDescription?: string): Promise<ControlMeasure[]> {
    const response = await api.job_rest_safety_ai_generate_controls_create({
      hazards,
      task_description: taskDescription,
    })
    return response.controls
  }

  async improveSection(
    sectionText: string,
    sectionType: SectionType,
    context?: string,
  ): Promise<string> {
    const response = await api.job_rest_safety_ai_improve_section_create({
      section_text: sectionText,
      section_type: sectionType,
      context,
    })
    return response.improved_text
  }

  async improveDocument(
    rawText: string,
    documentType: SafetyDocumentType,
  ): Promise<SafetyDocumentContent> {
    const response = await api.job_rest_safety_ai_improve_document_create({
      raw_text: rawText,
      document_type: documentType,
    })
    return response as unknown as SafetyDocumentContent
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  openInGoogleDocs(doc: ProcessDocument | ProcessDocumentListItem): void {
    if (doc.google_doc_url) {
      window.open(doc.google_doc_url, '_blank')
    }
  }

  getDocumentTypeLabel(type: SafetyDocumentType): string {
    return type === 'jsa' ? 'Job Safety Analysis' : 'Safe Work Procedure'
  }

  getDocumentTypeShortLabel(type: SafetyDocumentType): string {
    return type === 'jsa' ? 'JSA' : 'SWP'
  }
}

export const processDocumentsService = new ProcessDocumentsService()
