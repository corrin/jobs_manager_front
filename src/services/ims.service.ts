// IMS Service - handles IMS export functionality
import apiClient from './api'

export interface IMSStaffData {
  staff_id: string
  name: string
  total_hours: number
  total_billable_hours: number
  billable_percentage: number
  total_standard_hours: number
  total_time_and_half_hours: number
  total_double_time_hours: number
  total_annual_leave_hours: number
  total_sick_leave_hours: number
  total_other_leave_hours: number
  total_leave_hours: number
  weekly_hours: Array<{
    date: string
    hours: number
    billable_hours: number
    standard_hours: number
    time_and_half_hours: number
    double_time_hours: number
    annual_leave_hours: number
    sick_leave_hours: number
    other_leave_hours: number
    overtime: number
    status: string
    leave_type?: string
    entries: Array<{
      id: string
      job_number: string
      description: string
      hours: number
      billable: boolean
      start_time?: string
      end_time?: string
    }>
  }>
}

export interface IMSExportData {
  success: boolean
  staff_data: IMSStaffData[]
  totals: {
    total_hours: number
    total_billable_hours: number
    total_standard_hours: number
    total_time_and_half_hours: number
    total_double_time_hours: number
  }
  week_days: string[]
  prev_week_url: string
  next_week_url: string
}

class IMSService {
  private baseUrl = '/api/timesheet'

  /**
   * Export timesheet data in IMS format for a specific week
   */
  async exportToIMS(startDate: Date): Promise<IMSExportData> {
    try {
      const formattedDate = this.formatDateForAPI(startDate)

      console.log('📊 Exporting to IMS for date:', formattedDate)

      // Use the dedicated IMS export endpoint
      const response = await apiClient.get(`${this.baseUrl}/ims-export/`, {
        params: {
          start_date: formattedDate,
        }
      })

      console.log('✅ IMS export successful:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error exporting to IMS:', error)
      throw error
    }
  }

  /**
   * Format date to YYYY-MM-DD format for API
   */
  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Get IMS week start date (Tuesday) for a given date
   */
  getIMSWeekStart(date: Date): Date {
    const tuesday = new Date(date)

    // If it's Monday (0), Tuesday was 6 days ago
    if (date.getDay() === 1) {
      tuesday.setDate(date.getDate() - 6)
    } else {
      // Otherwise, subtract (weekday - 1) days to get to Tuesday
      const daysToTuesday = (date.getDay() - 2 + 7) % 7
      tuesday.setDate(date.getDate() - daysToTuesday)
    }

    return tuesday
  }

  /**
   * Generate IMS week days (Tuesday to Friday + next Monday)
   */
  getIMSWeekDays(startDate: Date): Date[] {
    const tuesday = this.getIMSWeekStart(startDate)

    return [
      new Date(tuesday), // Tuesday
      new Date(tuesday.getTime() + 24 * 60 * 60 * 1000), // Wednesday
      new Date(tuesday.getTime() + 2 * 24 * 60 * 60 * 1000), // Thursday
      new Date(tuesday.getTime() + 3 * 24 * 60 * 60 * 1000), // Friday
      new Date(tuesday.getTime() + 6 * 24 * 60 * 60 * 1000), // Next Monday
    ]
  }

  /**
   * Check if IMS mode is enabled in URL params
   */
  isIMSModeFromURL(): boolean {
    const params = new URLSearchParams(window.location.search)
    return params.get('export_to_ims') === '1'
  }

  /**
   * Update URL to enable/disable IMS mode
   */
  updateURLForIMSMode(enabled: boolean): void {
    const url = new URL(window.location.href)

    if (enabled) {
      url.searchParams.set('export_to_ims', '1')
    } else {
      url.searchParams.delete('export_to_ims')
    }

    window.history.replaceState({}, '', url)
  }
}

export const imsService = new IMSService()
