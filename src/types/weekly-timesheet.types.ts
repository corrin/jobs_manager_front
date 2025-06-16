export interface DailyHours {
  date: string
  hours: number
  isBillable: boolean
}

export interface JobBreakdown {
  jobId: string
  jobName: string
  jobNumber: string
  clientName: string
  totalHours: number
  billableHours: number
  nonBillableHours: number
  revenue: number
  cost: number
  hourlyRate: number
  status: 'active' | 'completed' | 'on-hold' | 'cancelled'
  dailyHours: DailyHours[]
}

export interface WeeklyStaffData {
  staffId: string
  staffName: string
  staffInitials: string
  avatarUrl?: string

  // Weekly totals
  scheduledHours: number
  actualHours: number
  billableHours: number
  nonBillableHours: number
  totalRevenue: number
  totalCost: number

  // Daily breakdown (Mon-Sun)
  dailyHours: number[]
  dailyStatus: string[]

  // Status and metrics
  status: 'Complete' | 'Partial' | 'Missing' | 'Overtime' | 'No Entry'
  statusClass: 'success' | 'warning' | 'danger' | 'info'
  completionPercentage: number
  billablePercentage: number
  efficiencyRating: number

  // Job breakdown
  jobBreakdown: JobBreakdown[]
  entryCount: number

  // Alerts and issues
  alerts: string[]
  hasIssues: boolean
}

export interface WeeklyTotals {
  totalScheduledHours: number
  totalActualHours: number
  totalBillableHours: number
  totalNonBillableHours: number
  totalRevenue: number
  totalCost: number
  totalEntries: number

  // Percentages
  completionPercentage: number
  billablePercentage: number
  utilizationRate: number

  // Missing data
  missingHours: number
  overtimeHours: number
}

export interface WeeklySummaryStats {
  totalStaff: number
  completeStaff: number
  partialStaff: number
  missingStaff: number
  overtimeStaff: number

  // Rates
  completionRate: number
  participationRate: number
  averageHoursPerStaff: number

  // Job statistics
  activeJobs: number
  totalJobsWorked: number
  averageJobsPerStaff: number
}

export interface WeeklyProjectBreakdown {
  jobId: string
  jobName: string
  jobNumber: string
  clientName: string
  totalHours: number
  billableHours: number
  revenue: number
  staffCount: number
  completionPercentage: number
  status: string
  priority: 'high' | 'medium' | 'low'
}

export interface WeeklySummaryData {
  weekStartDate: string
  weekEndDate: string
  weekNumber: number
  year: number

  // Main data arrays
  staffData: WeeklyStaffData[]
  weeklyTotals: WeeklyTotals
  summaryStats: WeeklySummaryStats

  // Additional breakdowns
  jobBreakdown: WeeklyProjectBreakdown[]
  topPerformers: WeeklyStaffData[]

  // Flags and settings
  isCurrentWeek: boolean
  hasData: boolean

  // IMS Export specific data
  imsExportData?: {
    enabled: boolean
    exportUrl?: string
    lastExportDate?: string
    totalRecords: number
    exportFormat: 'csv' | 'excel' | 'json'
  }
}

// API Response types
export interface WeeklyTimesheetApiResponse {
  success: boolean
  data: WeeklySummaryData
  message?: string
  errors?: string[]
}

export interface WeekNavigationData {
  currentWeek: {
    start: string
    end: string
    weekNumber: number
    year: number
  }
  previousWeek: {
    start: string
    end: string
  }
  nextWeek: {
    start: string
    end: string
  }
  isCurrentWeek: boolean
  isFutureWeek: boolean
}

// IMS Export types
export interface IMSExportConfig {
  enabled: boolean
  includeNonBillable: boolean
  includeCostData: boolean
  includeJobBreakdown: boolean
  format: 'csv' | 'excel' | 'json'
  dateRange: {
    start: string
    end: string
  }
}

export interface IMSExportResult {
  success: boolean
  downloadUrl?: string
  filename?: string
  recordCount: number
  exportDate: string
  errors?: string[]
}

// Filter and search types
export interface WeeklyFilters {
  staffIds: string[]
  jobIds: string[]
  departments: string[]
  statusFilter: string[]
  hoursRange: {
    min: number
    max: number
  }
  showOnlyWithIssues: boolean
  showOnlyBillable: boolean
}

// Modal state types
export interface ModalState {
  metrics: boolean
  staffDetail: boolean
  jobBreakdown: boolean
  imsExport: boolean
}

// Chart data types for metrics
export interface ChartDataPoint {
  label: string
  value: number
  color?: string
}

export interface WeeklyChartData {
  hoursDistribution: ChartDataPoint[]
  revenueByJob: ChartDataPoint[]
  staffProductivity: ChartDataPoint[]
  dailyTrends: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
    }[]
  }
}
