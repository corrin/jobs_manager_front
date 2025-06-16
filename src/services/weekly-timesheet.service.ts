/**
 * Weekly Timesheet Service
 *
 * Service for handling weekly timesheet API operations including IMS export
 */

import api from '@/plugins/axios'

export interface WeeklyStaffData {
  staff_id: string
  name: string
  weekly_hours: WeeklyDayData[]
  total_hours: number
  total_overtime: number
  billable_percentage: number
  total_billable_hours: number
  // IMS specific fields
  total_standard_hours?: number
  total_time_and_half_hours?: number
  total_double_time_hours?: number
  total_annual_leave_hours?: number
  total_sick_leave_hours?: number
  total_other_leave_hours?: number
  total_leave_hours?: number
}

export interface WeeklyDayData {
  day: string
  hours: number
  status: string
  leave_type?: string
  // IMS specific fields
  standard_hours?: number
  time_and_half_hours?: number
  double_time_hours?: number
  unpaid_hours?: number
  overtime?: number
  leave_hours?: number
}

export interface WeeklySummary {
  total_hours: number
  billable_percentage: number
}

export interface JobMetrics {
  job_count: number
  graphic?: string // HTML chart
  total_estimated_hours?: number
  total_actual_hours?: number
  total_revenue?: number
  jobs_over_budget?: number
}

export interface WeeklyTimesheetData {
  week_days: string[]
  staff_data: WeeklyStaffData[]
  weekly_summary: WeeklySummary
  job_metrics: JobMetrics
  prev_week_url?: string
  next_week_url?: string
  start_date: string
  end_date: string
}

export interface IMSWeeklyData extends WeeklyTimesheetData {
  ims_week: string[] // Tuesday-Friday + next Monday
}

/**
 * Get weekly timesheet overview for all staff
 */
export const getWeeklyTimesheetOverview = async (startDate?: string, exportToIMS: boolean = false): Promise<WeeklyTimesheetData | IMSWeeklyData> => {
  const url = '/api/timesheet/weekly/'
  const params: any = {}

  if (startDate) {
    params.start_date = startDate
  }

  if (exportToIMS) {
    params.export_to_ims = 'true'
  }

  const response = await api.get(url, { params })
  return response.data
}

/**
 * Export weekly data to IMS format
 */
export const exportToIMS = async (startDate: string): Promise<IMSWeeklyData> => {
  const url = '/api/timesheet/weekly/'
  const params = {
    start_date: startDate,
    export_to_ims: 'true'
  }

  const response = await api.get(url, { params })
  return response.data
}

/**
 * Submit paid absence request
 */
export interface PaidAbsenceRequest {
  staff_id: string
  start_date: string
  end_date: string
  leave_type: 'annual' | 'sick' | 'other'
  hours_per_day?: number
  notes?: string
}

export const submitPaidAbsence = async (data: PaidAbsenceRequest): Promise<{ success: boolean; messages?: string[] }> => {
  const url = '/api/timesheet/weekly/'

  const response = await api.post(url, {
    staff_id: data.staff_id,
    start_date: data.start_date,
    end_date: data.end_date,
    leave_type: data.leave_type,
    hours_per_day: data.hours_per_day || 8,
    description: data.notes || ''
  })

  return response.data
}

/**
 * Get current week range
 */
export const getCurrentWeekRange = (): { startDate: string; endDate: string } => {
  const today = new Date()
  const monday = new Date(today)
  monday.setDate(today.getDate() - today.getDay() + 1)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    startDate: monday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0]
  }
}

/**
 * Calculate week range from date
 */
export const getWeekRange = (date: Date): { startDate: string; endDate: string } => {
  const monday = new Date(date)
  monday.setDate(date.getDate() - date.getDay() + 1)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  return {
    startDate: monday.toISOString().split('T')[0],
    endDate: sunday.toISOString().split('T')[0]
  }
}

/**
 * Format date for display
 */
export const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate)
  const end = new Date(endDate)

  return `${start.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short'
  })} - ${end.toLocaleDateString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })}`
}

/**
 * Format hours for display
 */
export const formatHours = (hours: number): string => {
  return hours.toFixed(1)
}

/**
 * Format percentage for display
 */
export const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(1)}%`
}

export default {
  getWeeklyTimesheetOverview,
  exportToIMS,
  submitPaidAbsence,
  getCurrentWeekRange,
  getWeekRange,
  formatDateRange,
  formatHours,
  formatPercentage
}
