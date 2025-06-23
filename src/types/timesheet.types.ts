import type { CostLine } from './costing.types'

export interface OptimizedTimeEntry {
  id: number | null
  jobNumber: string
  client: string
  jobName: string
  hours: number
  billable: boolean
  description: string
  rate: string
  wage: number
  bill: number

  staffId: string
  date: string
  wageRate: number
  chargeOutRate: number
  rateMultiplier: number
  isNewRow?: boolean
  isModified?: boolean
  jobId?: string
}

export interface JobSelectionItem {
  id: string
  job_number: string
  name: string
  client_name: string
  charge_out_rate: number
  status: string
  job_display_name: string
}

export interface StaffMember {
  id: string
  firstName: string
  lastName: string
  wageRate: number
  fullName: string
}

export interface KeyboardShortcut {
  key: string
  description: string
  action: string
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  { key: 'Tab', description: 'Move to next cell', action: 'navigate' },
  { key: 'Shift+Tab', description: 'Move to previous cell', action: 'navigate' },
  { key: 'Enter', description: 'Save cell and move down', action: 'save-move' },
  { key: 'Escape', description: 'Cancel editing', action: 'cancel' },
  { key: 'F2', description: 'Enter edit mode', action: 'edit' },
  { key: 'Ctrl+S', description: 'Save all changes', action: 'save-all' },
  { key: 'Ctrl+N', description: 'Add new row', action: 'add-row' },
  { key: 'Delete', description: 'Delete selected row', action: 'delete' },
]

export const RATE_TYPES = [
  { value: 'Ord', label: 'Ordinary (1.0x)', multiplier: 1.0 },
  { value: '1.5', label: 'Time & Half (1.5x)', multiplier: 1.5 },
  { value: '2.0', label: 'Double Time (2.0x)', multiplier: 2.0 },
  { value: 'Unpaid', label: 'Unpaid (0x)', multiplier: 0.0 },
]

export interface Job {
  id: string
  jobNumber: string
  number?: string
  jobName?: string
  name?: string
  clientName?: string
  chargeOutRate?: number
  status?: string
  displayName?: string
  jobId?: string
}

export interface Staff {
  id: string
  firstName: string
  lastName: string
  wageRate?: number
  fullName?: string
  name?: string
  avatarUrl?: string
}

export interface TimeEntry {
  id: string
  description: string
  jobPricingId?: string
  jobNumber: string
  jobName: string
  hours: number
  isBillable: boolean
  billable?: boolean
  notes: string
  rateMultiplier: number
  timesheetDate: string
  hoursSpent: number
  estimatedHours: number
  staffId: string
  items?: number
  minsPerItem?: number
  wageRate?: number
  chargeOutRate?: number
  jobId?: string
  clientName?: string
  staffName?: string
  date?: string
  startTime?: string
  endTime?: string
  rateType?: 'Ord' | '1.5' | '2.0' | 'Unpaid'
  wageAmount?: number
  billAmount?: number
  isShopJob?: boolean
  createdAt?: string
  updatedAt?: string
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
  entries: TimeEntry[]
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
}

export interface TimesheetEntryStaffMember {
  id: string
  firstName: string
  lastName: string
  wageRate: number
  fullName: string
}

export interface TimesheetEntryGridRow {
  id: number | null
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

export interface CreateTimeEntryRequest {
  staffId: string
  jobPricingId: string
  date: string
  description: string
  hours: number
  items?: number
  minsPerItem?: number
  wageRate?: number
  chargeOutRate?: number
  isBillable: boolean
  notes?: string
  rateMultiplier: number
}

export interface UpdateTimeEntryRequest {
  description?: string
  hours?: number
  items?: number
  minsPerItem?: number
  wageRate?: number
  chargeOutRate?: number
  isBillable?: boolean
  notes?: string
  rateMultiplier?: number
  jobPricingId?: string
}

export type TimesheetEntry = OptimizedTimeEntry
