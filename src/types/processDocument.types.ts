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
export type ProcessDocumentStatus = z.infer<typeof schemas.ProcessDocumentStatusEnum>

// ============================================================
// AI generation types (JSA/SWP)
// ============================================================

export type GenerateControlsResponse = z.infer<typeof schemas.GenerateControlsResponse>
export type GenerateHazardsResponse = z.infer<typeof schemas.GenerateHazardsResponse>
export type ImproveSectionResponse = z.infer<typeof schemas.ImproveSectionResponse>
export type ImproveDocumentResponse = z.infer<typeof schemas.ImproveDocumentResponse>

// Request types
export type SWPGenerateRequestBase = z.infer<typeof schemas.SWPGenerateRequestRequest>
export type EquipmentType = 'machinery' | 'hand_tools' | 'other'
export interface SWPGenerateRequest extends SWPGenerateRequestBase {
  equipment_type?: EquipmentType
  document_number?: string
}
export type GenerateControlsRequest = z.infer<typeof schemas.GenerateControlsRequestRequest>
export type ImproveSectionRequest = z.infer<typeof schemas.ImproveSectionRequestRequest>
export type ImproveDocumentRequest = z.infer<typeof schemas.ImproveDocumentRequestRequest>

// ============================================================
// JSA/SWP-specific types
// ============================================================

export type SafetyDocumentType = 'jsa' | 'swp' | 'sop'
export type RiskRating = 'Low' | 'Moderate' | 'High' | 'Extreme'
export type ControlMeasure = string

export interface SafetyTask {
  step_number: number
  description: string
  summary?: string
  potential_hazards: string[]
  initial_risk_rating: RiskRating
  control_measures: ControlMeasure[]
  revised_risk_rating: RiskRating
}

export interface SafetyDocumentContent {
  title: string
  document_type: SafetyDocumentType
  description: string
  site_location: string
  ppe_requirements: string[]
  tasks: SafetyTask[]
  additional_notes: string
  raw_text: string
}

export interface WizardState {
  documentId: string
  currentStep: WizardStep
  content: SafetyDocumentContent
  originalContent: SafetyDocumentContent
  isDirty: boolean
  isLoading: boolean
  error: string | null
}

export type WizardStep =
  | 'loading'
  | 'description'
  | 'tasks'
  | 'hazards'
  | 'controls'
  | 'ppe'
  | 'review'

export const WIZARD_STEPS: WizardStep[] = [
  'description',
  'tasks',
  'hazards',
  'controls',
  'ppe',
  'review',
]

export type SectionType = 'description' | 'task' | 'hazard' | 'control' | 'ppe' | 'notes'

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
