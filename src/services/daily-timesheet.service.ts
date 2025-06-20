/**
 * Daily Timesheet Service
 *
 * Service for handling daily timesheet API operations with consolidated URLs
 */
import api from '@/plugins/axios'

export interface JobBreakdown {
  job_id: string
  job_number: string
  job_name: string
  client: string
  hours: number
  revenue: number
  cost: number
  is_billable: boolean
}

export interface StaffDailyData {
  staff_id: string
  staff_name: string
  staff_initials: string
  avatar_url: string | null
  scheduled_hours: number
  actual_hours: number
  billable_hours: number
  non_billable_hours: number
  total_revenue: number
  total_cost: number
  status: string
  status_class: string
  billable_percentage: number
  completion_percentage: number
  job_breakdown: JobBreakdown[]
  entry_count: number
  alerts: string[]
}

export interface DailyTotals {
  total_scheduled_hours: number
  total_actual_hours: number
  total_billable_hours: number
  total_non_billable_hours: number
  total_revenue: number
  total_cost: number
  total_entries: number
  completion_percentage: number
  billable_percentage: number
  missing_hours: number
}

export interface SummaryStats {
  total_staff: number
  complete_staff: number
  partial_staff: number
  missing_staff: number
  completion_rate: number
}

export interface DailyTimesheetSummary {
  date: string
  staff_data: StaffDailyData[]
  daily_totals: DailyTotals
  summary_stats: SummaryStats
}

/**
 * Get daily timesheet summary for all staff
 * 
 * Uses the consolidated timesheet API endpoint
 */
export const getDailyTimesheetSummary = async (date?: string): Promise<DailyTimesheetSummary> => {
  const url = date 
    ? `/timesheets/api/daily/${date}/`
    : '/timesheets/api/daily/'
  
  const response = await api.get(url)
  return response.data
}

/**
 * Get detailed timesheet data for a specific staff member
 * Note: This endpoint might not be available yet in the backend
 */
export const getStaffDailyDetail = async (staffId: string, date?: string): Promise<StaffDailyData> => {
  // Based on the URL patterns in timesheet/urls.py, this would be the correct path
  const url = `/timesheets/api/staff/${staffId}/daily/`
  const params = date ? { date } : {}

  const response = await api.get(url, { params })
  return response.data
}

/**
 * Format hours for display
 */
export const formatHours = (hours: number): string => {
  return hours.toFixed(1)
}

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`
}

/**
 * Get status badge variant for UI components
 */
export const getStatusVariant = (statusClass: string): string => {
  const variants: Record<string, string> = {
    'success': 'success',
    'warning': 'warning',
    'danger': 'destructive',
    'secondary': 'secondary'
  }
  return variants[statusClass] || 'secondary'
}

export default {
  getDailyTimesheetSummary,
  getStaffDailyDetail,
  formatHours,
  formatCurrency,
  getStatusVariant
}
