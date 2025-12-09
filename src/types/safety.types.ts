/**
 * Types for JSA/SWP Safety Documents
 * These types are inferred from the generated API schemas
 */

import { z } from 'zod'
import { schemas } from '@/api/generated/api'

// Core document types - inferred from schema
export type SafetyDocument = z.infer<typeof schemas.SafetyDocument>
export type SafetyDocumentList = z.infer<typeof schemas.SafetyDocumentList>

// Content types
export type SafetyDocumentContentResponse = z.infer<typeof schemas.SafetyDocumentContentResponse>
export type SafetyDocumentContentUpdateRequest = z.infer<
  typeof schemas.SafetyDocumentContentUpdateRequest
>

// AI generation types
export type GenerateControlsResponse = z.infer<typeof schemas.GenerateControlsResponse>
export type GenerateHazardsResponse = z.infer<typeof schemas.GenerateHazardsResponse>
export type ImproveSectionResponse = z.infer<typeof schemas.ImproveSectionResponse>
export type ImproveDocumentResponse = z.infer<typeof schemas.ImproveDocumentResponse>

// Request types
export type SWPGenerateRequestBase = z.infer<typeof schemas.SWPGenerateRequestRequest>
export type EquipmentType = 'machinery' | 'hand_tools' | 'other'
export interface SWPGenerateRequest extends SWPGenerateRequestBase {
  equipment_type?: EquipmentType
  document_number?: string // Legacy doc number for migration (e.g., "Doc.307")
}
export type GenerateControlsRequest = z.infer<typeof schemas.GenerateControlsRequestRequest>
export type ImproveSectionRequest = z.infer<typeof schemas.ImproveSectionRequestRequest>
export type ImproveDocumentRequest = z.infer<typeof schemas.ImproveDocumentRequestRequest>

// Document type enum
export type DocumentType = 'jsa' | 'swp' | 'sop'

// Risk rating enum
export type RiskRating = 'Low' | 'Moderate' | 'High' | 'Extreme'

// Control measure (now just a string from the API)
export type ControlMeasure = string

// Task structure (manually typed since schema has loose typing)
export interface SafetyTask {
  step_number: number
  description: string
  summary?: string
  potential_hazards: string[]
  initial_risk_rating: RiskRating
  control_measures: ControlMeasure[]
  revised_risk_rating: RiskRating
}

// Full document content for editing
export interface SafetyDocumentContent {
  title: string
  document_type: DocumentType
  description: string
  site_location: string
  ppe_requirements: string[]
  tasks: SafetyTask[]
  additional_notes: string
  raw_text: string
}

// Wizard state for AI-assisted editing
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

// Section types for improve-section endpoint
export type SectionType = 'description' | 'task' | 'hazard' | 'control' | 'ppe' | 'notes'
