import type { JobPricing, JobEvent } from '@/schemas/job.schemas'
import type { CostSet } from '@/types/costing.types'

export interface BaseEntity {
  id: string
  created_at?: string
  updated_at?: string
}

export interface Staff extends BaseEntity {
  first_name?: string
  last_name?: string
  display_name: string
  email?: string
  initials?: string
  avatar_url?: string | null
  icon?: string | null
}

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

export interface QuoteSheet {
  id: string
  sheet_id: string
  sheet_url: string
  tab: string
  job_id: string
  job_number: string
  job_name: string
}

export interface Job extends BaseEntity {
  name: string
  description?: string | null
  job_number: number
  client_name: string
  contact_person?: string | null

  people?: Staff[]
  status?: string
  status_key?: string
  paid: boolean
  created_by_id?: string | null
  priority?: number

  badge_label?: string
  badge_color?: string

  quote_sheet?: QuoteSheet | null
}

export interface Invoice {
  id: string
  xero_id: string
  number: string
  status: string
  date: string
  due_date: string | null
  total_excl_tax: number
  total_incl_tax: number
  amount_due: number
  online_url?: string | null
}

export interface Quote {
  id: string
  xero_id: string
  status: string
  date: string
  total_excl_tax: number
  total_incl_tax: number
  online_url?: string | null
}

export interface JobData extends Job {
  client_id: string
  job_status: string
  pricing_methodology: 'fixed_price' | 'time_materials'
  created_at: string
  updated_at: string

  delivery_date?: string | null
  quote_acceptance_date?: string | null
  quoted?: boolean
  invoiced?: boolean
  paid: boolean
  charge_out_rate?: string
  order_number?: string | null
  notes?: string | null
  contact_id?: string | null
  contact_name?: string | null
  complex_job?: boolean
  latest_estimate_pricing?: JobPricing
  latest_quote_pricing?: JobPricing
  latest_reality_pricing?: JobPricing
  latest_estimate?: CostSet | null
  latest_quote?: CostSet | null
  latest_actual?: CostSet | null
  latest_pricings?: {
    estimate?: JobPricing | null
    quote?: JobPricing | null
    reality?: JobPricing | null
  }
  company_defaults?: {
    materials_markup: number
    time_markup: number
    charge_out_rate: number
    wage_rate: number
  } | null
  events?: JobEvent[]
  invoice?: Invoice | null
  quote?: Quote | null
}

export interface JobStatus {
  key: string
  label: string
  tooltip?: string
}

export type StatusChoice = JobStatus

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

export interface QuoteApplyResult {
  success: boolean
  message: string
  job_data?: Record<string, unknown>
}

export interface QuoteRefreshResult {
  shouldReloadJob?: boolean
}

export type QuoteOperationResult = (QuoteSheet & QuoteRefreshResult) | QuoteApplyResult

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  total?: number
  page?: number
  per_page?: number
}

export interface SomeType {
  data: Record<string, unknown>
}

export interface AnotherType {
  payload: Record<string, unknown>
}
