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
  private baseUrl = '/timesheets/api'

  async exportToIMS(startDate: Date): Promise<IMSExportData> {
    try {
      const formattedDate = this.formatDateForAPI(startDate)

      console.log('📊 Exporting to IMS for date:', formattedDate)

      const response = await apiClient.get(`${this.baseUrl}/ims-export/`, {
        params: {
          start_date: formattedDate,
        },
      })

      console.log('✅ IMS export successful:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ Error exporting to IMS:', error)
      throw error
    }
  }

  private formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  getIMSWeekStart(date: Date): Date {
    const tuesday = new Date(date)

    if (date.getDay() === 1) {
      tuesday.setDate(date.getDate() - 6)
    } else {
      const daysToTuesday = (date.getDay() - 2 + 7) % 7
      tuesday.setDate(date.getDate() - daysToTuesday)
    }

    return tuesday
  }

  getIMSWeekDays(startDate: Date): Date[] {
    const tuesday = this.getIMSWeekStart(startDate)

    return [
      new Date(tuesday),
      new Date(tuesday.getTime() + 24 * 60 * 60 * 1000),
      new Date(tuesday.getTime() + 2 * 24 * 60 * 60 * 1000),
      new Date(tuesday.getTime() + 3 * 24 * 60 * 60 * 1000),
      new Date(tuesday.getTime() + 6 * 24 * 60 * 60 * 1000),
    ]
  }

  isIMSModeFromURL(): boolean {
    const params = new URLSearchParams(window.location.search)
    return params.get('export_to_ims') === '1'
  }

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
