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

export const getDailyTimesheetSummary = async (date?: string): Promise<DailyTimesheetSummary> => {
  const url = date ? `/timesheets/api/daily/${date}/` : '/timesheets/api/daily/'

  const response = await api.get(url)
  return response.data
}

export const getStaffDailyDetail = async (
  staffId: string,
  date?: string,
): Promise<StaffDailyData> => {
  const url = `/timesheets/api/staff/${staffId}/daily/`
  const params = date ? { date } : {}

  const response = await api.get(url, { params })
  return response.data
}

export const formatHours = (hours: number): string => {
  return hours.toFixed(1)
}

export const formatCurrency = (amount: number): string => {
  return `$${amount.toFixed(2)}`
}

export const getStatusVariant = (statusClass: string): string => {
  const variants: Record<string, string> = {
    success: 'success',
    warning: 'warning',
    danger: 'destructive',
    secondary: 'secondary',
  }
  return variants[statusClass] || 'secondary'
}

export default {
  getDailyTimesheetSummary,
  getStaffDailyDetail,
  formatHours,
  formatCurrency,
  getStatusVariant,
}
