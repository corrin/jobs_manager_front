/**
 * Safety Document Service
 * Handles API calls for JSA/SWP safety documents and AI generation
 */

import { api } from '@/api/client'
import type {
  SafetyDocument,
  SafetyDocumentList,
  SafetyDocumentContent,
  ControlMeasure,
  SWPGenerateRequest,
  DocumentType,
  SectionType,
} from '@/types/safety.types'

class SafetyService {
  // ============================================================
  // Document CRUD Operations
  // ============================================================

  /**
   * List all safety documents, optionally filtered by type
   * Note: API doesn't support type filtering yet - filter client-side if needed
   */
  async listDocuments(type?: DocumentType): Promise<SafetyDocumentList[]> {
    const docs = await api.job_rest_safety_documents_list()
    if (type) {
      return docs.filter((d: SafetyDocumentList) => d.document_type === type)
    }
    return docs
  }

  /**
   * List all JSAs for a specific job
   */
  async listJobJSAs(jobId: string): Promise<SafetyDocumentList[]> {
    return api.job_rest_jobs_jsa_list({ params: { job_id: jobId } })
  }

  /**
   * List all SWPs
   */
  async listSWPs(): Promise<SafetyDocumentList[]> {
    return api.job_rest_swp_list()
  }

  /**
   * Get a specific safety document by ID
   */
  async getDocument(docId: string): Promise<SafetyDocument> {
    return api.job_rest_safety_documents_retrieve({ params: { id: docId } })
  }

  /**
   * Delete a safety document (Google Doc is NOT deleted)
   */
  async deleteDocument(docId: string): Promise<void> {
    await api.job_rest_safety_documents_destroy(undefined, { params: { id: docId } })
  }

  // ============================================================
  // Document Generation
  // ============================================================

  /**
   * Generate a new JSA for a job using AI
   */
  async generateJobJSA(jobId: string): Promise<SafetyDocument> {
    return api.job_rest_jobs_jsa_generate_create(undefined, { params: { job_id: jobId } })
  }

  /**
   * Generate a new SWP using AI
   */
  async generateSWP(request: SWPGenerateRequest): Promise<SafetyDocument> {
    return api.job_rest_swp_generate_create(request)
  }

  // ============================================================
  // Google Doc Content Read/Write
  // ============================================================

  /**
   * Read content from a safety document's Google Doc
   */
  async getDocumentContent(docId: string): Promise<SafetyDocumentContent> {
    const response = await api.job_rest_safety_documents_content_retrieve({ params: { id: docId } })
    // Cast to proper type since schema has loose typing for tasks array
    return {
      ...response,
      document_type: response.document_type as DocumentType,
      tasks: response.tasks as unknown as SafetyDocumentContent['tasks'],
    }
  }

  /**
   * Update a safety document's Google Doc with new content
   */
  async updateDocumentContent(
    docId: string,
    content: Partial<SafetyDocumentContent>,
  ): Promise<SafetyDocument> {
    return api.job_rest_safety_documents_content_update(content, {
      params: { id: docId },
    })
  }

  // ============================================================
  // AI Generation Endpoints
  // ============================================================

  /**
   * Generate potential hazards for a task description
   */
  async generateHazards(taskDescription: string): Promise<string[]> {
    const response = await api.job_rest_safety_ai_generate_hazards_create({
      task_description: taskDescription,
    })
    return response.hazards
  }

  /**
   * Generate control measures for specified hazards
   */
  async generateControls(hazards: string[], taskDescription?: string): Promise<ControlMeasure[]> {
    const response = await api.job_rest_safety_ai_generate_controls_create({
      hazards,
      task_description: taskDescription,
    })
    return response.controls
  }

  /**
   * Improve a specific section of text using AI
   */
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

  /**
   * Improve an entire document using AI
   */
  async improveDocument(rawText: string, documentType: DocumentType): Promise<SafetyDocumentContent> {
    const response = await api.job_rest_safety_ai_improve_document_create({
      raw_text: rawText,
      document_type: documentType,
    })
    // Cast to proper type
    return response as unknown as SafetyDocumentContent
  }

  // ============================================================
  // Utility Methods
  // ============================================================

  /**
   * Open the Google Doc in a new tab
   */
  openInGoogleDocs(doc: SafetyDocument | SafetyDocumentList): void {
    if (doc.google_doc_url) {
      window.open(doc.google_doc_url, '_blank')
    }
  }

  /**
   * Get display label for document type
   */
  getDocumentTypeLabel(type: DocumentType): string {
    return type === 'jsa' ? 'Job Safety Analysis' : 'Safe Work Procedure'
  }

  /**
   * Get short label for document type
   */
  getDocumentTypeShortLabel(type: DocumentType): string {
    return type === 'jsa' ? 'JSA' : 'SWP'
  }
}

export const safetyService = new SafetyService()
