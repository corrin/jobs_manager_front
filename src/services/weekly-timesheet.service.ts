import api from '@/plugins/axios'
import { dateService } from '@/services/date.service'

export interface WeeklyStaffData {
  staff_id: string
  name: string
  weekly_hours: WeeklyDayData[]
  total_hours: number
  total_overtime: number
  billable_percentage: number
  total_billable_hours: number

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
  graphic?: string
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
  ims_week: string[]
}

interface WeeklyTimesheetParams {
  start_date?: string
  export_to_ims?: 'true'
}

export const getWeeklyTimesheetOverview = async (
  startDate?: string,
  exportToIMS: boolean = false,
): Promise<WeeklyTimesheetData | IMSWeeklyData> => {
  const url = '/timesheets/api/weekly/'
  const params: WeeklyTimesheetParams = {}

  if (startDate) {
    params.start_date = startDate
  }

  if (exportToIMS) {
    params.export_to_ims = 'true'
  }

  const response = await api.get<WeeklyTimesheetData | IMSWeeklyData>(url, { params })
  return response.data
}

export const exportToIMS = async (startDate: string): Promise<IMSWeeklyData> => {
  const url = '/timesheets/api/weekly/'
  const params = {
    start_date: startDate,
    export_to_ims: 'true' as const,
  }

  const response = await api.get<IMSWeeklyData>(url, { params })
  return response.data
}

export interface PaidAbsenceRequest {
  staff_id: string
  start_date: string
  end_date: string
  leave_type: 'annual' | 'sick' | 'other'
  hours_per_day?: number
  notes?: string
}

export const submitPaidAbsence = async (
  data: PaidAbsenceRequest,
): Promise<{ success: boolean; messages?: string[] }> => {
  const url = '/timesheets/api/weekly/'

  const response = await api.post<{ success: boolean; messages?: string[] }>(url, {
    staff_id: data.staff_id,
    start_date: data.start_date,
    end_date: data.end_date,
    leave_type: data.leave_type,
    hours_per_day: data.hours_per_day || 8,
    description: data.notes || '',
  })

  return response.data
}

export const getCurrentWeekRange = (): { startDate: string; endDate: string } => {
  const weekRange = dateService.getCurrentWeekRange()
  return {
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
  }
}

export const getWeekRange = (date: Date): { startDate: string; endDate: string } => {
  const weekRange = dateService.getWeekRange(date)
  return {
    startDate: weekRange.startDate,
    endDate: weekRange.endDate,
  }
}

export const formatDateRange = (startDate: string, endDate: string): string => {
  return dateService.formatDateRange(startDate, endDate)
}

export const formatHours = (hours: number): string => {
  return hours.toFixed(1)
}

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
  formatPercentage,
}
