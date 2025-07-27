// ❌ COMMENTED OUT - THESE ARE DATABASE DATA TYPES (ARCHITECTURAL VIOLATIONS)
// Backend needs to create proper schemas for these instead of frontend modeling them

import { schemas } from '@/api/generated/api'
import { z } from 'zod'

// Use generated schema for timesheet entries
export type TimesheetEntry = z.infer<typeof schemas.TimesheetCostLine>

// Job selection - use generated schema
export type JobSelectionItem = z.infer<typeof schemas.Job>

// Staff member - use generated schema
export type StaffMember = z.infer<typeof schemas.Staff>

// Company defaults - use generated schema
export type CompanyDefaults = z.infer<typeof schemas.CompanyDefaults>

/*
// COMMENTED OUT - using generated schemas above
export interface JobSelectionItem {
  id: string
  job_number: string
  name: string
  client_name: string
  charge_out_rate: number
  status: string
  job_display_name: string
  // Alternative field names for compatibility
  number?: string | number
  jobNumber?: string | number
  job_name?: string
  jobName?: string
  clientName?: string
  client?: string
  chargeOutRate?: number
  rate?: number
  job_id?: string
  jobId?: string
}

export interface StaffMember {
  id: string
  firstName: string
  lastName: string
  wageRate: number
  fullName: string
}
*/

// BACKEND REQUIREMENTS:
// - Need JobSelectionItem schema for timesheet job selection
// - Need enhanced Staff schema (existing one lacks firstName, lastName, wageRate fields)
// - TimesheetEntry should use existing schemas.TimesheetCostLine

// Rate multiplier calculation based on backend enum values
// Uses existing /api/enums/RateType/ endpoint
export const getRateMultiplier = (rateValue: string): number => {
  // Special cases
  if (rateValue === 'Ord') return 1.0
  if (rateValue === 'Unpaid') return 0.0

  // For numeric values (1.5, 2.0, 3.0, etc.), parse directly
  const parsed = parseFloat(rateValue)
  return isNaN(parsed) ? 1.0 : parsed
}

// Use /api/enums/RateType/ endpoint for rate type choices
// Returns: {"choices": [{"value": "Ord", "display_name": "Ordinary Time"}, ...]}

// ❌ COMMENTED OUT - MORE DATABASE DATA TYPES
/*
export interface Job {
  id: string
  job_number: string
  name: string
  client_name: string
  status: string
  charge_out_rate: string
  has_actual_costset: boolean
  jobNumber?: string
  jobName?: string
  clientName?: string
  chargeOutRate?: number
  displayName?: string
  jobId?: string
}

export interface Staff {
  id: string
  firstName: string
  lastName: string
  wageRate: number
  fullName: string
  name: string // Alias for fullName
  avatarUrl?: string
}

export interface WeeklyOverviewData {
  staffData: WeeklyStaffData[]
  startDate: string
  endDate: string
  totalHours: number
  totalBillableHours: number
}

export interface WeeklyStaffData {
  staff: Staff
  weeklyHours: DayData[]
  totalHours: number
  billablePercentage?: number
}

export interface DayData {
  date: string
  hours: number
  entries: CostLine[]
  leaveHours?: number
  status?: string
  overtime?: number
  leaveType?: string
}

export interface TimesheetEntryJobSelectionItem {
  id: string
  job_number: string
  name: string
  client_name: string
  charge_out_rate: number
  status: string
  job_display_name: string
  shop_job: boolean
}

export interface TimesheetEntryStaffMember {
  id: string
  firstName: string
  lastName: string
  wageRate: number
  fullName: string
}

export interface TimesheetEntryGridRow {
  id: string | null
  jobNumber: string
  client: string
  jobName: string
  hours: number
  billable: boolean
  description: string
  rate: string
  wage: number
  bill: number
  isNewRow?: boolean
  originalCostLine?: CostLine
  jobId?: string
  isEmptyRow?: boolean
  staffId?: string
  date?: string
  wageRate?: number
  chargeOutRate?: number
}

export interface CompanyDefaults {
  materials_markup: number
  time_markup: number
  charge_out_rate: number
  wage_rate: number
}
*/

// All the above types represent database data and violate CLAUDE.md architecture rules

// COMPREHENSIVE BACKEND REQUIREMENTS:
// The following schemas need to be created in the backend for proper architecture:
// - JobSelectionItem schema for timesheet job selection dropdown
// - Enhanced Staff schema (existing one lacks firstName, lastName, wageRate fields)
// - RateTypeConfiguration schema with rate values and multipliers
// - WeeklyOverviewData, WeeklyStaffData, DayData schemas for weekly timesheet views
// - TimesheetEntryJobSelectionItem, TimesheetEntryStaffMember schemas for grid components
// - TimesheetEntryGridRow schema for timesheet entry display
// - CompanyDefaults schema for business configuration data
// - Use existing schemas.TimesheetCostLine for TimesheetEntry
