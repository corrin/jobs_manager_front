import api from '@/plugins/axios'
import type { Staff, Job, WeeklyOverviewData } from '@/types/timesheet.types'
import type { CostLine } from '@/types/costing.types'
import { debugLog } from '../utils/debug'

export class TimesheetService {
  private static readonly BASE_URL = '/timesheets/api'
  private static readonly MODERN_BASE_URL = '/job/rest/timesheet'

  static async getStaff(): Promise<Staff[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/staff/`)
      const rawStaff = response.data.staff || []

      // Get company defaults for fallback wage rate
      let defaultWageRate = 32
      try {
        const defaultsResponse = await api.get('/job/rest/company-defaults/')
        defaultWageRate = parseFloat(defaultsResponse.data.wage_rate || '32') || 32
      } catch {
        debugLog('Could not fetch company defaults, using fallback wage rate:', defaultWageRate)
      }

      // Normalize staff data to ensure consistent field names
      const normalizedStaff = rawStaff.map(
        (staff: {
          id: string
          firstName?: string
          first_name?: string
          lastName?: string
          last_name?: string
          wageRate?: string | number
          wage_rate?: string | number
          fullName?: string
          full_name?: string
          name?: string
          avatarUrl?: string
          avatar_url?: string
        }) => ({
          id: staff.id,
          firstName: staff.firstName || staff.first_name || 'Unknown',
          lastName: staff.lastName || staff.last_name || '',
          wageRate:
            parseFloat(String(staff.wageRate || staff.wage_rate || defaultWageRate)) ||
            defaultWageRate,
          fullName:
            staff.fullName ||
            staff.full_name ||
            `${staff.firstName || staff.first_name || 'Unknown'} ${staff.lastName || staff.last_name || ''}`.trim(),
          name:
            staff.name ||
            staff.fullName ||
            staff.full_name ||
            `${staff.firstName || staff.first_name || 'Unknown'} ${staff.lastName || staff.last_name || ''}`.trim(),
          avatarUrl: staff.avatarUrl || staff.avatar_url,
        }),
      )

      debugLog('👥 Staff normalized for timesheet:', {
        count: normalizedStaff.length,
        sample: normalizedStaff[0],
        defaultWageRate,
        keys: normalizedStaff[0] ? Object.keys(normalizedStaff[0]) : [],
      })

      return normalizedStaff
    } catch (error) {
      debugLog('Error fetching staff:', error)
      throw error
    }
  }

  // Legacy method - use CostLine queries instead
  static async getTimeEntries(staffId: string, date: string): Promise<CostLine[]> {
    try {
      // Use modern CostLine-based API
      const response = await api.get(`${this.MODERN_BASE_URL}/cost-lines/`, {
        params: { staff_id: staffId, date, kind: 'time' },
      })
      return response.data.cost_lines || response.data.lines || []
    } catch (error) {
      debugLog('Error fetching cost lines:', error)
      throw error
    }
  }

  static async getJobs(): Promise<Job[]> {
    try {
      const response = await api.get(`${this.BASE_URL}/jobs/`)
      const rawJobs = response.data.jobs || []

      // Normalize job data to ensure consistent field names
      const normalizedJobs = rawJobs.map(
        (job: {
          id: string
          job_number?: string | number
          name?: string
          client_name?: string
          charge_out_rate?: string | number
          status?: string
        }) => ({
          id: job.id,
          jobNumber: job.job_number?.toString() || 'N/A',
          number: job.job_number?.toString() || 'N/A',
          name: job.name || 'Unnamed Job',
          jobName: job.name || 'Unnamed Job',
          clientName: job.client_name || 'No Client',
          chargeOutRate: parseFloat(String(job.charge_out_rate || '0')) || 0,
          status: job.status || 'unknown',
          displayName: `${job.job_number || 'N/A'} - ${job.name || 'Unnamed Job'}`,
          jobId: job.id,
        }),
      )

      debugLog('📋 Jobs normalized for timesheet:', {
        count: normalizedJobs.length,
        sample: normalizedJobs[0],
        keys: normalizedJobs[0] ? Object.keys(normalizedJobs[0]) : [],
      })

      return normalizedJobs
    } catch (error) {
      debugLog('Error fetching jobs:', error)
      throw error
    }
  }

  static async getWeeklyOverview(startDate: string): Promise<WeeklyOverviewData> {
    try {
      const response = await api.get(`${this.BASE_URL}/weekly-overview/`, {
        params: { start_date: startDate },
      })
      return response.data
    } catch (error) {
      debugLog('Error fetching weekly overview:', error)
      throw error
    }
  }

  static getCurrentWeekRange(): { startDate: string; endDate: string } {
    const today = new Date()
    const monday = new Date(today)
    monday.setDate(today.getDate() - today.getDay() + 1)

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)

    return {
      startDate: monday.toISOString().split('T')[0],
      endDate: sunday.toISOString().split('T')[0],
    }
  }

  static formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-NZ', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  static formatHours(hours: number): string {
    return hours.toFixed(2)
  }

  static async getStaffList(): Promise<Staff[]> {
    return this.getStaff()
  }

  static async getAvailableJobs(): Promise<Job[]> {
    return this.getJobs()
  }

  static async exportToIMS(weekStart: Date): Promise<string> {
    debugLog('IMS export not yet implemented for:', weekStart)
    return 'IMS export functionality coming soon'
  }
}
