// Central shared types used across multiple views
// These are internal TypeScript types, not for validation

// Common entity types
export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
}

// Staff types
export interface Staff extends BaseEntity {
  first_name?: string
  last_name?: string
  display_name: string
  email?: string
  initials?: string
  avatar_url?: string | null
  icon?: string | null
}

// Alternative Staff type for legacy endpoints that return number IDs
export interface StaffWithNumberId {
  id: number
  first_name: string
  last_name: string
  display_name: string
  email?: string
  initials?: string
  avatar_url?: string | null
  icon?: string | null
}

// Quote Sheet types
export interface QuoteSheet {
  id: string
  sheet_id: string
  sheet_url: string
  tab: string
  job_id: string
  job_number: string
  job_name: string
}

// Job types
export interface Job extends BaseEntity {
  name: string
  description?: string | null
  job_number: number
  client_name: string
  contact_person?: string | null
  people: Staff[]
  status: string
  status_key: string
  paid: boolean
  created_by_id?: string | null
  priority?: number
  // New badge information from kanban categorization
  badge_label?: string
  badge_color?: string
  // Quote sheet integration
  quote_sheet?: QuoteSheet | null
}

// Job status types
export interface JobStatus {
  key: string
  label: string
  tooltip?: string
}

// Alias for backward compatibility
export type StatusChoice = JobStatus

// Advanced filter types
export interface AdvancedFilters {
  job_number: string
  name: string
  description: string
  client_name: string
  contact_person: string
  created_by: string
  status: string[]
  created_after: string
  created_before: string
  paid: string
}

// API response wrapper types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  total?: number
  page?: number
  per_page?: number
}
