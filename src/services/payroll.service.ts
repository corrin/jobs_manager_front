// src/services/payroll.service.ts

import { api } from '@/api/client'
import { schemas } from '@/api/generated/api'
import type { z } from 'zod'
import axios from '@/plugins/axios'

export type CreatePayRunResponse = z.infer<typeof schemas.CreatePayRunResponse>
export type PostStaffWeekResponse = z.infer<typeof schemas.PostWeekToXeroResponse>
export type PayRunDetails = z.infer<typeof schemas.PayRunDetails>
export type PayRunForWeekResponse = z.infer<typeof schemas.PayRunForWeekResponse>
export type PayRunSyncResult = z.infer<typeof schemas.PayRunSyncResponse>

/**
 * Create a new pay run for the specified week.
 *
 * @param weekStartDate - Monday of the week (YYYY-MM-DD format)
 * @returns Pay run details including ID and payment date
 * @throws Error if pay run already exists, invalid date, or Xero API error
 */
export async function createPayRun(weekStartDate: string): Promise<CreatePayRunResponse> {
  const response = await api.timesheets_api_payroll_pay_runs_create_create({
    body: {
      week_start_date: weekStartDate,
    },
  })
  return response as CreatePayRunResponse
}

/**
 * Post a staff member's weekly timesheet to Xero Payroll.
 *
 * @param staffId - UUID of the staff member
 * @param weekStartDate - Monday of the week (YYYY-MM-DD format)
 * @returns Posting results including hours breakdown and any errors
 */
export async function postStaffWeek(
  staffId: string,
  weekStartDate: string,
): Promise<PostStaffWeekResponse> {
  const response = await api.timesheets_api_payroll_post_staff_week_create({
    staff_id: staffId,
    week_start_date: weekStartDate,
  })
  return response as PostStaffWeekResponse
}

/**
 * Fetch the pay run (if any) that already exists for a given week.
 *
 * @param weekStartDate - Monday of the requested week (YYYY-MM-DD)
 * @returns Whether a pay run exists and its details when present.
 */
export async function fetchPayRunForWeek(weekStartDate: string): Promise<PayRunForWeekResponse> {
  const response = await api.timesheets_api_payroll_pay_runs_retrieve({
    queries: { week_start_date: weekStartDate },
  })
  return response as PayRunForWeekResponse
}

/**
 * Refresh cached pay runs from Xero and return synchronization stats.
 *
 * @param weekStartDate - Monday of the requested week (YYYY-MM-DD)
 * @returns Counts of fetched/created/updated pay runs from Xero.
 */
export async function refreshPayRuns(weekStartDate: string): Promise<PayRunSyncResult> {
  const response = await axios.post('/timesheets/api/payroll/pay-runs/refresh', {
    week_start_date: weekStartDate,
  })
  return response.data as PayRunSyncResult
}

/**
 * Get user-friendly error message for Xero payroll errors.
 * Maps backend error messages to helpful user-facing text.
 */
export function getPayrollErrorMessage(error: string): string {
  const errorMappings: Record<string, string> = {
    'week_start_date must be a Monday': 'Invalid date selected. Please select a Monday.',
    'No pay run found for week':
      'Please create a pay run for this week first using the "Create Pay Run" button above.',
    'is already Posted and cannot be modified':
      "This week's payroll has already been finalized and paid. You cannot modify locked pay runs. Contact payroll if corrections are needed.",
    'does not have a xero_user_id':
      'This staff member is not linked to Xero. Please contact your administrator to configure Xero integration for this user.',
    'There can only be one draft pay run':
      'Another draft pay run exists for a different week. Please complete or delete it in Xero before creating a new one.',
  }

  // Check for partial matches
  for (const [key, message] of Object.entries(errorMappings)) {
    if (error.includes(key)) {
      return message
    }
  }

  // Check for connection/auth errors
  if (
    error.toLowerCase().includes('connection') ||
    error.toLowerCase().includes('auth') ||
    error.toLowerCase().includes('unauthorized')
  ) {
    return 'Unable to connect to Xero. Please try again or contact support if the problem persists.'
  }

  // Default: return the original error
  return error
}
