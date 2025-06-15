/**
 * TypeScript type definitions for the timesheet system
 */

export interface Staff {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  role?: string
  wageRate?: number
  scheduledHours?: number
  avatarUrl?: string | null
  isActive?: boolean
}

export interface Job {
  id: string
  jobId?: string
  jobNumber: string
  jobName: string
  name?: string
  number?: string  // Legacy compatibility field
  taskName?: string
  category?: string
  displayName: string
  clientName?: string
  clientId?: string
  estimatedHours: number
  totalHours?: number
  hoursSpent?: number
  status?: string
  chargeOutRate: number
  isBillable?: boolean
  isShopJob?: boolean
  isActive?: boolean
}

export interface TimeEntry {
  id: string
  description: string
  jobPricingId: string
  jobNumber: string
  jobName: string
  hours: number
  isBillable: boolean
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
  // Legacy compatibility
  jobId?: string
  clientName?: string
  staffName?: string
  date?: string // YYYY-MM-DD format
  startTime?: string // HH:MM format
  endTime?: string // HH:MM format
  billable?: boolean
  rateType?: 'Ord' | '1.5' | '2.0' | 'Unpaid'
  wageAmount?: number
  billAmount?: number
  isShopJob?: boolean
  createdAt?: string
  updatedAt?: string
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

export interface WeeklyOverviewData {
  startDate: string
  endDate: string
  staffData: Array<{
    staff: {
      id: string
      name: string
      firstName: string
      lastName: string
    }
    days: Record<string, {
      date: string
      entries: TimeEntry[]
      dailyTotal: number
    }>
    weeklyTotal: number
  }>
}

export interface DayData {
  date: string
  hours: number
  billableHours: number
  nonBillableHours: number
  status: 'Complete' | 'Partial' | 'Empty' | 'Leave'
  leaveType?: 'Annual' | 'Sick' | 'Other'
  leaveHours?: number
  overtime?: number
  entries: TimeEntry[]
}

export interface WeeklyStaffData {
  staff: Staff
  weeklyHours: DayData[]
  totalHours: number
  billablePercentage: number
  totalStandardHours: number
  totalOvertimeHours: number
  totalLeaveHours: number
}

export interface TimesheetStats {
  totalHours: number
  billableHours: number
  nonBillableHours: number
  billablePercentage: number
  totalProjects: number
  activeProjects: number
  averageHoursPerDay: number
  productivityScore: number
}

export interface WeekSummary {
  weekStart: Date
  weekEnd: Date
  staffData: WeeklyStaffData[]
  totalHours: number
  averageBillablePercentage: number
  totalProjects: number
  topProjects: { job: Job; hours: number }[]
}
