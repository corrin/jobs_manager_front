// src/services/weekly-timesheet.service.ts

import { api } from '@/api/client'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'
import { dateService } from '@/services/date.service'

type WeeklyTimesheetData = z.infer<typeof schemas.WeeklyTimesheetData>

/**
 * Fetch weekly timesheet overview.
 * Includes all payroll breakdown data (billed/unbilled/overtime/leave).
 */
export async function fetchWeeklyOverview(startDate?: string): Promise<WeeklyTimesheetData> {
  const queries: Record<string, string> = {}
  if (startDate) {
    queries.start_date = startDate
  }
  const response = await api.timesheets_api_weekly_retrieve({ queries })
  return response
}

/**
 * Submit a paid absence.
 */
export async function submitPaidAbsence(params: {
  staff_id: string
  start_date: string
  end_date: string
  leave_type: 'annual' | 'sick' | 'other'
  hours_per_day?: number
  notes?: string
}): Promise<{ success: boolean; messages?: string[] }> {
  const payload = {
    staff_id: params.staff_id,
    start_date: params.start_date,
    end_date: params.end_date,
    leave_type: params.leave_type,
    hours_per_day: params.hours_per_day ?? 8,
    description: params.notes ?? '',
  }
  const response = await api.timesheets_api_weekly_create({ body: payload })
  return response as { success: boolean; messages?: string[] }
}

/**
 * Get the current week’s start/end dates.
 */
export function getCurrentWeekRange(): { startDate: string; endDate: string } {
  const { startDate, endDate } = dateService.getCurrentWeekRange()
  return { startDate, endDate }
}

/**
 * Get the week’s start/end dates for an arbitrary date.
 */
export function getWeekRange(date: Date): { startDate: string; endDate: string } {
  const { startDate, endDate } = dateService.getWeekRange(date)
  return { startDate, endDate }
}

/**
 * Format a date range as a human-readable string.
 */
export function formatDateRange(startDate: string, endDate: string): string {
  return dateService.formatDateRange(startDate, endDate)
}

/**
 * Format hours with one decimal.
 * API always returns numeric values.
 */
export function formatHours(hours: number): string {
  // Handle invalid values
  if (isNaN(hours)) {
    console.warn('formatHours received invalid value:', hours)
    return '0.0'
  }

  return hours.toFixed(1)
}

/**
 * Format a percentage with one decimal.
 * API always returns numeric values.
 */
export function formatPercentage(percentage: number): string {
  // Handle invalid values
  if (isNaN(percentage)) {
    console.warn('formatPercentage received invalid value:', percentage)
    return '0.0%'
  }

  return `${percentage.toFixed(1)}%`
}

export default {
  fetchWeeklyOverview,
  submitPaidAbsence,
  getCurrentWeekRange,
  getWeekRange,
  formatDateRange,
  formatHours,
  formatPercentage,
}
