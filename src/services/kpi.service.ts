import apiClient from './api'

export interface KPIDay {
  date: string
  total_hours: number
  billable_hours: number
  revenue: number
  costs: number
  profit: number
  profit_margin: number
  status: 'green' | 'amber' | 'red' | 'neutral'
  entries_count: number
  staff_count: number
}

export interface KPICalendarData {
  calendar_data: Record<string, KPIDay>
  monthly_totals: {
    total_hours: number
    billable_hours: number
    revenue: number
    costs: number
    profit: number
  }
  thresholds: {
    profit_margin: {
      green: number
      amber: number
      red: number
    }
    utilization: {
      green: number
      amber: number
      red: number
    }
  }
  mode: 'timesheet' | 'ims'
}

export interface KPICalendarParams {
  start_date: string // YYYY-MM-DD format
  mode?: 'timesheet' | 'ims'
}

class KPIService {
  private baseUrl = '/timesheet/api'

  /**
   * Get KPI calendar data for a specific week
   */
  async getKPICalendarData(params: KPICalendarParams): Promise<KPICalendarData> {
    try {
      const searchParams = new URLSearchParams({
        start_date: params.start_date,
        ...(params.mode && { mode: params.mode })
      })

      const response = await apiClient.get(`${this.baseUrl}/kpi-calendar/?${searchParams}`)
      return response.data
    } catch (error) {
      console.error('❌ Error fetching KPI calendar data:', error)
      throw error
    }
  }

  /**
   * Format date to YYYY-MM-DD format for API
   */
  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  /**
   * Get week start date (Monday) for a given date
   */
  getWeekStart(date: Date): Date {
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is Sunday
    weekStart.setDate(diff)
    return weekStart
  }

  /**
   * Generate week days from start date
   */
  getWeekDays(startDate: Date): Date[] {
    const days = []
    for (let i = 0; i < 5; i++) { // Monday to Friday
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  /**
   * Generate IMS week days (Tuesday to Friday + next Monday)
   */
  getIMSWeekDays(startDate: Date): Date[] {
    const days = []

    // Start from Tuesday of the current week
    const tuesday = new Date(startDate)
    const dayOfWeek = tuesday.getDay()
    const daysToTuesday = dayOfWeek === 0 ? 2 : (2 - dayOfWeek + 7) % 7
    tuesday.setDate(tuesday.getDate() + daysToTuesday)

    // Tuesday to Friday
    for (let i = 0; i < 4; i++) {
      const day = new Date(tuesday)
      day.setDate(tuesday.getDate() + i)
      days.push(day)
    }

    // Next Monday
    const nextMonday = new Date(tuesday)
    nextMonday.setDate(tuesday.getDate() + 5)
    days.push(nextMonday)

    return days
  }
}

export const kpiService = new KPIService()
