import apiClient from './api'

// Legacy interfaces - keeping for backward compatibility
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
  start_date: string
  mode?: 'timesheet' | 'ims'
}

// New interfaces for accounting API
export interface DayKPI {
  date: string
  day: number
  holiday: boolean
  billable_hours: number
  total_hours: number
  shop_hours: number
  gross_profit: number
  color: 'green' | 'amber' | 'red'
  details: DayDetails
}

export interface DayDetails {
  time_revenue: number
  material_revenue: number
  total_revenue: number
  staff_cost: number
  material_cost: number
  total_cost: number
  job_breakdown: JobBreakdown[]
}

export interface JobBreakdown {
  job_id: string
  job_number: number
  job_display_name: string
  labour_profit: number
  material_profit: number
  adjustment_profit: number
  total_profit: number
}

export interface MonthlyTotals {
  billable_hours: number
  total_hours: number
  gross_profit: number
  net_profit: number
  working_days: number
  days_green: number
  days_amber: number
  days_red: number
}

export interface Thresholds {
  billable_threshold_green: number
  billable_threshold_amber: number
  daily_gp_target: number
  shop_hours_target: number
}

export interface KPICalendarResponse {
  calendar_data: Record<string, DayKPI>
  monthly_totals: MonthlyTotals
  thresholds: Thresholds
  year: number
  month: number
}

export interface KPIAccountingParams {
  year?: number
  month?: number
}

class KPIService {
  private baseUrl = '/timesheet/api'
  private accountingBaseUrl = '/accounting/api'

  // Legacy method - keeping for backward compatibility
  async getKPICalendarData(params: KPICalendarParams): Promise<KPICalendarData> {
    try {
      const searchParams = new URLSearchParams({
        start_date: params.start_date,
        ...(params.mode && { mode: params.mode }),
      })

      const response = await apiClient.get(`${this.baseUrl}/kpi-calendar/?${searchParams}`)
      return response.data
    } catch (error) {
      console.error('❌ Error fetching KPI calendar data:', error)
      throw error
    }
  }

  // New method for accounting API
  async getAccountingKPICalendarData(
    params: KPIAccountingParams = {},
  ): Promise<KPICalendarResponse> {
    try {
      const searchParams = new URLSearchParams()
      if (params.year) searchParams.append('year', params.year.toString())
      if (params.month) searchParams.append('month', params.month.toString())

      const queryString = searchParams.toString()
      const url = `${this.accountingBaseUrl}/reports/calendar/${queryString ? `?${queryString}` : ''}`

      const response = await apiClient.get(url)
      return response.data
    } catch (error) {
      console.error('❌ Error fetching accounting KPI calendar data:', error)
      throw error
    }
  }

  formatDateForAPI(date: Date): string {
    return date.toISOString().split('T')[0]
  }

  // Helper methods for the new accounting API
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
    }).format(value)
  }

  formatHours(hours: number): string {
    const wholeHours = Math.floor(hours)
    const minutes = Math.round((hours - wholeHours) * 60)
    return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`
  }

  formatPercentage(value: number): string {
    return `${Math.round(value)}%`
  }

  getPerformanceRating(daysGreen: number, daysAmber: number, daysRed: number): string {
    const totalDays = daysGreen + daysAmber + daysRed
    if (totalDays === 0) return '0'
    const greenPercentage = (daysGreen / totalDays) * 100
    return Math.round(greenPercentage).toString()
  }

  getMonthName(month: number): string {
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]
    return months[month - 1] || 'Unknown'
  }

  getWeekStart(date: Date): Date {
    const weekStart = new Date(date)
    const day = weekStart.getDay()
    const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
    weekStart.setDate(diff)
    return weekStart
  }

  getWeekDays(startDate: Date): Date[] {
    const days = []
    for (let i = 0; i < 5; i++) {
      const day = new Date(startDate)
      day.setDate(startDate.getDate() + i)
      days.push(day)
    }
    return days
  }

  getIMSWeekDays(startDate: Date): Date[] {
    const days = []

    const tuesday = new Date(startDate)
    const dayOfWeek = tuesday.getDay()
    const daysToTuesday = dayOfWeek === 0 ? 2 : (2 - dayOfWeek + 7) % 7
    tuesday.setDate(tuesday.getDate() + daysToTuesday)

    for (let i = 0; i < 4; i++) {
      const day = new Date(tuesday)
      day.setDate(tuesday.getDate() + i)
      days.push(day)
    }

    const nextMonday = new Date(tuesday)
    nextMonday.setDate(tuesday.getDate() + 5)
    days.push(nextMonday)

    return days
  }
}

export const kpiService = new KPIService()
export default kpiService
