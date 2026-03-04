/**
 * Types for Process Documents (procedures, forms, registers, references)
 * Inferred from generated API schemas where possible.
 */

import { z } from 'zod'
import { schemas } from '@/api/generated/api'

// ============================================================
// Schema-derived types (source of truth: generated API)
// ============================================================

export type ProcessDocumentListItem = z.infer<typeof schemas.ProcessDocumentList>
export type ProcessDocument = z.infer<typeof schemas.ProcessDocument>
export type ProcessDocumentEntry = z.infer<typeof schemas.ProcessDocumentEntry>
export type ProcessDocumentCreateRequest = z.infer<typeof schemas.ProcessDocumentCreateRequest>
export type ProcessDocumentUpdateRequest = z.infer<typeof schemas.ProcessDocumentUpdateRequest>
export type ProcessDocumentEntryRequest = z.infer<typeof schemas.ProcessDocumentEntryRequest>
export type ProcessDocumentContentResponse = z.infer<typeof schemas.ProcessDocumentContentResponse>
export type ProcessDocumentContentUpdateRequest = z.infer<
  typeof schemas.ProcessDocumentContentUpdateRequest
>

// Enum types derived from schema
export type ProcessDocumentType = z.infer<typeof schemas.DocumentTypeEnum>
export type ProcessDocumentStatus = z.infer<typeof schemas.Status0cbEnum>

// ============================================================
// Frontend-only types
// ============================================================

export type FormFieldType = 'text' | 'textarea' | 'date' | 'boolean' | 'number' | 'select'

export interface FormField {
  key: string
  label: string
  type: FormFieldType
  required?: boolean
  options?: string[]
}

export interface FormSchema {
  fields: FormField[]
}

export interface ProcessDocumentFilters {
  type: ProcessDocumentType | null
  tags: string[]
  status: ProcessDocumentStatus | 'all'
  isTemplate: boolean | null
  search: string
}
